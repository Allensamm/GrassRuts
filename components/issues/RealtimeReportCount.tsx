'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, getThresholdProgress } from '@/lib/utils'

interface Props {
  issueId: string
  initialCount: number
  threshold: number
  initialStatus: string
}

export default function RealtimeReportCount({
  issueId,
  initialCount,
  threshold,
  initialStatus,
}: Props) {
  const [count, setCount] = useState(initialCount)
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`issue-${issueId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'issues',
          filter: `id=eq.${issueId}`,
        },
        (payload) => {
          if (payload.new.report_count !== undefined)
            setCount(payload.new.report_count as number)
          if (payload.new.status !== undefined)
            setStatus(payload.new.status as string)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [issueId])

  const progress = getThresholdProgress(count, threshold)
  const remaining = Math.max(threshold - count, 0)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Users size={16} />
          {count} of {threshold} reports
        </div>
        <span className="text-xs text-gray-500">
          {remaining > 0
            ? `${remaining} more to reach high priority`
            : '🔥 Threshold reached!'}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            progress >= 100
              ? 'bg-red-500'
              : progress >= 70
                ? 'bg-orange-400'
                : 'bg-[#177353]',
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {status === 'high_priority' && (
        <p className="text-xs text-red-600 font-medium mt-2">
          🚨 The community reporting threshold has been reached. Follow the
          timeline for official updates.
        </p>
      )}
      {status === 'pending' && (
        <p className="text-xs text-gray-500 mt-2">
          At {threshold} reports from the same area, this issue is highlighted
          as high priority.
        </p>
      )}
    </div>
  )
}
