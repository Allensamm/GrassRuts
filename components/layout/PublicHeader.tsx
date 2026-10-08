import Link from 'next/link'
import { ArrowUpRight, Sprout } from 'lucide-react'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? 'brand-light' : ''}`}
      aria-label="Grassruts home"
    >
      <span className="brand-mark">
        <Sprout size={23} strokeWidth={2} />
      </span>
      <span>
        grassruts<span className="brand-period">.</span>
      </span>
    </Link>
  )
}

export default function PublicHeader() {
  return (
    <header className="public-header">
      <div className="site-container flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-1 sm:gap-5"
        >
          <Link href="/explore" className="nav-link">
            Explore issues
          </Link>
          <Link href="/about" className="nav-link hidden sm:inline-flex">
            Our purpose
          </Link>
          <Link href="/login" className="nav-link hidden md:inline-flex">
            Sign in
          </Link>
          <Link href="/report" className="button button-primary">
            Report an issue <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  )
}
