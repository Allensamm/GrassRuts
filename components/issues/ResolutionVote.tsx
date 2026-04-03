'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface Props {
  issueId: string
  userVote: boolean | null   // true = confirmed, false = denied, null = not voted
  confirmedCount: number
  deniedCount: number
  totalReporters: number
}

export default function ResolutionVote({
  issueId, userVote, confirmedCount, deniedCount, totalReporters,
}: Props) {
  const router = useRouter()
  const [vote, setVote] = useState<boolean | null>(userVote)
  const [confirmed, setConfirmed] = useState(confirmedCount)
  const [denied, setDenied] = useState(deniedCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const needed = Math.ceil(totalReporters * 0.5)
  const confirmPercent = totalReporters > 0 ? Math.round((confirmed / totalReporters) * 100) : 0

  const castVote = async (isResolved: boolean) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/issues/${issueId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_resolved: isResolved }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to submit vote'); setLoading(false); return }

      // Optimistically update counts
      if (vote === null) {
        if (isResolved) setConfirmed(c => c + 1)
        else setDenied(d => d + 1)
      } else if (vote !== isResolved) {
        if (isResolved) { setConfirmed(c => c + 1); setDenied(d => d - 1) }
        else { setDenied(d => d + 1); setConfirmed(c => c - 1) }
      }

      setVote(isResolved)
      router.refresh()
    } catch {
      setError('Network error. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
      <h2 className="text-sm font-bold text-amber-900 mb-0.5">Community Verification Required</h2>
      <p className="text-xs text-amber-700 mb-4">
        Government has marked this issue as resolved. As a reporter, please confirm whether it&apos;s actually fixed.
        Resolution is confirmed when {needed} of {totalReporters} reporters agree.
      </p>

      {/* Vote tally */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-white rounded-xl p-3 text-center border border-amber-100">
          <p className="text-lg font-bold text-green-600">{confirmed}</p>
          <p className="text-xs text-gray-500">Confirmed fixed</p>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 text-center border border-amber-100">
          <p className="text-lg font-bold text-red-500">{denied}</p>
          <p className="text-xs text-gray-500">Still broken</p>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 text-center border border-amber-100">
          <p className="text-lg font-bold text-gray-700">{needed}</p>
          <p className="text-xs text-gray-500">Needed</p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${Math.min(confirmPercent, 100)}%` }}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => castVote(true)}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
            vote === true
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-200'
          } disabled:opacity-60`}
        >
          <ThumbsUp size={16} />
          Yes, it&apos;s fixed
        </button>
        <button
          onClick={() => castVote(false)}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
            vote === false
              ? 'bg-red-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-200'
          } disabled:opacity-60`}
        >
          <ThumbsDown size={16} />
          Still broken
        </button>
      </div>

      {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}
    </div>
  )
}
