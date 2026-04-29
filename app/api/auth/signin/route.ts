import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export async function POST(request: NextRequest) {
  // Rate limit: 10 attempts per IP per 15 minutes to prevent credential stuffing
  const ip = getClientIp(request)
  const rl = rateLimit({ key: `auth:signin:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait before trying again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  try {
    const body = await request.json()
    const { email, password } = schema.parse(body)

    // Also rate limit per email — 5 attempts per email per 15 minutes
    const emailRl = rateLimit({ key: `auth:signin:email:${email.toLowerCase()}`, limit: 5, windowMs: 15 * 60 * 1000 })
    if (!emailRl.success) {
      return NextResponse.json(
        { error: 'Too many login attempts for this account. Please wait 15 minutes or reset your password.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((emailRl.resetAt - Date.now()) / 1000)) } }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Return the same generic message for all auth failures — never reveal
      // whether the email exists or whether the address is unconfirmed.
      // This prevents account enumeration via error differentiation.
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user has completed profile setup
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({
      success: true,
      needsProfile: !profile,
      user: data.user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
