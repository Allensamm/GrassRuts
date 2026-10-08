// Typed, encrypted IndexedDB wrapper.
//
// Stores:
//   issues_cache  — encrypted issue records (compressed + AES-GCM)
//   profile_cache — encrypted user profile
//   sync_meta     — unencrypted sync timestamps (not sensitive)
//   outbox        — account-scoped encrypted drafts; never read by the service worker

import { seal, unseal } from './crypto'

const DB_NAME = 'gr_offline'
const DB_VERSION = 2

const STORE = {
  ISSUES: 'issues_cache',
  PROFILE: 'profile_cache',
  META: 'sync_meta',
  OUTBOX: 'outbox',
  DRAFTS: 'report_drafts',
} as const

// ── Open ─────────────────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      // Legacy stores have no reliable account boundary. Remove them on upgrade.
      if (e.oldVersion > 0 && e.oldVersion < 2)
        for (const name of Array.from(db.objectStoreNames))
          db.deleteObjectStore(name)
      if (!db.objectStoreNames.contains(STORE.DRAFTS))
        db.createObjectStore(STORE.DRAFTS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORE.ISSUES)) {
        db.createObjectStore(STORE.ISSUES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE.PROFILE)) {
        db.createObjectStore(STORE.PROFILE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE.META)) {
        db.createObjectStore(STORE.META, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(STORE.OUTBOX)) {
        const s = db.createObjectStore(STORE.OUTBOX, { keyPath: 'id' })
        s.createIndex('created_at', 'created_at')
      }
    }
    req.onsuccess = () => {
      _db = req.result
      resolve(req.result)
    }
    req.onerror = () => reject(req.error)
  })
}

// ── Raw IDB helpers ───────────────────────────────────────────────────────────

async function get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function put(store: string, value: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function getAll<T>(store: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function del(store: string, key: IDBValidKey): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(store, 'readwrite')
      .objectStore(store)
      .delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function count(store: string): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ── Encrypted store helpers ───────────────────────────────────────────────────
// Stored shape: { id: unknown, _enc: { iv, ct } }

type Sealed = { id: unknown; _enc: { iv: string; ct: string } }

async function encGet<T extends { id: unknown }>(
  store: string,
  key: IDBValidKey,
): Promise<T | null> {
  const row = await get<Sealed>(store, key)
  if (!row) return null
  return unseal<T>(row._enc)
}

async function encPut<T extends { id: unknown }>(
  store: string,
  data: T,
): Promise<void> {
  const _enc = await seal(data)
  await put(store, { id: data.id, _enc })
}

async function encGetAll<T extends { id: unknown }>(
  store: string,
): Promise<T[]> {
  const rows = await getAll<Sealed>(store)
  return Promise.all(rows.map((r) => unseal<T>(r._enc)))
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface CachedIssue {
  id: string
  title: string
  status: string
  report_count: number
  threshold: number
  community: string | null
  address: string | null
  created_at: string
  updated_at: string
  lga_id: number
  category: { name: string; icon: string; slug: string } | null
  lga: { name: string } | null
}

export interface CachedProfile {
  id: string
  full_name: string
  lga_id: number | null
  is_diaspora: boolean
  lga: { id: number; name: string; state: { name: string } | null } | null
}

export interface OutboxItem {
  id: string
  user_id: string
  last_error?: string
  type: 'create_issue' | 'add_report' | 'toggle_watchlist'
  payload: unknown
  created_at: string
  attempts: number
  last_attempted_at: string | null
}

// ── Public API ────────────────────────────────────────────────────────────────

export const issueCache = {
  put: (issue: CachedIssue) => encPut(STORE.ISSUES, issue),
  putMany: (issues: CachedIssue[]) =>
    Promise.all(issues.map((i) => encPut(STORE.ISSUES, i))).then(
      () => undefined,
    ),
  get: (id: string) => encGet<CachedIssue>(STORE.ISSUES, id),
  getAll: () => encGetAll<CachedIssue>(STORE.ISSUES),
}

export const profileCache = {
  put: (p: CachedProfile) => encPut(STORE.PROFILE, p),
  get: (id: string) => encGet<CachedProfile>(STORE.PROFILE, id),
}

export const syncMeta = {
  async getLastSynced(key: string): Promise<string | null> {
    const row = await get<{ key: string; last_synced_at: string }>(
      STORE.META,
      key,
    )
    return row?.last_synced_at ?? null
  },
  setLastSynced: (key: string, ts: string) =>
    put(STORE.META, { key, last_synced_at: ts }),
}

export const outboxStore = {
  async enqueue(
    item: Omit<OutboxItem, 'attempts' | 'last_attempted_at'>,
  ): Promise<void> {
    await put(STORE.OUTBOX, { ...item, attempts: 0, last_attempted_at: null })
  },
  getAll: () => getAll<OutboxItem>(STORE.OUTBOX),
  remove: (id: string) => del(STORE.OUTBOX, id),
  count: () => count(STORE.OUTBOX),
  async updateAttempt(id: string): Promise<void> {
    const item = await get<OutboxItem>(STORE.OUTBOX, id)
    if (!item) return
    await put(STORE.OUTBOX, {
      ...item,
      attempts: item.attempts + 1,
      last_attempted_at: new Date().toISOString(),
    })
  },
}

export async function clearOfflineData(): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(Object.values(STORE), 'readwrite')
    for (const name of Object.values(STORE)) tx.objectStore(name).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const draftStore = {
  save: (id: string, form: unknown) => encPut(STORE.DRAFTS, { id, form }),
  load: (id: string) => encGet<{ id: string; form: unknown }>(STORE.DRAFTS, id),
  remove: (id: string) => del(STORE.DRAFTS, id),
}
