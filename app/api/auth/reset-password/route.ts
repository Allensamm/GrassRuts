import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(8).max(128)
    .refine(p => /[A-Z]/.test(p), 'Must contain uppercase')
    .refine(p => /[a-z]/.test(p), 'Must contain lowercase')
    .refine(p => /[0-9]/.test(p), 'Must contain a number'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = schema.parse(body)
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({ password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
