'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { List, Map } from 'lucide-react'

const CATEGORIES = [
  { slug: 'infrastructure', label: 'Roads', icon: '🛣️' },
  { slug: 'water', label: 'Water', icon: '💧' },
  { slug: 'electricity', label: 'Power', icon: '⚡' },
  { slug: 'public_health', label: 'Health', icon: '🏥' },
  { slug: 'security', label: 'Security', icon: '🔒' },
  { slug: 'education', label: 'Education', icon: '🏫' },
  { slug: 'environment', label: 'Environment', icon: '🌍' },
  { slug: 'other', label: 'Other', icon: '❓' },
]

const STATUSES = [
  { value: 'high_priority', label: '🔥 High Priority' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'verified', label: 'Verified' },
]

interface Props {
  states: { id: number; name: string }[]
  activeCategory?: string
  activeStatus?: string
  activeState?: string
  activeView: string
}

export default function ExploreFilters({ states, activeCategory, activeStatus, activeState, activeView }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/explore?${params.toString()}`)
  }

  return (
    <div className="space-y-3">
      {/* View toggle + category scroll */}
      <div className="flex items-center gap-2">
        {/* Map/List toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 shrink-0">
          <button
            onClick={() => update('view', undefined)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeView !== 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            <List size={14} /> List
          </button>
          <button
            onClick={() => update('view', 'map')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeView === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            <Map size={14} /> Map
          </button>
        </div>

        {/* Category scroll */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide flex-1">
          <button
            onClick={() => update('category', undefined)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !activeCategory ? 'bg-[#008751] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#008751]'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              onClick={() => update('category', activeCategory === cat.slug ? undefined : cat.slug)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat.slug ? 'bg-[#008751] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#008751]'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status + State row */}
      <div className="flex gap-2">
        <select
          value={activeStatus ?? ''}
          onChange={e => update('status', e.target.value || undefined)}
          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#008751]"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={activeState ?? ''}
          onChange={e => update('state', e.target.value || undefined)}
          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#008751]"
        >
          <option value="">All states</option>
          {states.map(s => (
            <option key={s.id} value={String(s.id)}>{s.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
