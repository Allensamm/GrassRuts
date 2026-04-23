import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  body: z.string().min(2, 'Comment too short').max(500, 'Comment too long'),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select('id, body, created_at, users(full_name, avatar_url)')
    .eq('issue_id', id)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request)
  const rl = rateLimit({ key: `comments:${ip}`, limit: 20, windowMs: 60 * 60 * 1000 })
  if (!rl.success) return NextResponse.json({ error: 'Too many comments. Slow down.' }, { status: 429 })

  try {
    const { id: issueId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { body: commentBody } = schema.parse(body)

    const { data, error } = await supabase
      .from('comments')
      .insert({ issue_id: issueId, user_id: user.id, body: commentBody })
      .select('id, body, created_at, users(full_name, avatar_url)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
