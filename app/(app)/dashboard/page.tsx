import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, BarChart2, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import IssueTable from '@/components/issues/IssueTable'
import FilterSidebar from '@/components/dashboard/FilterSidebar'
import type { IssueStatus } from '@/types'

interface Props {
  searchParams: Promise<{ status?: string; category?: string }>
}

const VALID_STATUSES: IssueStatus[] = ['pending', 'high_priority', 'in_review', 'resolved', 'verified']

export default async function DashboardPage({ searchParams }: Props) {
  const { status: statusParam, category: categoryParam } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('users')
    .select('id, full_name, lga_id, is_diaspora, lga:lgas(id, name, state:states(name))')
    .eq('id', user.id)
    .single()

  if (!profileRaw) redirect('/signup/profile')

  const raw = profileRaw as any
  const profile = {
    id: raw.id as string,
    full_name: raw.full_name as string,
    lga_id: raw.lga_id as number | null,
    is_diaspora: raw.is_diaspora as boolean,
    lga: (Array.isArray(raw.lga) ? raw.lga[0] ?? null : raw.lga) as {
      id: number; name: string; state: { name: string } | null
    } | null,
  }

  // Parse multi-value filter params
  const activeStatuses = (statusParam ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(s => VALID_STATUSES.includes(s as IssueStatus)) as IssueStatus[]

  const activeCategories = (categoryParam ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  // Fetch watchlist for diaspora users
  let watchlistLgaIds: number[] = []
  let areaLabel = profile.lga?.name ?? 'your area'

  if (profile.is_diaspora) {
    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('lga_id, lga:lgas(id, name)')
      .eq('user_id', user.id)

    watchlistLgaIds = (watchlist ?? [])
      .map((w: any) => {
        const l = Array.isArray(w.lga) ? w.lga[0] : w.lga
        return l?.id
      })
      .filter(Boolean)

    if (watchlistLgaIds.length > 0) {
      const names = (watchlist ?? []).map((w: any) => {
        const l = Array.isArray(w.lga) ? w.lga[0] : w.lga
        return l?.name
      }).filter(Boolean)
      areaLabel = names.join(', ')
    }
  }

  // Build issues query
  let query = supabase
    .from('issues')
    .select(`id, title, description, status, report_count, threshold,
      community, address, created_at, updated_at,
      category:categories(name, icon, slug), lga:lgas(name)`)
    .limit(50)

  if (profile.is_diaspora) {
    if (watchlistLgaIds.length > 0) {
      query = query.in('lga_id', watchlistLgaIds)
    } else {
      query = query.eq('lga_id', -1) // no results
    }
  } else if (profile.lga_id) {
    query = query.eq('lga_id', profile.lga_id)
  }

  if (activeStatuses.length > 0) {
    query = query.in('status', activeStatuses)
  }
  if (activeCategories.length > 0) {
    query = query.in('category_slug', activeCategories)
  }

  query = query.order('report_count', { ascending: false })

  const { data: issues } = await query
  const issueList = (issues ?? []) as any[]

  // Stat pills
  const total     = issueList.length
  const resolved  = issueList.filter(i => i.status === 'resolved' || i.status === 'verified').length
  const urgent    = issueList.filter(i => i.status === 'high_priority').length
  const pending   = issueList.filter(i => i.status === 'pending').length

  const firstName = profile.full_name.split(' ')[0]

  return (
    <div className="flex flex-col h-full">
      {/* Page subheader */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-[#E2E8F0] shrink-0">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-[#0F172A] truncate">
            {profile.is_diaspora
              ? `Watched Areas`
              : `${areaLabel}`}
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {profile.is_diaspora
              ? `${watchlistLgaIds.length} LGA${watchlistLgaIds.length !== 1 ? 's' : ''} watched`
              : `Welcome back, ${firstName}`}
          </p>
        </div>

        {/* Stat pills */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <StatPill icon={BarChart2} label="Total" value={total} color="text-[#475569]" />
          <StatPill icon={Clock}     label="Pending" value={pending} color="text-amber-600" />
          <StatPill icon={TrendingUp} label="Urgent" value={urgent} color="text-red-600" />
          <StatPill icon={CheckCircle2} label="Resolved" value={resolved} color="text-green-600" />
        </div>

        {!profile.is_diaspora && (
          <Link
            href="/report"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#008751] text-white text-sm font-semibold shrink-0 hover:bg-[#006B40] transition-colors duration-[150ms] linear focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] focus-visible:ring-offset-2"
          >
            <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
            Report Issue
          </Link>
        )}
      </div>

      {/* Body: filter sidebar + table */}
      <div className="flex flex-1 min-h-0">
        {/* Filter sidebar — hidden on mobile */}
        <div className="hidden md:flex">
          <FilterSidebar
            activeStatuses={activeStatuses}
            activeCategories={activeCategories}
          />
        </div>

        {/* Main table area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Table toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E2E8F0] bg-white shrink-0">
            <span className="text-xs text-[#94A3B8]">
              <span className="tabular font-semibold text-[#0F172A]">{total}</span>
              {' '}issue{total !== 1 ? 's' : ''}
              {activeStatuses.length > 0 || activeCategories.length > 0 ? ' (filtered)' : ''}
            </span>
            <span className="text-[11px] text-[#94A3B8]">
              Sorted by report count
            </span>
          </div>

          {/* Scrollable table */}
          <div className="flex-1 overflow-auto scrollbar-thin bg-white">
            <IssueTable
              issues={issueList}
              emptyMessage={
                activeStatuses.length > 0 || activeCategories.length > 0
                  ? 'No issues match the selected filters'
                  : profile.is_diaspora && watchlistLgaIds.length === 0
                  ? 'Watch an LGA to see issues here'
                  : `No issues reported in ${areaLabel} yet`
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-[#F8F9FA]">
      <Icon size={13} className={color} strokeWidth={2} aria-hidden="true" />
      <span className="text-[11px] text-[#94A3B8]">{label}</span>
      <span className={`text-xs font-semibold tabular ${color}`}>{value}</span>
    </div>
  )
}
