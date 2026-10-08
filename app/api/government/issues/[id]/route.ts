import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getJurisdictionIssue } from '@/lib/gov-api-auth'
import { z } from 'zod'

const schema = z.object({
  update_type: z.enum(['acknowledged', 'in_progress', 'resolved', 'rejected']),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: issueId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: govUser } = await supabase
      .from('government_users')
      .select('id, is_active, lga_id, state_id, department')
      .eq('auth_user_id', user.id)
      .single()

    if (!govUser?.is_active)
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

    const body = await request.json()
    const { update_type, message } = schema.parse(body)

    if (!(await getJurisdictionIssue(issueId, govUser)))
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    const { error } = await createAdminClient().rpc('record_authority_update', {
      p_issue_id: issueId,
      p_status:
        update_type === 'resolved'
          ? 'resolved'
          : update_type === 'in_progress'
            ? 'in_review'
            : null,
      p_update_type: update_type,
      p_message: message,
      p_actor: govUser.department || 'Public authority',
      p_api_key_id: null,
      p_government_user_id: govUser.id,
    })
    if (error)
      return NextResponse.json(
        { error: 'The update could not be saved.' },
        { status: 503 },
      )
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 },
    )
  }
}
