import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  is_resolved: z.boolean(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: issueId } = await params
    const body = await request.json()
    const { is_resolved } = schema.parse(body)

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify user is a reporter on this issue
    const { data: report } = await supabase
      .from('reports')
      .select('id')
      .eq('issue_id', issueId)
      .eq('user_id', user.id)
      .single()

    if (!report) {
      return NextResponse.json({ error: 'Only reporters can vote on resolution' }, { status: 403 })
    }

    // Upsert the confirmation vote
    const { error } = await supabase
      .from('resolution_confirmations')
      .upsert(
        { issue_id: issueId, user_id: user.id, is_resolved },
        { onConflict: 'issue_id,user_id' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof (await import('zod')).ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
