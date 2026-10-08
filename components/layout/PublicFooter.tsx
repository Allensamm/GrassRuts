import Link from 'next/link'
import { Brand } from './Brand'

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="site-container">
        <div className="flex flex-col justify-between gap-8 border-b border-white/15 pb-9 md:flex-row">
          <div>
            <Brand light />
            <p className="mt-4 max-w-sm text-sm leading-7 text-green-100/80">
              Better communities start with people who care.
              <br />
              Built for Nigeria. Powered by participation.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-start gap-x-8 gap-y-4 text-sm"
          >
            <Link href="/explore">Explore</Link>
            <Link href="/about">About us</Link>
            <Link href="/contact">Get in touch</Link>
            <Link href="/government">For government</Link>
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-4 pt-6 text-xs text-green-100/80">
          <p>
            © {new Date().getFullYear()} Grassruts · A join2getherwork product
          </p>
          <div className="flex gap-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms of use</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
