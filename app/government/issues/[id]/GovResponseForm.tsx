'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  issueId: string
  govUserId: string
  currentStatus: string
}

const UPDATE_TYPES = [
  { value: 'acknowledged', label: 'Acknowledged', description: 'We have seen this issue and are looking into it' },
  { value: 'in_progress', label: 'In Progress', description: 'Work has begun to address this issue' },
  { value: 'resolved', label: 'Resolved', description: 'This issue has been fixed' },
  { value: 'rejected', label: 'Rejected', description: 'This issue cannot be addressed at this time' },
]

export default function GovResponseForm({ issueId, currentStatus }: Props) {
  const router = useRouter()
  const [updateType, setUpdateType] = useState('acknowledged')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (currentStatus === 'resolved') {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
        <p className="text-green-700 font-semibold">This issue has been marked as resolved.</p>
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) { setError('Please enter a message.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/government/issues/${issueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update_type: updateType, message }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Failed to submit response.')
        return
      }
      setSuccess(true)
      setMessage('')
      router.refresh()
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Post Official Response</h2>
      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl p-3 mb-4">
          Response posted successfully. Citizens have been notified.
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {UPDATE_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => setUpdateType(type.value)}
              className={`text-left p-3 rounded-xl border-2 transition-colors ${
                updateType === type.value
                  ? 'border-[#008751] bg-[#008751]/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{type.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>
            </button>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Official Message</label>
          <textarea
            required
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder="Provide an official update to the community..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] resize-none"
          />
        </div>
        {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#008751] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors disabled:opacity-60"
        >
          {loading ? 'Posting...' : 'Post Response'}
        </button>
      </form>
    </div>
  )
}
