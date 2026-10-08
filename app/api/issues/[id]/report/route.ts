import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { validatePhotoUrls } from '@/lib/validate-photo-urls'
import { reportSchema } from '@/lib/submission'
import { z } from 'zod'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    z.string().uuid().parse(id)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    if (
      request.headers.get('X-Outbox-Owner') &&
      request.headers.get('X-Outbox-Owner') !== user.id
    )
      return NextResponse.json(
        { error: 'Sign in to the account that saved this report.' },
        { status: 403 },
      )
    const data = reportSchema.parse(await request.json())
    if (!validatePhotoUrls(data.photo_urls, user.id))
      return NextResponse.json(
        { error: 'Please upload your own evidence photos.' },
        { status: 400 },
      )
    const rl = await rateLimit({
      key: `report:user:${user.id}`,
      limit: 10,
      windowMs: 86400000,
    })
    if (!rl.success)
      return NextResponse.json(
        { error: 'You have reached your daily reporting limit.' },
        { status: 429 },
      )
    const admin = createAdminClient()
    const { error } = await admin.rpc('add_community_report', {
      p_user_id: user.id,
      p_issue_id: id,
      p_payload: data,
    })
    if (error?.code === '23505')
      return NextResponse.json(
        { error: 'You have already reported this issue.' },
        { status: 409 },
      )
    if (error?.code === '42501')
      return NextResponse.json(
        { error: 'Only residents of this area can support an active issue.' },
        { status: 403 },
      )
    if (error)
      return NextResponse.json(
        { error: 'Your report could not be saved. Please try again.' },
        { status: 503 },
      )
    return NextResponse.json({ success: true, issue_id: id })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      )
    return NextResponse.json(
      { error: 'Reporting is temporarily unavailable.' },
      { status: 503 },
    )
  }
}
