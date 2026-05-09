'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search, Bell, ChevronRight, User, Settings, LogOut } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

/* ── Breadcrumb config ── */
const BREADCRUMB_MAP: Record<string, string> = {
  dashboard:     'Dashboard',
  explore:       'Explore',
  'my-reports':  'My Reports',
  profile:       'Profile',
  notifications: 'Notifications',
  report:        'Report Issue',
  issues:        'Issues',
  government:    'Government Portal',
  admin:         'Admin',
}

function useBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  return segments.map((seg, i) => ({
    label: BREADCRUMB_MAP[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    href:  '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))
}

/* ── Global Search ── */
function GlobalSearch() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="relative hidden sm:flex flex-1 max-w-xs lg:max-w-sm">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search issues…"
        aria-label="Search issues"
        className={cn(
          'w-full h-8 pl-8 pr-10 rounded-md border border-[#E2E8F0] bg-[#F8F9FA]',
          'text-sm text-[#0F172A] placeholder:text-[#94A3B8]',
          'transition-colors duration-[150ms] linear',
          'focus:outline-none focus:border-[#008751] focus:bg-white focus:ring-2 focus:ring-[#008751]/20'
        )}
      />
      <kbd
        className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1 py-0.5 rounded border border-[#E2E8F0] bg-white text-[10px] font-mono text-[#94A3B8] leading-none select-none"
        aria-hidden="true"
      >
        /
      </kbd>
    </div>
  )
}

/* ── Notification Bell ── */
function NotificationBtn({ count, userId }: { count: number; userId: string }) {
  return (
    <Link
      href="/notifications"
      className={cn(
        'relative flex items-center justify-center w-8 h-8 rounded-md',
        'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]',
        'transition-colors duration-[150ms] linear',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] focus-visible:ring-offset-1'
      )}
      aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
    >
      <Bell size={17} strokeWidth={2} />
      {count > 0 && (
        <span
          className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold tabular leading-none"
          aria-hidden="true"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

/* ── User Dropdown ── */
function UserMenu({ name, initials }: { name: string; initials: string }) {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full',
            'bg-[#008751] text-white text-[11px] font-bold',
            'hover:bg-[#006B40] transition-colors duration-[150ms] linear',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] focus-visible:ring-offset-2'
          )}
          aria-label={`User menu for ${name}`}
        >
          {initials}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'z-50 min-w-[180px] rounded-lg border border-[#E2E8F0] bg-white p-1 shadow-md',
            'data-[state=open]:animate-fade-in'
          )}
          sideOffset={8}
          align="end"
        >
          <div className="px-3 py-2 border-b border-[#E2E8F0] mb-1">
            <p className="text-xs font-semibold text-[#0F172A] truncate">{name}</p>
          </div>

          {[
            { href: '/profile',       icon: User,     label: 'Profile' },
            { href: '/profile',       icon: Settings,  label: 'Settings' },
            { href: '/notifications', icon: Bell,      label: 'Notifications' },
          ].map(item => (
            <DropdownMenu.Item key={item.label} asChild>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#475569]',
                  'hover:bg-[#F1F5F9] hover:text-[#0F172A]',
                  'transition-colors duration-[150ms] linear outline-none',
                  'focus:bg-[#F1F5F9] focus:text-[#0F172A]'
                )}
              >
                <item.icon size={14} strokeWidth={2} aria-hidden="true" />
                {item.label}
              </Link>
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="h-px bg-[#E2E8F0] my-1" />

          <DropdownMenu.Item asChild>
            <button
              onClick={logout}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm w-full',
                'text-red-600 hover:bg-red-50',
                'transition-colors duration-[150ms] linear outline-none',
                'focus:bg-red-50'
              )}
            >
              <LogOut size={14} strokeWidth={2} aria-hidden="true" />
              Sign out
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/* ── AppHeader ── */
interface AppHeaderProps {
  profile: {
    id: string
    full_name: string
    lga?: { name: string; state?: { name: string } | null } | null
  }
  unreadNotifications: number
}

export default function AppHeader({ profile, unreadNotifications }: AppHeaderProps) {
  const crumbs = useBreadcrumbs()
  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header
      className="sticky top-0 z-40 h-14 flex items-center gap-4 px-4 md:px-6 bg-white border-b border-[#E2E8F0]"
      role="banner"
    >
      {/* Mobile logo */}
      <Link href="/dashboard" className="md:hidden shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] rounded">
        <Image src="/logo.svg" alt="Grassruts" width={100} height={20} priority />
      </Link>

      {/* Breadcrumbs — desktop only */}
      {crumbs.length > 0 && (
        <nav className="hidden md:flex items-center gap-1 min-w-0" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm" role="list">
            {crumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1 min-w-0">
                {i > 0 && (
                  <ChevronRight size={13} className="text-[#CBD5E1] shrink-0" aria-hidden="true" />
                )}
                {crumb.isLast ? (
                  <span className="font-semibold text-[#0F172A] truncate" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className={cn(
                      'text-[#94A3B8] hover:text-[#475569] transition-colors duration-[150ms] truncate',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008751] rounded'
                    )}
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global search */}
      <GlobalSearch />

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <NotificationBtn count={unreadNotifications} userId={profile.id} />
        <UserMenu name={profile.full_name} initials={initials} />
      </div>
    </header>
  )
}
