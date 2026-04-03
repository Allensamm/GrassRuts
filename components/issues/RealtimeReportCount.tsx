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

export default function RealtimeReportCount({ issueId, initialCount, threshold, initialStatus }: Props) {
  const [count, setCount] = useState(initialCount)
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`issue-${issueId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'issues', filter: `id=eq.${issueId}` },
        (payload) => {
          if (payload.new.report_count !== undefined) setCount(payload.new.report_count as number)
          if (payload.new.status !== undefined) setStatus(payload.new.status as string)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
        <span className="text-xs text-gray-400">
          {remaining > 0 ? `${remaining} more needed to escalate` : '🔥 Threshold reached!'}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            progress >= 100 ? 'bg-red-500' : progress >= 70 ? 'bg-orange-400' : 'bg-[#008751]'
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {status === 'high_priority' && (
        <p className="text-xs text-red-600 font-medium mt-2">
          🚨 This issue has been escalated to government authorities.
        </p>
      )}
      {status === 'pending' && (
        <p className="text-xs text-gray-400 mt-2">
          Issues escalate to government at {threshold} reports from the same area.
        </p>
      )}
    </div>
  )
}
