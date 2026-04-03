'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'
import NotificationBell from './NotificationBell'

interface AppHeaderProps {
  profile: {
    id: string
    full_name: string
    lga?: { name: string; state?: { name: string } | null } | null
  }
  unreadNotifications: number
}

export default function AppHeader({ profile, unreadNotifications }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo — only visible on mobile (desktop sidebar has it) */}
        <Link href="/dashboard" className="md:hidden shrink-0">
          <Image src="/logo.svg" alt="Grassruts" width={110} height={22} priority />
        </Link>

        {/* Search bar — grows to fill space */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
            />
          </div>
        </div>

        {/* Right actions — bell hidden on desktop (sidebar has it), avatar always shown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="md:hidden">
            <NotificationBell userId={profile.id} initialUnreadCount={unreadNotifications} />
          </div>
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-[#008751] flex items-center justify-center text-white text-xs font-bold"
          >
            {profile.full_name.charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  )
}
