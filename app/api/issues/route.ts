import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { moderateIssue } from '@/lib/moderation'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { validatePhotoUrls } from '@/lib/validate-photo-urls'
import { z } from 'zod'

const schema = z.object({
  category_slug: z.string().min(1),
  title: z.string().min(10, 'Title must be at least 10 characters').max(150),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  address: z.string().optional(),
  community: z.string().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  photo_urls: z.array(z.string().url()).max(3).optional(),
})

export async function POST(request: NextRequest) {
  // Idempotency: if the client sends X-Idempotency-Key (offline replay),
  // check for an existing issue with that key and return it instead of creating a duplicate.
  const idempotencyKey = request.headers.get('X-Idempotency-Key')
  if (idempotencyKey) {
    const supabaseCheck = await (await import('@/lib/supabase/server')).createClient()
    const { data: existing } = await supabaseCheck
      .from('issues')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ success: true, issue_id: existing.id }, { status: 200 })
    }
  }

  // Rate limit: 5 new issue submissions per IP per hour
  const ip = getClientIp(request)
  const rl = rateLimit({ key: `issues:create:${ip}`, limit: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'You are submitting too many reports. Please wait before trying again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const body = await request.json()
    const data = schema.parse(body)

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get user profile — we enforce lga_id and block diaspora at the server
    const { data: profile } = await supabase
      .from('users')
      .select('id, lga_id, community, is_diaspora')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 400 })

    // Diaspora users cannot create reports
    if (profile.is_diaspora) {
      return NextResponse.json(
        { error: 'Diaspora users can watch and share issues but cannot submit reports.' },
        { status: 403 }
      )
    }

    // LGA must be set — reports are always scoped to the user's registered LGA
    if (!profile.lga_id) {
      return NextResponse.json(
        { error: 'Please set your LGA in your profile before reporting an issue.' },
        { status: 400 }
      )
    }

    // Get category
    const { data: category } = await supabase
      .from('categories')
      .select('id, name')
      .eq('slug', data.category_slug)
      .single()

    if (!category) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })

    // AI moderation — check this is a genuine community issue, not a personal request
    const moderation = await moderateIssue(data.title, data.description, category.name)
    if (!moderation.approved) {
      return NextResponse.json(
        { error: moderation.reason ?? 'This does not appear to be a community issue. Grassruts is for infrastructure and public problems that affect your entire area.' },
        { status: 422 }
      )
    }

    // Create the issue — lga_id is ALWAYS taken from the user's profile, never from the request
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        title: data.title,
        description: data.description,
        category_id: category.id,
        lga_id: profile.lga_id,
        community: data.community || profile.community || null,
        address: data.address || null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        created_by: user.id,
        report_count: 1,
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
      })
      .select('id')
      .single()

    if (issueError) return NextResponse.json({ error: issueError.message }, { status: 500 })

    // Create the creator's first report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        issue_id: issue.id,
        user_id: user.id,
        description: data.description,
      })
      .select('id')
      .single()

    if (reportError) return NextResponse.json({ error: reportError.message }, { status: 500 })

    // Validate all photo URLs belong to this project's Supabase storage bucket
    // before persisting them, preventing injection of arbitrary external URLs.
    if (data.photo_urls?.length) {
      if (!validatePhotoUrls(data.photo_urls)) {
        return NextResponse.json({ error: 'Invalid photo URLs' }, { status: 400 })
      }
      await supabase.from('evidence').insert(
        data.photo_urls.map(url => ({ report_id: report.id, url, type: 'image' as const }))
      )
    }

    return NextResponse.json({ success: true, issue_id: issue.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
