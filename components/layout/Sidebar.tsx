'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Map, PlusCircle, FileText, User, Bell, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  profile: {
    id: string
    full_name: string
    lga?: { name: string; state?: { name: string } | null } | null
  }
  unreadNotifications: number
}

const NAV = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/explore', icon: Map, label: 'Explore' },
  { href: '/my-reports', icon: FileText, label: 'My Reports' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar({ profile, unreadNotifications }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col h-screen sticky top-0 bg-white border-r border-gray-100 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-50">
        <Link href="/dashboard">
          <Image src="/logo.svg" alt="Grassruts" width={130} height={26} priority />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#E8F5EE] text-[#008751]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={18} className={isActive ? 'text-[#008751]' : 'text-gray-400'} />
              {label}
            </Link>
          )
        })}

        {/* Report — primary CTA */}
        <Link
          href="/report"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[#008751] text-white hover:bg-[#006B40] transition-colors mt-2"
        >
          <PlusCircle size={18} />
          Report Issue
        </Link>
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <Link
          href="/notifications"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            pathname.startsWith('/notifications')
              ? 'bg-[#E8F5EE] text-[#008751]'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <div className="relative">
            <Bell size={18} className="text-gray-400" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </div>
          Notifications
          {unreadNotifications > 0 && (
            <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadNotifications}
            </span>
          )}
        </Link>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-[#008751] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{profile.lga?.name ?? ''}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
