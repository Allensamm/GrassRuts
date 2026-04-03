'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-6">{error.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={reset}
        className="bg-[#008751] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#006B40] transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
