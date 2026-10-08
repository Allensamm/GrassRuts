'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { Brand } from './Brand'
interface Props {
  profile: {
    id: string
    full_name: string
    lga?: { name: string; state?: { name: string } | null } | null
  }
  unreadNotifications: number
}
export default function AppHeader({ profile, unreadNotifications }: Props) {
  const pathname = usePathname()
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <header className="app-header">
      <div className="md:hidden">
        <Brand />
      </div>
      <p className="hidden md:block text-sm text-[#52635B]">
        A shared record. A stronger community.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#DDE5DC] relative"
          aria-label={
            unreadNotifications
              ? `${unreadNotifications} unread updates`
              : 'Updates'
          }
        >
          <Bell size={19} />
          {unreadNotifications > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#B85032]" />
          )}
        </Link>
        <Link
          href="/profile"
          className="grid h-11 w-11 place-items-center rounded-full bg-[#E8EED9] text-sm font-semibold text-[#183D2E]"
          aria-label={`Account for ${profile.full_name}`}
        >
          {initials}
        </Link>
      </div>
      <form
        action={pathname === '/dashboard' ? '/dashboard' : '/explore'}
        className="relative w-full md:order-none md:ml-auto md:mr-4 md:max-w-xs md:w-auto md:flex-1"
      >
        <Search
          size={17}
          className="absolute left-3 top-3.5 text-[#637268]"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          aria-label="Search community issues"
          placeholder="Search community issues…"
          maxLength={100}
          className="w-full rounded-xl border border-[#DDE5DC] bg-[#F7F8F2] py-2.5 pl-10 pr-3 text-sm"
        />
      </form>
    </header>
  )
}
