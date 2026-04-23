import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit({ key: `gov:signin:${ip}`, limit: 10, windowMs: 60 * 60 * 1000 })
  if (!rl.success) return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 })

  try {
    const body = await request.json()
    const { email, password } = schema.parse(body)

    const response = NextResponse.json({ success: true })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })

    // Verify this user is an active government official
    const { data: govUser } = await supabase
      .from('government_users')
      .select('id, is_active')
      .eq('auth_user_id', data.user.id)
      .single()

    if (!govUser || !govUser.is_active) {
      await supabase.auth.signOut()
      return NextResponse.json({ error: 'Access denied. Your account is not authorised for this portal.' }, { status: 403 })
    }

    return response
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
