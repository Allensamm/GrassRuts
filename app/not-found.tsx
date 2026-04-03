import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">🌿</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 text-sm mb-6">This page doesn&apos;t exist or has been moved.</p>
      <Link
        href="/dashboard"
        className="bg-[#008751] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#006B40] transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
