'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface Props {
  title: string
  reportCount: number
  lgaName: string
}

export default function ShareButton({ title, reportCount, lgaName }: Props) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = window.location.href
    const text = `${reportCount} people in ${lgaName} are reporting: "${title}"`

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch {}
    }

    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(`${text}\n${url}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={share}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-[#008751] hover:text-[#008751] transition-colors bg-white"
    >
      {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
