import { one, pageNumber } from '@/lib/relations'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, BarChart2, TrendingUp, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PageIntro from '@/components/ui/PageIntro'
import IssueTable from '@/components/issues/IssueTable'
import FilterSidebar from '@/components/dashboard/FilterSidebar'
import type { IssueStatus } from '@/types'

interface Props {
  searchParams: Promise<{
    status?: string
    category?: string
    q?: string
    sort?: string
    page?: string
  }>
}

const VALID_STATUSES: IssueStatus[] = [
  'pending',
  'high_priority',
  'in_review',
  'resolved',
  'verified',
]

export default async function DashboardPage({ searchParams }: Props) {
  const {
    status: statusParam,
    category: categoryParam,
    q,
    sort,
    page,
  } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('users')
    .select(
      'id, full_name, lga_id, is_diaspora, lga:lgas(id, name, state:states(name))',
    )
    .eq('id', user.id)
    .single()

  if (!profileRaw) redirect('/signup/profile')

  const rawLga = one(profileRaw.lga)
  const profile = {
    ...profileRaw,
    lga: rawLga ? { ...rawLga, state: one(rawLga.state) } : null,
  }

  // Parse multi-value filter params
  const activeStatuses = (statusParam ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => VALID_STATUSES.includes(s as IssueStatus)) as IssueStatus[]

  const activeCategories = (categoryParam ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // Fetch watchlist for diaspora users
  let watchlistLgaIds: number[] = []
  let areaLabel = profile.lga?.name ?? 'your area'

  if (profile.is_diaspora) {
    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('lga_id, lga:lgas(id, name)')
      .eq('user_id', user.id)

    watchlistLgaIds = (watchlist ?? []).map((w) => w.lga_id)

    if (watchlistLgaIds.length > 0) {
      const names = (watchlist ?? [])
        .map((w) => {
          const l = one(w.lga)
          return l?.name
        })
        .filter(Boolean)
      areaLabel = names.join(', ')
    }
  }

  // Build issues query
  let query = supabase
    .from('issues')
    .select(
      `id, title, description, status, report_count, threshold,
      community, address, created_at, updated_at,
      category:categories(name, icon, slug), lga:lgas(name)`,
      { count: 'exact' },
    )
    .range((pageNumber(page) - 1) * 20, pageNumber(page) * 20 - 1)

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
    const { data: cats } = await supabase
      .from('categories')
      .select('id')
      .in('slug', activeCategories)
    query = query.in(
      'category_id',
      (cats ?? []).map((c) => c.id),
    )
  }

  if (q?.trim())
    query = query.ilike(
      'title',
      `%${q.trim().slice(0, 100).replace(/[%_]/g, '')}%`,
    )
  query = query
    .order(sort === 'reports' ? 'report_count' : 'created_at', {
      ascending: false,
    })
    .order('id')

  const { data: issues, error: queryError, count: totalMatches } = await query
  const issueList = (issues ?? []).map((issue) => ({
    ...issue,
    category: one(issue.category),
    lga: one(issue.lga),
  }))

  const areaQuery = (status?: string) => {
    let query = supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
    if (profile.is_diaspora) query = query.in('lga_id', watchlistLgaIds)
    else if (profile.lga_id) query = query.eq('lga_id', profile.lga_id)
    if (status) query = query.eq('status', status)
    return query
  }
  const stats = await Promise.all([
    areaQuery(),
    areaQuery('high_priority'),
    areaQuery('verified'),
  ])
  const currentPage = pageNumber(page)
  const pageHref = (n: number) => {
    const p = new URLSearchParams()
    if (statusParam) p.set('status', statusParam)
    if (categoryParam) p.set('category', categoryParam)
    if (q) p.set('q', q)
    if (sort) p.set('sort', sort)
    p.set('page', String(n))
    return `/dashboard?${p}`
  }
  return (
    <div className="app-content">
      <PageIntro
        eyebrow="Your community, in focus"
        title={
          profile.is_diaspora
            ? 'The places you care about.'
            : `Hello, ${profile.full_name.split(' ')[0]}.`
        }
        description={
          profile.is_diaspora
            ? 'Follow the communities on your watchlist and help their voices travel further.'
            : `Here’s what’s happening in ${areaLabel}. Every report helps build a clearer picture.`
        }
        action={
          !profile.is_diaspora && (
            <Link href="/report" className="button button-primary">
              <Plus size={18} />
              Report an issue
            </Link>
          )
        }
      />
      <div className="grid gap-4 sm:grid-cols-3 mb-7">
        {[
          { label: 'Issues in your community', Icon: BarChart2, index: 0 },
          { label: 'High priority', Icon: TrendingUp, index: 1 },
          { label: 'Community verified', Icon: CheckCircle2, index: 2 },
        ].map(({ label, Icon, index }) => (
          <div key={label} className="dashboard-stat">
            <span className="journey-icon">
              <Icon size={21} />
            </span>
            <div>
              <strong>
                {stats[index].error ? '—' : (stats[index].count ?? 0)}
              </strong>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </div>
      <section className="civic-card overflow-hidden">
        <div className="flex flex-wrap justify-between gap-3 p-6">
          <div>
            <h2 className="text-xl font-semibold">Community reports</h2>
            <p className="mt-1 text-sm text-[#52635B]">
              Find a concern, add your voice, and follow its progress.
            </p>
          </div>
          <Link href="/explore" className="text-link">
            Explore across Nigeria →
          </Link>
        </div>
        <FilterSidebar
          activeStatuses={activeStatuses}
          activeCategories={activeCategories}
        />
        {q && (
          <p className="px-6 pt-4 text-sm">
            Search results for “{q.slice(0, 100)}”
          </p>
        )}
        {queryError ? (
          <div role="alert" className="p-8 text-center text-red-800">
            We couldn’t load your community’s reports. Please refresh to try
            again.
          </div>
        ) : (
          <IssueTable
            issues={issueList}
            emptyMessage={
              profile.is_diaspora && !watchlistLgaIds.length
                ? 'Watch a community to see its reports here'
                : 'No reports match this view'
            }
          />
        )}
        <div className="flex items-center justify-between gap-3 border-t border-[#DDE5DC] p-4 text-sm text-[#52635B]">
          <span>
            {totalMatches ?? 0} matching reports · Page {currentPage}
          </span>
          <div className="flex gap-3">
            {currentPage > 1 && (
              <Link
                className="button button-secondary"
                href={pageHref(currentPage - 1)}
              >
                Previous
              </Link>
            )}
            {currentPage * 20 < (totalMatches ?? 0) && (
              <Link
                className="button button-secondary"
                href={pageHref(currentPage + 1)}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </section>
      <div className="mt-6 rounded-xl border border-[#DDE5DC] bg-[#EDF2E8] p-5 text-sm leading-7 text-[#52635B]">
        <strong className="text-[#183D2E]">
          A shared record is a first step.
        </strong>{' '}
        High-priority reports show community support. Follow the activity
        timeline for actual responses and community verification.
      </div>
    </div>
  )
}
