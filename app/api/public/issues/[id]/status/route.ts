import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGovApiKey, hasPermission } from '@/lib/gov-api-auth'
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
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = await verifyGovApiKey(request)
  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid or missing API key.' }, { status: 401 })
  }
  if (!hasPermission(apiKey, 'write')) {
    return NextResponse.json({ error: 'This API key does not have write permission.' }, { status: 403 })
  }

  try {
    const { id: issueId } = await params
    const body = await request.json()
    const { status, message } = schema.parse(body)

    const admin = createAdminClient()

    // Verify issue exists
    const { data: issue } = await admin
      .from('issues')
      .select('id, status, title')
      .eq('id', issueId)
      .single()

    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

    // Update status
    const { error: updateError } = await admin
      .from('issues')
      .update({
        status,
        ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', issueId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Log the update (use first government_user record matching this key's entity, or create a synthetic one)
    // For now we insert a raw update without government_user_id (make it nullable)
    if (message) {
      await admin.from('issue_updates').insert({
        issue_id: issueId,
        government_user_id: null,  // API-based update — no portal user
        update_type: STATUS_TO_UPDATE_TYPE[status],
        message,
      })
    }

    return NextResponse.json({
      success: true,
      issue_id: issueId,
      new_status: status,
      message: message ?? null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
