'use client'

import {
  createContext, useContext, useEffect,
  useState, useCallback, useRef,
} from 'react'
import { initCrypto, isCryptoReady } from '@/lib/offline/crypto'
import { syncIssues, syncProfile, syncWatchlistLgaIds } from '@/lib/offline/sync'
import { processOutbox, pendingCount } from '@/lib/offline/queue'

// ── Context ───────────────────────────────────────────────────────────────────

interface OfflineCtx {
  isOnline:     boolean
  isSyncing:    boolean
  pendingCount: number
  sync:         () => Promise<void>
}

const OfflineContext = createContext<OfflineCtx>({
  isOnline:     true,
  isSyncing:    false,
  pendingCount: 0,
  sync:         async () => {},
})

export function useOffline(): OfflineCtx {
  return useContext(OfflineContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface Props {
  userId:      string
  lgaId:       number | null
  isDisaspora: boolean
  children:    React.ReactNode
}

export function OfflineProvider({ userId, lgaId, isDisaspora, children }: Props) {
  const [isOnline,      setIsOnline]      = useState(true)
  const [isSyncing,     setIsSyncing]     = useState(false)
  const [pending,       setPending]       = useState(0)
  const [ready,         setReady]         = useState(false)
  const syncingRef = useRef(false)

  // Avoid SSR hydration mismatch — read navigator.onLine on client only
  useEffect(() => { setIsOnline(navigator.onLine) }, [])

  // Initialise crypto + IndexedDB then run first sync
  useEffect(() => {
    let alive = true
    async function boot() {
      try {
        await initCrypto(userId)
        if (!alive) return
        setReady(true)
        if (navigator.onLine) triggerSync()
      } catch (e) {
        // Private browsing or old browser — degrade to network-only
        console.warn('[Grassruts] Offline storage unavailable:', e)
      }
    }
    boot()
    return () => { alive = false }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const triggerSync = useCallback(async () => {
    if (syncingRef.current || !isCryptoReady()) return
    syncingRef.current = true
    setIsSyncing(true)
    try {
      const lgaIds = isDisaspora
        ? await syncWatchlistLgaIds(userId)
        : lgaId ? [lgaId] : []

      await Promise.all([
        syncIssues(lgaIds),
        syncProfile(userId),
        processOutbox(),
      ])
    } catch (e) {
      console.warn('[Grassruts] Sync failed:', e)
    } finally {
      syncingRef.current = false
      setIsSyncing(false)
      refreshPending()
    }
  }, [userId, lgaId, isDisaspora])

  const refreshPending = useCallback(async () => {
    try { setPending(await pendingCount()) } catch {}
  }, [])

  // Online / offline events
  useEffect(() => {
    const goOnline  = () => { setIsOnline(true);  if (ready) triggerSync() }
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [ready, triggerSync])

  // Poll pending count every 30 s so the banner stays accurate
  useEffect(() => {
    if (!ready) return
    refreshPending()
    const id = setInterval(refreshPending, 30_000)
    return () => clearInterval(id)
  }, [ready, refreshPending])

  // Listen for the service worker's "outbox processed" message
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'OUTBOX_PROCESSED') {
        refreshPending()
        if (ready) triggerSync()
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [ready, triggerSync, refreshPending])

  return (
    <OfflineContext.Provider value={{
      isOnline,
      isSyncing,
      pendingCount: pending,
      sync:         triggerSync,
    }}>
      {children}
    </OfflineContext.Provider>
  )
}
