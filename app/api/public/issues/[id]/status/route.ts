import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  verifyGovApiKey,
  hasPermission,
  getJurisdictionIssue,
} from '@/lib/gov-api-auth'
import { z } from 'zod'

/**
 * POST /api/public/issues/:id/status
 *
 * Government API — update issue status and optionally post a public response.
 * Requires write permission on the API key.
 *
 * Body:
 *   status   — "in_review" | "resolved" | "rejected"
 *   message  — optional public message shown to citizens (string)
 */
const schema = z.object({
  status: z.enum(['in_review', 'resolved', 'rejected']),
  message: z.string().max(2000).optional(),
})

const STATUS_TO_UPDATE_TYPE: Record<string, string> = {
  in_review: 'in_progress',
  resolved: 'resolved',
  rejected: 'rejected',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let apiKey
  try {
    apiKey = await verifyGovApiKey(request)
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Invalid or missing API key.' },
      { status: 401 },
    )
  }
  if (!hasPermission(apiKey, 'write')) {
    return NextResponse.json(
      { error: 'This API key does not have write permission.' },
      { status: 403 },
    )
  }

  try {
    const { id: issueId } = await params
    const body = await request.json()
    const { status, message } = schema.parse(body)

    const admin = createAdminClient()

    const issue = await getJurisdictionIssue(issueId, apiKey)
    if (!issue)
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    const { error: updateError } = await admin.rpc('record_authority_update', {
      p_issue_id: issueId,
      p_status: status === 'rejected' ? null : status,
      p_update_type: STATUS_TO_UPDATE_TYPE[status],
      p_message: message || 'Status updated by the responsible authority.',
      p_actor: apiKey.entity_name,
      p_api_key_id: apiKey.id,
      p_government_user_id: null,
    })
    if (updateError)
      return NextResponse.json(
        { error: 'The update could not be saved.' },
        { status: 503 },
      )
    return NextResponse.json({
      success: true,
      issue_id: issueId,
      new_status: status === 'rejected' ? issue.status : status,
      message: message ?? null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
