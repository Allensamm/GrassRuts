import Link from 'next/link'
import { MapPin, Users } from 'lucide-react'
import { cn, getStatusColor, getStatusLabel, getThresholdProgress, timeAgo } from '@/lib/utils'
import type { Issue } from '@/types'

interface IssueCardProps {
  issue: Issue & {
    category?: { name: string; icon: string; slug: string } | null
    lga?: { name: string } | null
  }
}

const STATUS_BORDER: Record<string, string> = {
  high_priority: 'border-l-red-500',
  in_review: 'border-l-blue-400',
  resolved: 'border-l-green-500',
  verified: 'border-l-emerald-600',
  pending: 'border-l-gray-300',
}

export default function IssueCard({ issue }: IssueCardProps) {
  const progress = getThresholdProgress(issue.report_count, issue.threshold)
  const remaining = Math.max(issue.threshold - issue.report_count, 0)
  const borderColor = STATUS_BORDER[issue.status] ?? 'border-l-gray-300'

  return (
    <Link href={`/issues/${issue.id}`} className="block group">
      <div className={cn(
        'bg-white rounded-xl border border-gray-100 border-l-4 p-4 transition-all hover:shadow-md hover:border-gray-200',
        borderColor
      )}>
        {/* Top row: category + status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base leading-none">{issue.category?.icon ?? '❓'}</span>
            <span className="text-xs text-gray-400 font-medium truncate">{issue.category?.name ?? 'Other'}</span>
          </div>
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap',
            getStatusColor(issue.status)
          )}>
            {issue.status === 'high_priority' && '🔥 '}{getStatusLabel(issue.status)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#008751] transition-colors">
          {issue.title}
        </h3>

        {/* Location */}
        {(issue.community || issue.lga?.name) && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{issue.community ? `${issue.community}, ` : ''}{issue.lga?.name}</span>
          </div>
        )}

        {/* Progress */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              progress >= 100 ? 'bg-red-500' : progress >= 70 ? 'bg-orange-400' : 'bg-[#008751]'
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={11} />
            <span>
              <span className="font-semibold text-gray-700">{issue.report_count}</span>
              <span className="text-gray-400">/{issue.threshold}</span>
              {remaining > 0 && <span className="text-gray-400"> · {remaining} more</span>}
            </span>
          </div>
          <span className="text-xs text-gray-400">{timeAgo(issue.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
