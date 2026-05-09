'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, PlusCircle, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/explore', icon: Map, label: 'Explore' },
  { href: '/report', icon: PlusCircle, label: 'Report', primary: true },
  { href: '/my-reports', icon: FileText, label: 'My Reports' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-pb">
      <div className="px-2 h-16 flex items-center justify-around">
        {navItems.map(({ href, icon: Icon, label, primary }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-[52px]',
                primary
                  ? 'text-white bg-[#008751] -mt-4 shadow-lg shadow-green-200 px-4 py-2'
                  : isActive
                  ? 'text-[#008751]'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={primary ? 22 : 20} />
              <span className={cn('text-xs font-medium', primary ? 'text-white' : '')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
