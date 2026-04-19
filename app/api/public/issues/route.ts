import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGovApiKey } from '@/lib/gov-api-auth'

/**
 * GET /api/public/issues
 *
 * Government API — list community issues.
 * Requires: Authorization: Bearer <api_key>  OR  X-API-Key: <api_key>
 *
 * Query params:
 *   status        — pending | high_priority | in_review | resolved | verified
 *   lga_id        — filter by LGA
 *   state_id      — filter by state (matches all LGAs in that state)
 *   category      — category slug (infrastructure, water, electricity, ...)
 *   limit         — max results (default 50, max 200)
 *   offset        — pagination offset
 */
export async function GET(request: NextRequest) {
  const apiKey = await verifyGovApiKey(request)
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Invalid or missing API key. Pass your key in the X-API-Key header.' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const lga_id = searchParams.get('lga_id')
  const state_id = searchParams.get('state_id')
  const category = searchParams.get('category')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const admin = createAdminClient()

  let query = admin
    .from('issues')
    .select(`
      id, title, description, status, report_count, threshold,
      community, address, lat, lng,
      created_at, escalated_at, resolved_at, verified_at,
      category:categories(name, slug, icon, government_body),
      lga:lgas(id, name, state:states(id, name, code))
    `)
    .order('report_count', { ascending: false })
    .range(offset, offset + limit - 1)

  // Jurisdiction scoping: if the API key is tied to a specific LGA or state,
  // always use that scope — query params cannot override it. This prevents an
  // LGA official from querying another jurisdiction's data by passing a
  // different lga_id/state_id in the URL.
  const keyHasJurisdiction = apiKey.lga_id != null || apiKey.state_id != null
  const effectiveLgaId = keyHasJurisdiction
    ? (apiKey.lga_id ? String(apiKey.lga_id) : null)
    : lga_id
  const effectiveStateId = keyHasJurisdiction
    ? (apiKey.state_id ? String(apiKey.state_id) : null)
    : state_id

  if (effectiveLgaId) {
    query = query.eq('lga_id', parseInt(effectiveLgaId))
  } else if (effectiveStateId) {
    const { data: lgaIds } = await admin
      .from('lgas')
      .select('id')
      .eq('state_id', parseInt(effectiveStateId))
    if (lgaIds) query = query.in('lga_id', lgaIds.map(l => l.id))
  }

  if (status) query = query.eq('status', status)

  if (category) {
    const { data: cat } = await admin.from('categories').select('id').eq('slug', category).single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  const { data: issues, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normalise nested joins
  const normalised = (issues ?? []).map(issue => {
    const r = issue as any
    const cat = Array.isArray(r.category) ? r.category[0] : r.category
    const lga = Array.isArray(r.lga) ? r.lga[0] : r.lga
    const state = Array.isArray(lga?.state) ? lga.state[0] : lga?.state
    return {
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
      timestamps: {
        reported: r.created_at,
        escalated: r.escalated_at,
        resolved: r.resolved_at,
        verified: r.verified_at,
      },
    }
  })

  return NextResponse.json({
    data: normalised,
    meta: {
      count: normalised.length,
      offset,
      limit,
      jurisdiction: apiKey.entity_name,
    },
  })
}
