import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, FileText, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import IssueCard from '@/components/issues/IssueCard'
import FilterTabs from '@/components/issues/FilterTabs'
import type { IssueStatus } from '@/types'

interface Props {
  searchParams: Promise<{ filter?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { filter } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, lga_id, is_diaspora, lga:lgas(id, name, state:states(name))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/signup/profile')

  const lga = Array.isArray((profile as any).lga)
    ? ((profile as any).lga[0] ?? null)
    : (profile as any).lga

  const validStatuses: IssueStatus[] = ['pending', 'high_priority', 'in_review', 'resolved', 'verified']
  const activeFilter = filter && validStatuses.includes(filter as IssueStatus) ? filter as IssueStatus : null

  let issues: any[] = []
  let watchlistLgas: { id: number; name: string }[] = []
  let areaLabel = lga?.name ?? 'your area'

  if (profile.is_diaspora) {
    // Diaspora: show issues from watchlisted LGAs
    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('lga_id, lga:lgas(id, name)')
      .eq('user_id', user.id)

    watchlistLgas = (watchlist ?? []).map((w: any) => {
      const l = Array.isArray(w.lga) ? w.lga[0] : w.lga
      return { id: l?.id, name: l?.name }
    }).filter(l => l.id)

    if (watchlistLgas.length > 0) {
      let query = supabase
        .from('issues')
        .select(`id, title, description, status, report_count, threshold,
          community, address, created_at, updated_at,
          category:categories(name, icon, slug), lga:lgas(name)`)
        .in('lga_id', watchlistLgas.map(l => l.id))
        .order('report_count', { ascending: false })
        .limit(20)
      if (activeFilter) query = query.eq('status', activeFilter)
      const { data } = await query
      issues = data ?? []
      areaLabel = watchlistLgas.map(l => l.name).join(', ')
    }
  } else {
    // Resident: show issues from their LGA
    let query = supabase
      .from('issues')
      .select(`id, title, description, status, report_count, threshold,
        community, address, created_at, updated_at,
        category:categories(name, icon, slug), lga:lgas(name)`)
      .order('created_at', { ascending: false })
      .limit(20)
    if (profile.lga_id) query = query.eq('lga_id', profile.lga_id)
    if (activeFilter) query = query.eq('status', activeFilter)
    const { data } = await query
    issues = data ?? []
  }

  const greeting = getGreeting()
  const firstName = profile.full_name.split(' ')[0]

  return (
    <div className="px-4 md:px-6 py-5">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {profile.is_diaspora ? (
              <>Watching <span className="font-medium text-gray-700">{areaLabel || 'no communities yet'}</span></>
            ) : (
              <>Here&apos;s what&apos;s happening in <span className="font-medium text-gray-700">{areaLabel}</span></>
            )}
          </p>
        </div>

        {!profile.is_diaspora && (
          <Link
            href="/report"
            className="hidden md:flex items-center gap-2 bg-[#008751] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#006B40] transition-colors shrink-0"
          >
            <Plus size={16} />
            Report Issue
          </Link>
        )}
      </div>

      {/* Quick actions — mobile only */}
      <div className="grid grid-cols-3 gap-3 mb-6 md:hidden">
        {!profile.is_diaspora ? (
          <Link href="/report" className="flex flex-col items-center gap-1.5 bg-[#008751] text-white rounded-2xl py-4 px-2 hover:bg-[#006B40] transition-colors">
            <Plus size={22} />
            <span className="text-xs font-semibold text-center leading-tight">Report Issue</span>
          </Link>
        ) : (
          <Link href="/explore" className="flex flex-col items-center gap-1.5 bg-[#008751] text-white rounded-2xl py-4 px-2 hover:bg-[#006B40] transition-colors">
            <Eye size={22} />
            <span className="text-xs font-semibold text-center leading-tight">Explore</span>
          </Link>
        )}
        <Link href="/my-reports" className="flex flex-col items-center gap-1.5 bg-white border border-gray-100 rounded-2xl py-4 px-2 hover:bg-gray-50 transition-colors">
          <FileText size={22} className="text-gray-600" />
          <span className="text-xs font-semibold text-gray-600 text-center leading-tight">My Reports</span>
        </Link>
        <Link href="/explore" className="flex flex-col items-center gap-1.5 bg-white border border-gray-100 rounded-2xl py-4 px-2 hover:bg-gray-50 transition-colors">
          <Eye size={22} className="text-gray-600" />
          <span className="text-xs font-semibold text-gray-600 text-center leading-tight">Explore</span>
        </Link>
      </div>

      {/* Issue list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">
            {profile.is_diaspora ? 'Issues in Watched Areas' : `Issues in ${areaLabel}`}
          </h2>
          <span className="text-xs text-gray-400">{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>
        </div>

        <FilterTabs activeFilter={filter} />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {issues.length > 0 ? (
            issues.map(issue => <IssueCard key={issue.id} issue={issue as any} />)
          ) : (
            <div className="col-span-full">
              <EmptyState
                filter={filter}
                areaLabel={areaLabel}
                hasLga={!!profile.lga_id}
                isDisaspora={profile.is_diaspora}
                hasWatchlist={watchlistLgas.length > 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ filter, areaLabel, hasLga, isDisaspora, hasWatchlist }: {
  filter?: string; areaLabel: string; hasLga: boolean; isDisaspora: boolean; hasWatchlist: boolean
}) {
  if (isDisaspora && !hasWatchlist) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">👁️</div>
        <p className="font-semibold text-gray-700 mb-1">No communities watched yet</p>
        <p className="text-sm text-gray-400 mb-4">Browse issues and tap &quot;Watch&quot; on any LGA to follow it.</p>
        <Link href="/explore" className="inline-block bg-[#008751] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#006B40] transition-colors">
          Explore Issues
        </Link>
      </div>
    )
  }

  if (!hasLga) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📍</div>
        <p className="font-semibold text-gray-700 mb-1">No location set</p>
        <p className="text-sm text-gray-400 mb-4">Update your profile to see issues in your LGA.</p>
        <Link href="/profile" className="inline-block bg-[#008751] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#006B40] transition-colors">
          Update Profile
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">🌱</div>
      <p className="font-semibold text-gray-700 mb-1">
        {filter ? `No ${filter.replace('_', ' ')} issues` : `No issues yet in ${areaLabel}`}
      </p>
      <p className="text-sm text-gray-400 mb-4">
        {filter ? 'Try a different filter' : 'Be the first to report a community issue'}
      </p>
      {!isDisaspora && (
        <Link href="/report" className="inline-block bg-[#008751] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#006B40] transition-colors">
          Report Your First Issue
        </Link>
      )}
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
