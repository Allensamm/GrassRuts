import Link from 'next/link'
import { Sprout } from 'lucide-react'

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
