import { createClient } from '@/lib/supabase/server'
import IssueCard from '@/components/issues/IssueCard'
import ExploreFilters from '@/components/issues/ExploreFilters'
import ExploreView from '@/components/issues/ExploreView'
import type { IssueStatus } from '@/types'
import type { IssueMapItem } from '@/components/map/IssueMapDynamic'

interface Props {
  searchParams: Promise<{ category?: string; status?: string; state?: string; view?: string }>
}

const VALID_STATUSES: IssueStatus[] = ['pending', 'high_priority', 'in_review', 'resolved', 'verified']

export default async function ExplorePage({ searchParams }: Props) {
  const { category, status, state: stateFilter, view } = await searchParams
  const isMapView = view === 'map'
  const supabase = await createClient()

  const { data: states } = await supabase
    .from('states')
    .select('id, name')
    .order('name')

  let query = supabase
    .from('issues')
    .select(`
      id, title, description, status, report_count, threshold,
      community, address, created_at, updated_at, lat, lng,
      category:categories(name, icon, slug),
      lga:lgas(name, state:states(id, name))
    `)
    .order('report_count', { ascending: false })
    .limit(50)

  if (status && VALID_STATUSES.includes(status as IssueStatus)) {
    query = query.eq('status', status)
  }

  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  const { data: rawIssues } = await query

  // Normalise joins and filter by state
  const issues = (rawIssues ?? [])
    .map(issue => {
      const r = issue as any
      const cat = Array.isArray(r.category) ? r.category[0] : r.category
      const lga = Array.isArray(r.lga) ? r.lga[0] : r.lga
      const st = Array.isArray(lga?.state) ? lga.state[0] : lga?.state
      return { ...issue, _category: cat, _lga: lga, _state: st }
    })
    .filter(issue => !stateFilter || String(issue._state?.id) === stateFilter)

  // Shape for map
  const mapIssues: IssueMapItem[] = issues.map(issue => ({
    id: issue.id,
    title: issue.title,
    status: issue.status,
    report_count: issue.report_count,
    threshold: issue.threshold,
    lat: (issue as any).lat ?? null,
    lng: (issue as any).lng ?? null,
    category_icon: issue._category?.icon ?? '❓',
    category_name: issue._category?.name ?? 'Other',
    lga_name: issue._lga?.name ?? '',
  }))

  return (
    <div className="px-4 md:px-6 py-5">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Explore Issues</h1>
        <p className="text-sm text-gray-500 mt-0.5">Community issues across Nigeria</p>
      </div>

      <ExploreFilters
        states={states ?? []}
        activeCategory={category}
        activeStatus={status}
        activeState={stateFilter}
        activeView={view ?? 'list'}
      />

      <div className="mt-4">
        <ExploreView
          issues={issues as any}
          mapIssues={mapIssues}
          isMapView={isMapView}
        />
      </div>
    </div>
  )
}
