'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { CATEGORIES, STATUSES } from '@/lib/categories'
interface Props {
  activeStatuses: string[]
  activeCategories: string[]
}
export default function FilterSidebar({
  activeStatuses,
  activeCategories,
}: Props) {
  const router = useRouter(),
    pathname = usePathname(),
    params = useSearchParams()
  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    p.delete('page')
    router.push(`${pathname}?${p}`, { scroll: false })
  }
  return (
    <div className="filter-bar">
      <label>
        Status
        <select
          value={activeStatuses[0] || ''}
          onChange={(e) => update('status', e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Category
        <select
          value={activeCategories[0] || ''}
          onChange={(e) => update('category', e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sort by
        <select
          value={params.get('sort') || 'recent'}
          onChange={(e) => update('sort', e.target.value)}
        >
          <option value="recent">Most recent</option>
          <option value="reports">Most reported</option>
        </select>
      </label>
      {(activeStatuses.length > 0 ||
        activeCategories.length > 0 ||
        params.get('q')) && (
        <button
          onClick={() => router.push(pathname)}
          className="button button-secondary"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
