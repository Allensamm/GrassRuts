import Link from 'next/link'
import { WifiOff } from 'lucide-react'
export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="site-container flex min-h-screen flex-col items-center justify-center text-center"
    >
      <span className="journey-icon mb-6">
        <WifiOff size={24} />
      </span>
      <p className="eyebrow">Connection interrupted</p>
      <h1 className="mt-3 text-3xl font-semibold">
        We’ll be here when you’re back.
      </h1>
      <p className="mt-4 max-w-md leading-7 text-[#52635B]">
        Reconnect to view community reports. Private account pages are not
        stored for offline browsing. Keep any open report tab available; saved
        reports can be retried there while signed in.
      </p>
      <Link href="/dashboard" className="button button-primary mt-7">
        Try connecting again
      </Link>
    </main>
  )
}
