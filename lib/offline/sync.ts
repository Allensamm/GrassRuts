// Delta sync: fetches only records changed since last sync timestamp.
// Merges into encrypted IndexedDB. Safe to call on every page load.

import { createClient } from '@/lib/supabase/client'
import { issueCache, profileCache, syncMeta, CachedIssue, CachedProfile } from './idb'

// Returns the number of issues synced
export async function syncIssues(lgaIds: number[]): Promise<number> {
  if (lgaIds.length === 0) return 0

  const supabase = createClient()
  let totalSynced = 0

  for (const lgaId of lgaIds) {
    const metaKey   = `issues_lga_${lgaId}`
    const since     = await syncMeta.getLastSynced(metaKey)
    const syncedAt  = new Date().toISOString()

    let query = supabase
      .from('issues')
      .select(`
        id, title, status, report_count, threshold,
        community, address, created_at, updated_at, lga_id,
        category:categories(name, icon, slug),
        lga:lgas(name)
      `)
      .eq('lga_id', lgaId)
      .order('updated_at', { ascending: false })
      .limit(100)

    // Delta: only fetch what changed since last sync
    if (since) {
      query = query.gt('updated_at', since)
    }

    const { data, error } = await query
    if (error || !data?.length) continue

    await issueCache.putMany(data.map(normaliseIssue))
    await syncMeta.setLastSynced(metaKey, syncedAt)
    totalSynced += data.length
  }

  return totalSynced
}

export async function syncProfile(userId: string): Promise<CachedProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, lga_id, is_diaspora, lga:lgas(id, name, state:states(name))')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  const profile: CachedProfile = {
    id:          data.id,
    full_name:   data.full_name,
    lga_id:      data.lga_id,
    is_diaspora: data.is_diaspora,
    lga:         Array.isArray(data.lga) ? (data.lga[0] ?? null) : (data.lga as any),
  }

  await profileCache.put(profile)
  return profile
}

export async function syncWatchlistLgaIds(userId: string): Promise<number[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('watchlist')
    .select('lga_id')
    .eq('user_id', userId)

  return (data ?? []).map((r: any) => r.lga_id).filter(Boolean)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseIssue(raw: any): CachedIssue {
  return {
    id:           raw.id,
    title:        raw.title,
    status:       raw.status,
    report_count: raw.report_count,
    threshold:    raw.threshold ?? 50,
    community:    raw.community,
    address:      raw.address,
    created_at:   raw.created_at,
    updated_at:   raw.updated_at,
    lga_id:       raw.lga_id,
    category:     Array.isArray(raw.category) ? (raw.category[0] ?? null) : raw.category,
    lga:          Array.isArray(raw.lga)      ? (raw.lga[0] ?? null)      : raw.lga,
  }
}
