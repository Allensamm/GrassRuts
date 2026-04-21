import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { isDisposableEmail } from '@/lib/disposable-emails'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .refine(p => /[A-Z]/.test(p), 'Password must contain at least one uppercase letter')
    .refine(p => /[a-z]/.test(p), 'Password must contain at least one lowercase letter')
    .refine(p => /[0-9]/.test(p), 'Password must contain at least one number'),
})

export async function POST(request: NextRequest) {
  // Rate limit: 5 signups per IP per hour to slow down bulk account creation
  const ip = getClientIp(request)
  const rl = rateLimit({ key: `auth:signup:${ip}`, limit: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many accounts created from this address. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const body = await request.json()
    const { email, password } = schema.parse(body)

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: 'Temporary or disposable email addresses are not allowed. Please use a permanent email.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/api/auth/confirm`,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Check if user already has a profile
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user!.id)
      .single()

    return NextResponse.json({
      success: true,
      needsProfile: !existingProfile,
      user: data.user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
