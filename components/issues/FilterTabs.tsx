'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'All', value: '' },
  { label: '🔥 High Priority', value: 'high_priority' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Resolved', value: 'resolved' },
]

export default function FilterTabs({ activeFilter }: { activeFilter?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('filter', value)
    } else {
      params.delete('filter')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {TABS.map((tab) => {
        const isActive = (activeFilter ?? '') === tab.value
        return (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap',
              isActive
                ? 'bg-[#008751] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#008751] hover:text-[#008751]'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
