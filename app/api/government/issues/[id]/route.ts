import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  update_type: z.enum(['acknowledged', 'in_progress', 'resolved', 'rejected']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: issueId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: govUser } = await supabase
      .from('government_users')
      .select('id, is_active, lga_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!govUser?.is_active) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

    const body = await request.json()
    const { update_type, message } = schema.parse(body)

    // Post the update
    const { error: updateError } = await supabase
      .from('issue_updates')
      .insert({ issue_id: issueId, government_user_id: govUser.id, update_type, message })

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Update issue status if resolved or in_progress
    if (update_type === 'resolved') {
      await supabase.from('issues').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', issueId)
    } else if (update_type === 'in_progress') {
      await supabase.from('issues').update({ status: 'in_review' }).eq('id', issueId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
