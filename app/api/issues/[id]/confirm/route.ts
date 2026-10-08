import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  is_resolved: z.boolean(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: issueId } = await params
    if (!z.uuid().safeParse(issueId).success)
      return NextResponse.json({ error: 'Invalid issue' }, { status: 400 })
    const body = await request.json()
    const { is_resolved } = schema.parse(body)

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify user is a reporter on this issue
    const { data: report } = await supabase
      .from('reports')
      .select('id')
      .eq('issue_id', issueId)
      .eq('user_id', user.id)
      .single()

    if (!report) {
      return NextResponse.json(
        { error: 'Only reporters can vote on resolution' },
        { status: 403 },
      )
    }

    // Immutable issue/user columns cannot be part of an upsert's UPDATE clause.
    const { data: existing, error: lookupError } = await supabase
      .from('resolution_confirmations')
      .select('id')
      .eq('issue_id', issueId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (lookupError)
      return NextResponse.json(
        { error: 'Could not load your vote' },
        { status: 503 },
      )
    const updateVote = () =>
      supabase
        .from('resolution_confirmations')
        .update({ is_resolved })
        .eq('issue_id', issueId)
        .eq('user_id', user.id)
    let { error } = existing
      ? await updateVote()
      : await supabase
          .from('resolution_confirmations')
          .insert({ issue_id: issueId, user_id: user.id, is_resolved })
    // Two tabs may cast the first vote together; retry only the allowed mutable field.
    if (error?.code === '23505') ({ error } = await updateVote())
    if (error)
      return NextResponse.json(
        {
          error:
            'Voting is available to reporters when a resolution is awaiting verification.',
        },
        { status: error.code === '42501' ? 403 : 503 },
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof (await import('zod')).ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
