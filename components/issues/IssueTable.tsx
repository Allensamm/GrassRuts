import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ChevronRight, TrendingUp } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Issue {
  id: string
  title: string
  status: string
  report_count: number
  threshold: number
  community: string | null
  address: string | null
  created_at: string
  category: { name: string; icon: string; slug: string } | null
  lga: { name: string } | null
}

interface IssueTableProps {
  issues: Issue[]
  emptyMessage?: string
}

function ProgressBar({ count, threshold }: { count: number; threshold: number }) {
  const pct = Math.min((count / threshold) * 100, 100)
  const color = pct >= 100 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-[#008751]'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden min-w-[48px]">
        <div
          className={cn('h-full rounded-full transition-all duration-[150ms] linear', color)}
          style={{ width: `${pct}%` }}
          role="presentation"
        />
      </div>
      <span className="text-[11px] tabular text-[#475569] font-medium shrink-0 w-[3.5ch] text-right">
        {count}
      </span>
    </div>
  )
}

function EmptyRow({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={6} className="px-4 py-16 text-center">
        <TrendingUp size={32} className="text-[#E2E8F0] mx-auto mb-3" />
        <p className="text-sm font-medium text-[#475569]">{message}</p>
        <p className="text-xs text-[#94A3B8] mt-1">Issues reported in your area will appear here</p>
      </td>
    </tr>
  )
}

export default function IssueTable({ issues, emptyMessage = 'No issues found' }: IssueTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse" role="table" aria-label="Community issues">
        <thead>
          <tr className="border-b border-[#E2E8F0]">
            {[
              { label: 'Issue',    width: 'min-w-[240px]' },
              { label: 'Category', width: 'w-[120px]'     },
              { label: 'Location', width: 'w-[140px]'     },
              { label: 'Status',   width: 'w-[120px]'     },
              { label: 'Reports',  width: 'w-[140px]'     },
              { label: 'Date',     width: 'w-[100px]'     },
              { label: '',         width: 'w-10'           },
            ].map(col => (
              <th
                key={col.label}
                scope="col"
                className={cn(
                  'px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]',
                  col.width
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {issues.length === 0 ? (
            <EmptyRow message={emptyMessage} />
          ) : (
            issues.map(issue => (
              <tr
                key={issue.id}
                className="group border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8F9FA] transition-colors duration-[150ms] linear"
              >
                {/* Issue title */}
                <td className="px-4 py-3">
                  <Link
                    href={`/issues/${issue.id}`}
                    className={cn(
                      'font-medium text-[#0F172A] line-clamp-2 leading-snug',
                      'hover:text-[#008751] transition-colors duration-[150ms] linear',
                      'focus-visible:outline-none focus-visible:underline focus-visible:decoration-[#008751]'
                    )}
                  >
                    {issue.title}
                  </Link>
                  {(issue.community || issue.address) && (
                    <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
                      {issue.community ?? issue.address}
                    </p>
                  )}
                </td>

                {/* Category */}
                <td className="px-4 py-3">
                  {issue.category ? (
                    <span className="flex items-center gap-1.5 text-[#475569]">
                      <span aria-hidden="true">{issue.category.icon}</span>
                      <span className="text-xs truncate">{issue.category.name}</span>
                    </span>
                  ) : (
                    <span className="text-[#CBD5E1] text-xs">—</span>
                  )}
                </td>

                {/* Location */}
                <td className="px-4 py-3">
                  <span className="text-xs text-[#475569] truncate block">
                    {issue.lga?.name ?? '—'}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge status={issue.status} />
                </td>

                {/* Reports progress */}
                <td className="px-4 py-3">
                  <ProgressBar count={issue.report_count} threshold={issue.threshold ?? 50} />
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <span className="text-xs text-[#94A3B8] tabular whitespace-nowrap">
                    {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                  </span>
                </td>

                {/* Action */}
                <td className="px-4 py-3">
                  <Link
                    href={`/issues/${issue.id}`}
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-md',
                      'text-[#CBD5E1] group-hover:text-[#008751] group-hover:bg-[#F0FDF6]',
                      'transition-colors duration-[150ms] linear',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751]'
                    )}
                    aria-label={`View issue: ${issue.title}`}
                  >
                    <ChevronRight size={15} strokeWidth={2} />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
