import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGovApiKey } from '@/lib/gov-api-auth'

/**
 * GET /api/public/issues/:id
 * Full issue detail including evidence, updates, and resolution votes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = await verifyGovApiKey(request)
  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid or missing API key.' }, { status: 401 })
  }

  const { id } = await params
  const admin = createAdminClient()

  const { data: issue, error } = await admin
    .from('issues')
    .select(`
      id, title, description, status, report_count, threshold,
      community, address, lat, lng,
      created_at, escalated_at, resolved_at, verified_at,
      category:categories(name, slug, icon, government_body),
      lga:lgas(id, name, state:states(id, name, code))
    `)
    .eq('id', id)
    .single()

  if (error || !issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  }

  // Fetch reports count, evidence, and updates in parallel
  const [
    { data: reportIds },
    { data: updates },
    { count: confirmedCount },
    { count: deniedCount },
  ] = await Promise.all([
    admin.from('reports').select('id').eq('issue_id', id),
    admin
      .from('issue_updates')
      .select('update_type, message, created_at')
      .eq('issue_id', id)
      .order('created_at', { ascending: true }),
    admin.from('resolution_confirmations').select('id', { count: 'exact', head: true }).eq('issue_id', id).eq('is_resolved', true),
    admin.from('resolution_confirmations').select('id', { count: 'exact', head: true }).eq('issue_id', id).eq('is_resolved', false),
  ])

  const { data: evidence } = reportIds?.length
    ? await admin.from('evidence').select('url, type').in('report_id', reportIds.map(r => r.id)).limit(10)
    : { data: [] }

  const r = issue as any
  const cat = Array.isArray(r.category) ? r.category[0] : r.category
  const lga = Array.isArray(r.lga) ? r.lga[0] : r.lga
  const state = Array.isArray(lga?.state) ? lga.state[0] : lga?.state

  return NextResponse.json({
    data: {
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      report_count: r.report_count,
      threshold: r.threshold,
      location: {
        community: r.community,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        lga: lga ? { id: lga.id, name: lga.name } : null,
        state: state ? { id: state.id, name: state.name, code: state.code } : null,
      },
      category: cat ? {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        responsible_body: cat.government_body,
      } : null,
      evidence: (evidence ?? []).map(e => ({ url: e.url, type: e.type })),
      government_updates: (updates ?? []).map(u => ({
        type: u.update_type,
        message: u.message,
        date: u.created_at,
      })),
      resolution: r.resolved_at ? {
        confirmed_by: confirmedCount ?? 0,
        denied_by: deniedCount ?? 0,
        total_reporters: r.report_count,
        threshold_needed: Math.ceil(r.report_count * 0.5),
      } : null,
      timestamps: {
        reported: r.created_at,
        escalated: r.escalated_at,
        resolved: r.resolved_at,
        verified: r.verified_at,
      },
    },
  })
}
