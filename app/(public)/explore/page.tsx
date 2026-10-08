import { one, pageNumber } from '@/lib/relations'
import { createClient } from '@/lib/supabase/server'
import PageIntro from '@/components/ui/PageIntro'
import Link from 'next/link'
import ExploreFilters from '@/components/issues/ExploreFilters'
import ExploreView from '@/components/issues/ExploreView'
import type { IssueStatus } from '@/types'
import type { IssueMapItem } from '@/components/map/IssueMapDynamic'

interface Props {
  searchParams: Promise<{
    category?: string
    status?: string
    state?: string
    view?: string
    q?: string
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

export default async function ExplorePage({ searchParams }: Props) {
  const {
    category,
    status,
    state: stateFilter,
    view,
    q,
    page,
  } = await searchParams
  const isMapView = view === 'map'
  const supabase = await createClient()

  const { data: states } = await supabase
    .from('states')
    .select('id, name')
    .order('name')

  let query = supabase
    .from('issues')
    .select(
      `
      id, title, description, status, report_count, threshold,
      community, address, created_at, updated_at, lat, lng,
      category:categories(name, icon, slug),
      lga:lgas(name, state:states(id, name))
    `,
      { count: 'exact' },
    )
    .order('report_count', { ascending: false })

  if (status && VALID_STATUSES.includes(status as IssueStatus)) {
    query = query.eq('status', status)
  }

  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()
    query = query.eq('category_id', cat?.id ?? -1)
  }

  if (q?.trim())
    query = query.ilike(
      'title',
      `%${q.trim().slice(0, 100).replace(/[%_]/g, '')}%`,
    )
  if (stateFilter) {
    const { data: lgas } = await supabase
      .from('lgas')
      .select('id')
      .eq('state_id', Number(stateFilter))
    query = query.in(
      'lga_id',
      (lgas ?? []).map((l) => l.id),
    )
  }
  const currentPage = pageNumber(page)
  query = query.range((currentPage - 1) * 24, currentPage * 24 - 1)
  const { data: rawIssues, error, count } = await query

  // Normalise joins and filter by state
  const issues = (rawIssues ?? [])
    .map((issue) => {
      const r = issue
      const cat = one(r.category)
      const lga = one(r.lga)
      const st = one(lga?.state)
      return {
        ...issue,
        category: cat,
        lga,
        _category: cat,
        _lga: lga,
        _state: st,
      }
    })
    .filter((issue) => !stateFilter || String(issue._state?.id) === stateFilter)

  // Shape for map
  const mapIssues: IssueMapItem[] = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    status: issue.status,
    report_count: issue.report_count,
    threshold: issue.threshold,
    lat: issue.lat ?? null,
    lng: issue.lng ?? null,
    category_icon: issue._category?.icon ?? '❓',
    category_name: issue._category?.name ?? 'Other',
    lga_name: issue._lga?.name ?? '',
  }))

  return (
    <div>
      <PageIntro
        eyebrow="A shared picture of Nigeria"
        title="Explore your community."
        description="See what people are reporting, where support is growing, and which changes residents have verified."
        action={
          <Link href="/report" className="button button-primary">
            Report an issue ↗
          </Link>
        }
      />
      <form action="/explore" className="mb-6 flex gap-3">
        <label className="flex-1">
          <span className="sr-only">Search issue titles</span>
          <input
            name="q"
            type="search"
            defaultValue={q}
            maxLength={100}
            placeholder="Search for a road, community, or issue…"
            className="w-full rounded-xl border border-[#CAD7C8] bg-white px-4 py-3"
          />
        </label>
        <button className="button button-primary">Search</button>
      </form>
      <ExploreFilters
        states={states ?? []}
        activeCategory={category}
        activeStatus={status}
        activeState={stateFilter}
        activeView={view ?? 'list'}
      />

      {error && (
        <p role="alert" className="my-5 rounded-xl bg-red-50 p-4 text-red-800">
          Reports could not be loaded. Please refresh to try again.
        </p>
      )}
      <p className="my-5 text-sm text-[#52635B]">
        {count ?? 0} matching reports · Page {currentPage}
      </p>
      <div className="mt-4">
        <ExploreView
          issues={issues}
          mapIssues={mapIssues}
          isMapView={isMapView}
        />
      </div>
      <nav aria-label="Report pages" className="mt-7 flex justify-end gap-3">
        {[currentPage - 1, currentPage + 1]
          .filter(
            (p) => p >= 1 && (p < currentPage || (p - 1) * 24 < (count ?? 0)),
          )
          .map((p) => (
            <Link
              key={p}
              className="button button-secondary"
              href={`/explore?${new URLSearchParams({ ...(category ? { category } : {}), ...(status ? { status } : {}), ...(stateFilter ? { state: stateFilter } : {}), ...(q ? { q } : {}), ...(view ? { view } : {}), page: String(p) })}`}
            >
              {p < currentPage ? 'Previous' : 'Next'}
            </Link>
          ))}
      </nav>
    </div>
  )
}
