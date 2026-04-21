export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">📡</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re offline</h1>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        No internet connection detected. Pages you&apos;ve visited before are still available below.
      </p>
      <a
        href="/dashboard"
        className="bg-[#008751] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors"
      >
        Go to Dashboard
      </a>
      <p className="text-xs text-gray-400 mt-4">
        Your reports will sync automatically when you&apos;re back online.
      </p>
    </div>
  )
}
