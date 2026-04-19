import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePhotoUrls } from '@/lib/validate-photo-urls'
import { z } from 'zod'

const schema = z.object({
  description: z.string().optional(),
  photo_urls: z.array(z.string().url()).max(3).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: issueId } = await params
    const body = await request.json()
    const data = schema.parse(body)

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check user profile — block diaspora and enforce LGA match
    const { data: profile } = await supabase
      .from('users')
      .select('lga_id, is_diaspora')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

    if (profile.is_diaspora) {
      return NextResponse.json(
        { error: 'Diaspora users cannot add reports. You can share this issue to help amplify it.' },
        { status: 403 }
      )
    }

    // Verify the issue exists, is still active, and is in the user's LGA.
    // Important: return the same 404 for both "not found" and "wrong LGA" so
    // an attacker cannot enumerate issue IDs or infer LGA membership from the
    // error code (IDOR prevention).
    const { data: issue } = await supabase
      .from('issues')
      .select('id, status, lga_id')
      .eq('id', issueId)
      .single()

    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })

    // LGA mismatch — return 404 (not 403) to avoid revealing that the issue exists
    if (profile.lga_id && issue.lga_id !== profile.lga_id) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    if (issue.status === 'resolved' || issue.status === 'verified') {
      return NextResponse.json({ error: 'This issue has already been resolved' }, { status: 400 })
    }

    // Insert the report (UNIQUE constraint handles duplicate reports)
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        issue_id: issueId,
        user_id: user.id,
        description: data.description || null,
      })
      .select('id')
      .single()

    if (reportError) {
      if (reportError.code === '23505') {
        return NextResponse.json({ error: 'You have already reported this issue' }, { status: 409 })
      }
      return NextResponse.json({ error: reportError.message }, { status: 500 })
    }

    // Validate and store evidence photos
    if (data.photo_urls?.length) {
      if (!validatePhotoUrls(data.photo_urls)) {
        return NextResponse.json({ error: 'Invalid photo URLs' }, { status: 400 })
      }
      const evidenceRows = data.photo_urls.map(url => ({
        report_id: report.id,
        url,
        type: 'image' as const,
      }))
      await supabase.from('evidence').insert(evidenceRows)
    }

    return NextResponse.json({ success: true, issue_id: issueId })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
