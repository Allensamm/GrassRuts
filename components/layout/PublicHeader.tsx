import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Brand } from './Brand'

export default async function PublicHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="public-header">
      <div className="site-container flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-1 sm:gap-5"
        >
          <Link href="/explore" className="nav-link">
            Explore issues
          </Link>
          <Link href="/about" className="nav-link hidden sm:inline-flex">
            Our purpose
          </Link>
          <Link href={user ? '/dashboard' : '/login'} className="nav-link">
            {user ? 'Dashboard' : 'Sign in'}
          </Link>
          <Link href="/report" className="button button-primary">
            Report an issue <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  )
}
