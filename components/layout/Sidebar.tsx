'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Compass, FileText, User, Bell,
  PlusCircle, LogOut, ChevronRight,
} from 'lucide-react'
import * as Separator from '@radix-ui/react-separator'
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

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/explore',   icon: Compass,         label: 'Explore' },
    ],
  },
  {
    label: 'My Activity',
    items: [
      { href: '/my-reports', icon: FileText, label: 'My Reports' },
      { href: '/profile',    icon: User,     label: 'Profile' },
    ],
  },
]

function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  active,
}: {
  href: string
  icon: React.ElementType
  label: string
  badge?: number
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
        'transition-colors duration-[150ms] linear',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] focus-visible:ring-offset-1',
        active
          ? 'bg-[#F0FDF6] text-[#008751]'
          : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {/* Left accent bar */}
      <span
        className={cn(
          'absolute left-0 top-1 bottom-1 w-0.5 rounded-full transition-opacity duration-[150ms]',
          active ? 'bg-[#008751] opacity-100' : 'opacity-0'
        )}
        aria-hidden="true"
      />
      <Icon
        size={16}
        strokeWidth={2}
        className={cn(active ? 'text-[#008751]' : 'text-[#94A3B8] group-hover:text-[#475569]')}
        aria-hidden="true"
      />
      <span className="flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold tabular leading-none"
          aria-label={`${badge} unread`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

export default function Sidebar({ profile, unreadNotifications }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside
      className="hidden md:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 bg-white border-r border-[#E2E8F0] z-30"
      aria-label="Main navigation"
    >
      {/* Logo — same height as header (56px) */}
      <div className="flex items-center h-14 px-4 border-b border-[#E2E8F0] shrink-0">
        <Link
          href="/dashboard"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] focus-visible:ring-offset-2 rounded"
        >
          <Image src="/logo.svg" alt="Grassruts" width={120} height={24} priority />
        </Link>
      </div>

      {/* Report CTA */}
      <div className="px-3 pt-4 pb-3 shrink-0">
        <Link
          href="/report"
          className={cn(
            'flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md',
            'bg-[#008751] text-white text-sm font-semibold',
            'hover:bg-[#006B40] transition-colors duration-[150ms] linear',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] focus-visible:ring-offset-2'
          )}
        >
          <PlusCircle size={15} strokeWidth={2.5} aria-hidden="true" />
          Report Issue
        </Link>
      </div>

      <Separator.Root
        className="h-px bg-[#E2E8F0] mx-3"
        decorative
      />

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin" aria-label="Site navigation">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]" aria-hidden="true">
              {group.label}
            </p>
            <ul className="space-y-0.5" role="list">
              {group.items.map(item => (
                <li key={item.href}>
                  <NavItem
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={pathname === item.href || pathname.startsWith(item.href + '/')}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}

        <Separator.Root className="h-px bg-[#E2E8F0]" decorative />

        <ul className="space-y-0.5" role="list">
          <li>
            <NavItem
              href="/notifications"
              icon={Bell}
              label="Notifications"
              badge={unreadNotifications}
              active={pathname.startsWith('/notifications')}
            />
          </li>
        </ul>
      </nav>

      {/* User card */}
      <div className="shrink-0 border-t border-[#E2E8F0] p-3 space-y-1">
        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md w-full',
            'hover:bg-[#F1F5F9] transition-colors duration-[150ms] linear',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] focus-visible:ring-offset-1'
          )}
        >
          <div
            className="w-7 h-7 rounded-full bg-[#008751] flex items-center justify-center text-white text-[11px] font-bold shrink-0"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0F172A] truncate">{profile.full_name}</p>
            <p className="text-[11px] text-[#94A3B8] truncate">
              {profile.lga?.name ?? 'No LGA set'}
              {profile.lga?.state ? `, ${profile.lga.state.name}` : ''}
            </p>
          </div>
          <ChevronRight size={14} className="text-[#CBD5E1] shrink-0" aria-hidden="true" />
        </Link>

        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md w-full',
            'text-sm text-[#94A3B8] hover:text-[#DC2626] hover:bg-red-50',
            'transition-colors duration-[150ms] linear',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1'
          )}
        >
          <LogOut size={15} strokeWidth={2} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
