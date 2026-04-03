'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

interface Props {
  issueId: string
  userHasReported: boolean
  isResolved: boolean
  isDisaspora?: boolean
}

export default function AddReportButton({ issueId, userHasReported, isResolved, isDisaspora }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(userHasReported)

  if (isDisaspora) {
    return (
      <div className="text-center py-3 px-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
        👁️ Diaspora users can watch and share issues but cannot add reports.
      </div>
    )
  }

  if (isResolved) {
    return (
      <div className="text-center py-3 text-sm text-gray-400">
        This issue has been resolved.
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 rounded-xl text-sm font-semibold">
        <CheckCircle size={16} />
        You&apos;ve reported this issue
      </div>
    )
  }

  const handleReport = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/issues/${issueId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to add report')
        setLoading(false)
        return
      }
      setDone(true)
      router.refresh()
    } catch {
      setError('Network error. Try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleReport}
        disabled={loading}
        className="w-full bg-[#008751] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Adding your report...' : 'I have this problem too — Add My Report'}
      </button>
      {error && (
        <p className="text-red-500 text-xs text-center mt-2">{error}</p>
      )}
    </div>
  )
}
