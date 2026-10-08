import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { moderateIssue } from '@/lib/moderation'
import { rateLimit } from '@/lib/rate-limit'
import { validatePhotoUrls } from '@/lib/validate-photo-urls'
import { issueSchema, idempotencySchema } from '@/lib/submission'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json(
        { error: 'Please sign in to report an issue.' },
        { status: 401 },
      )
    if (
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.ANTHROPIC_API_KEY
    )
      return NextResponse.json(
        {
          error:
            'Reporting is temporarily unavailable. Please keep your draft and try again later.',
        },
        { status: 503 },
      )
    if (
      request.headers.get('X-Outbox-Owner') &&
      request.headers.get('X-Outbox-Owner') !== user.id
    )
      return NextResponse.json(
        { error: 'Sign in to the account that saved this report.' },
        { status: 403 },
      )
    const data = issueSchema.parse(await request.json())
    const key = idempotencySchema.parse(
      request.headers.get('X-Idempotency-Key'),
    )
    if (!validatePhotoUrls(data.photo_urls, user.id))
      return NextResponse.json(
        { error: 'Please upload your own evidence photos.' },
        { status: 400 },
      )
    const admin = createAdminClient()
    if (key) {
      const { data: existing } = await admin
        .from('issues')
        .select('id')
        .eq('created_by', user.id)
        .eq('idempotency_key', key)
        .maybeSingle()
      if (existing)
        return NextResponse.json({ success: true, issue_id: existing.id })
    }
    const limit = await rateLimit({
      key: `issue:user:${user.id}`,
      limit: 5,
      windowMs: 3600000,
    })
    if (!limit.success)
      return NextResponse.json(
        { error: 'Please wait before submitting another report.' },
        { status: 429 },
      )
    const { data: profile } = await supabase
      .from('users')
      .select('lga_id,is_diaspora')
      .eq('id', user.id)
      .single()
    if (!profile?.lga_id || profile.is_diaspora)
      return NextResponse.json(
        {
          error:
            'Reporting requires a resident profile with a local government area.',
        },
        { status: 403 },
      )
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('slug', data.category_slug)
      .single()
    if (!category)
      return NextResponse.json(
        { error: 'Choose a valid category.' },
        { status: 400 },
      )
    const moderation = await moderateIssue(
      data.title,
      data.description,
      category.name,
    )
    if (!moderation.approved)
      return NextResponse.json(
        { error: moderation.reason || 'Please review this report.' },
        { status: 422 },
      )
    const { data: id, error } = await admin.rpc('submit_community_issue', {
      p_user_id: user.id,
      p_payload: data,
      p_idempotency_key: key,
    })
    if (error)
      return NextResponse.json(
        {
          error:
            'We could not save this report. Your draft is still available; please try again.',
        },
        { status: 503 },
      )
    return NextResponse.json({ success: true, issue_id: id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      )
    return NextResponse.json(
      { error: 'Reporting is temporarily unavailable. Please try again.' },
      { status: 503 },
    )
  }
}
