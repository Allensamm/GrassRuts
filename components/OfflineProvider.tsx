'use client'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useSyncExternalStore,
} from 'react'
import { initCrypto } from '@/lib/offline/crypto'
import { processOutbox, pendingCount } from '@/lib/offline/queue'
interface OfflineCtx {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  sync: () => Promise<void>
}
const Context = createContext<OfflineCtx>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  sync: async () => {},
})
export const useOffline = () => useContext(Context)
const subscribeOnline = (notify: () => void) => {
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
  return () => {
    window.removeEventListener('online', notify)
    window.removeEventListener('offline', notify)
  }
}
export function OfflineProvider({
  userId,
  children,
}: {
  userId: string
  lgaId: number | null
  isDisaspora: boolean
  children: React.ReactNode
}) {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  )
  const [isSyncing, setSyncing] = useState(false),
    [pending, setPending] = useState(0)
  const busy = useRef(false)
  const refresh = useCallback(async () => {
    try {
      setPending(await pendingCount(userId))
    } catch {}
  }, [userId])
  const sync = useCallback(async () => {
    if (busy.current || !navigator.onLine) return
    busy.current = true
    setSyncing(true)
    try {
      await initCrypto(userId)
      await processOutbox(userId)
    } catch {
    } finally {
      busy.current = false
      setSyncing(false)
      await refresh()
    }
  }, [userId, refresh])
  useEffect(() => {
    initCrypto(userId)
      .then(() => {
        refresh()
        if (navigator.onLine) sync()
      })
      .catch(() => {})
    const online = () => {
      sync()
    }
    window.addEventListener('online', online)
    window.addEventListener('grassruts-outbox-change', refresh)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('grassruts-outbox-change', refresh)
    }
  }, [userId, sync, refresh])
  return (
    <Context.Provider
      value={{ isOnline, isSyncing, pendingCount: pending, sync }}
    >
      {children}
    </Context.Provider>
  )
}
