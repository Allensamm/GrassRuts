'use client'

import { WifiOff, RefreshCw, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOffline } from './OfflineProvider'

export default function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount } = useOffline()

  const offline     = !isOnline
  const syncing     = isOnline && isSyncing
  const hasPending  = isOnline && !isSyncing && pendingCount > 0

  if (!offline && !syncing && !hasPending) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-xs font-medium border-b shrink-0',
        offline    && 'bg-amber-50 text-amber-800 border-amber-200',
        syncing    && 'bg-blue-50  text-blue-800  border-blue-200',
        hasPending && 'bg-green-50 text-green-800 border-green-200'
      )}
    >
      {offline    && <WifiOff   size={13} strokeWidth={2} aria-hidden="true" />}
      {syncing    && <RefreshCw size={13} strokeWidth={2} className="animate-spin" aria-hidden="true" />}
      {hasPending && <Upload    size={13} strokeWidth={2} aria-hidden="true" />}

      {offline    && 'You\'re offline — showing cached data'}
      {syncing    && 'Syncing latest data…'}
      {hasPending && `${pendingCount} report${pendingCount !== 1 ? 's' : ''} queued — submitting when online`}
    </div>
  )
}
