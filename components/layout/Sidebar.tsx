'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Compass,
  FileText,
  User,
  Bell,
  Plus,
  ArrowUpRight,
} from 'lucide-react'
import { Brand } from './Brand'
interface Props {
  profile: {
    id: string
    full_name: string
    lga?: { name: string; state?: { name: string } | null } | null
  }
  unreadNotifications: number
}
export default function Sidebar({ profile, unreadNotifications }: Props) {
  const pathname = usePathname()
  const links = [
    { href: '/dashboard', label: 'My community', Icon: LayoutDashboard },
    { href: '/explore', label: 'Explore Nigeria', Icon: Compass },
    { href: '/my-reports', label: 'My reports', Icon: FileText },
    { href: '/notifications', label: 'Updates', Icon: Bell },
    { href: '/profile', label: 'My account', Icon: User },
  ]
  return (
    <aside className="app-sidebar">
      <div className="px-3">
        <Brand light />
      </div>
      <div className="mt-9 mb-6 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
        <p className="text-xs text-green-100/70">YOUR COMMUNITY</p>
        <p className="mt-1 text-sm font-semibold text-white">
          {profile.lga?.name || 'Find your community'}
        </p>
        {profile.lga?.state?.name && (
          <p className="mt-1 text-xs text-green-100/80">
            {profile.lga.state.name}
          </p>
        )}
      </div>
      <nav aria-label="Your account">
        {links.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="side-link"
            aria-current={pathname === href ? 'page' : undefined}
          >
            <Icon size={19} />
            {label}
            {href === '/notifications' && unreadNotifications > 0 && (
              <span className="ml-auto rounded-full bg-[#DAE8A0] px-2 py-0.5 text-xs text-[#183D2E]">
                {unreadNotifications}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <Link
        href="/report"
        className="button mt-6 bg-[#DAE8A0] text-[#183D2E] hover:bg-white"
      >
        <Plus size={18} />
        Report an issue
      </Link>
      <div className="mt-auto px-3 pt-10">
        <p className="text-sm font-semibold text-white">
          Small actions add up.
        </p>
        <p className="mt-2 text-xs leading-6 text-green-100/75">
          Keep showing up for the place you call home.
        </p>
        <Link
          href="/about"
          className="mt-4 inline-flex items-center gap-2 text-xs text-[#DAE8A0]"
        >
          Our purpose <ArrowUpRight size={14} />
        </Link>
      </div>
    </aside>
  )
}
