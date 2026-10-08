'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Compass, PlusCircle, Bell, User } from 'lucide-react'
export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {[
        { href: '/dashboard', label: 'Community', Icon: LayoutDashboard },
        { href: '/explore', label: 'Explore', Icon: Compass },
        { href: '/report', label: 'Report', Icon: PlusCircle },
        { href: '/notifications', label: 'Updates', Icon: Bell },
        { href: '/profile', label: 'Account', Icon: User },
      ].map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={path === href ? 'page' : undefined}
        >
          <Icon size={22} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
