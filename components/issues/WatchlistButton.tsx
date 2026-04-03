'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  lgaId: number
  lgaName: string
  initialWatching: boolean
}

export default function WatchlistButton({ lgaId, lgaName, initialWatching }: Props) {
  const [watching, setWatching] = useState(initialWatching)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      if (watching) {
        await fetch(`/api/watchlist/${lgaId}`, { method: 'DELETE' })
        setWatching(false)
      } else {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lga_id: lgaId }),
        })
        setWatching(true)
      }
    } catch {}
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-colors disabled:opacity-60 ${
        watching
          ? 'bg-[#008751] text-white border-[#008751]'
          : 'bg-white text-gray-600 border-gray-200 hover:border-[#008751] hover:text-[#008751]'
      }`}
    >
      {watching ? <EyeOff size={14} /> : <Eye size={14} />}
      {watching ? `Watching ${lgaName}` : `Watch ${lgaName}`}
    </button>
  )
}
