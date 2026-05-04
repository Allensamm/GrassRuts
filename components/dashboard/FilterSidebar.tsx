'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Separator from '@radix-ui/react-separator'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUSES = [
  { value: 'pending',       label: 'Pending',       dot: 'bg-amber-400' },
  { value: 'high_priority', label: 'High Priority',  dot: 'bg-red-500'  },
  { value: 'in_review',     label: 'In Review',      dot: 'bg-blue-500' },
  { value: 'resolved',      label: 'Resolved',       dot: 'bg-green-500'},
  { value: 'verified',      label: 'Verified',       dot: 'bg-emerald-600'},
]

const CATEGORIES = [
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'water',          label: 'Water Supply'   },
  { value: 'electricity',    label: 'Electricity'    },
  { value: 'health',         label: 'Health'         },
  { value: 'education',      label: 'Education'      },
  { value: 'security',       label: 'Security'       },
  { value: 'environment',    label: 'Environment'    },
  { value: 'transportation', label: 'Transportation' },
]

interface FilterSidebarProps {
  activeStatuses: string[]
  activeCategories: string[]
}

export default function FilterSidebar({ activeStatuses, activeCategories }: FilterSidebarProps) {
  const router     = useRouter()
  const pathname   = usePathname()
  const params     = useSearchParams()

  const update = useCallback((key: string, values: string[]) => {
    const p = new URLSearchParams(params.toString())
    if (values.length === 0) {
      p.delete(key)
    } else {
      p.set(key, values.join(','))
    }
    router.push(`${pathname}?${p.toString()}`, { scroll: false })
  }, [params, pathname, router])

  const toggleStatus = (value: string) => {
    const next = activeStatuses.includes(value)
      ? activeStatuses.filter(s => s !== value)
      : [...activeStatuses, value]
    update('status', next)
  }

  const toggleCategory = (value: string) => {
    const next = activeCategories.includes(value)
      ? activeCategories.filter(c => c !== value)
      : [...activeCategories, value]
    update('category', next)
  }

  const clearAll = () => {
    const p = new URLSearchParams(params.toString())
    p.delete('status')
    p.delete('category')
    router.push(`${pathname}?${p.toString()}`, { scroll: false })
  }

  const hasFilters = activeStatuses.length > 0 || activeCategories.length > 0

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col border-r border-[#E2E8F0] bg-white overflow-y-auto scrollbar-thin"
      aria-label="Filter issues"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-11 px-4 border-b border-[#E2E8F0] shrink-0">
        <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-widest">Filters</span>
        {hasFilters && (
          <button
            onClick={clearAll}
            className={cn(
              'flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-red-500',
              'transition-colors duration-[150ms] linear',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] rounded'
            )}
          >
            <X size={11} aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Status filter */}
        <fieldset>
          <legend className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-2">
            Status
          </legend>
          <ul className="space-y-1" role="list">
            {STATUSES.map(s => (
              <li key={s.value}>
                <label
                  className={cn(
                    'flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer',
                    'hover:bg-[#F1F5F9] transition-colors duration-[150ms] linear',
                    activeStatuses.includes(s.value) && 'bg-[#F0FDF6]'
                  )}
                >
                  <Checkbox.Root
                    checked={activeStatuses.includes(s.value)}
                    onCheckedChange={() => toggleStatus(s.value)}
                    className={cn(
                      'w-4 h-4 rounded border border-[#CBD5E1] bg-white flex items-center justify-center shrink-0',
                      'transition-colors duration-[150ms] linear',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] focus-visible:ring-offset-1',
                      activeStatuses.includes(s.value) && 'bg-[#008751] border-[#008751]'
                    )}
                    aria-label={s.label}
                  >
                    <Checkbox.Indicator>
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} aria-hidden="true" />
                  <span className="text-sm text-[#475569] leading-none">{s.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <Separator.Root className="h-px bg-[#E2E8F0]" decorative />

        {/* Category filter */}
        <fieldset>
          <legend className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-2">
            Category
          </legend>
          <ul className="space-y-1" role="list">
            {CATEGORIES.map(c => (
              <li key={c.value}>
                <label
                  className={cn(
                    'flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer',
                    'hover:bg-[#F1F5F9] transition-colors duration-[150ms] linear',
                    activeCategories.includes(c.value) && 'bg-[#F0FDF6]'
                  )}
                >
                  <Checkbox.Root
                    checked={activeCategories.includes(c.value)}
                    onCheckedChange={() => toggleCategory(c.value)}
                    className={cn(
                      'w-4 h-4 rounded border border-[#CBD5E1] bg-white flex items-center justify-center shrink-0',
                      'transition-colors duration-[150ms] linear',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] focus-visible:ring-offset-1',
                      activeCategories.includes(c.value) && 'bg-[#008751] border-[#008751]'
                    )}
                    aria-label={c.label}
                  >
                    <Checkbox.Indicator>
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="text-sm text-[#475569] leading-none">{c.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>
    </aside>
  )
}
