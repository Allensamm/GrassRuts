// Grassruts Service Worker v2
// Handles: shell caching, navigation fallback, background sync (outbox replay)

const CACHE      = 'grassruts-v2'
const DB_NAME    = 'gr_offline'
const DB_VERSION = 1

const PRECACHE = [
  '/',
  '/offline',
  '/login',
  '/signup',
  '/logo.svg',
  '/manifest.webmanifest',
]

// ── Lifecycle ─────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// ── Fetch strategy ────────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept non-GET, API calls, or Supabase traffic
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co')
  ) return

  // Navigation: network-first, fall back to cached shell, then /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
          return res
        })
        .catch(() =>
          caches.match(request).then(cached => cached ?? caches.match('/offline'))
        )
    )
    return
  }

  // Static assets: cache-first, network fallback + update cache
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(request, clone))
        return res
      })
    })
  )
})

// ── Background Sync ───────────────────────────────────────────────────────────

self.addEventListener('sync', event => {
  if (event.tag === 'grassruts-outbox') {
    event.waitUntil(processOutbox())
  }
})

async function processOutbox() {
  let items
  try {
    items = await getAllOutboxItems()
  } catch {
    return // IDB not ready yet — will retry on next sync
  }

  let anyFailed = false

  for (const item of items) {
    try {
      await submitItem(item)
      await deleteOutboxItem(item.id)
    } catch {
      await incrementAttempt(item)
      // Abandon after 5 failures so a bad item never blocks the queue
      if (item.attempts >= 4) await deleteOutboxItem(item.id)
      anyFailed = true
    }
  }

  // Notify all open windows that the outbox was processed
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach(c => c.postMessage({ type: 'OUTBOX_PROCESSED' }))

  // If anything failed, re-throw so the browser retries the sync event
  if (anyFailed) throw new Error('Some outbox items failed — will retry')
}

async function submitItem(item) {
  const headers = {
    'Content-Type':      'application/json',
    'X-Idempotency-Key': item.id,
  }

  if (item.type === 'create_issue') {
    const res = await fetch('/api/issues', {
      method: 'POST', headers,
      body: JSON.stringify(item.payload),
    })
    if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
  }

  if (item.type === 'add_report') {
    const { issueId, ...rest } = item.payload
    const res = await fetch(`/api/issues/${issueId}/report`, {
      method: 'POST', headers,
      body: JSON.stringify(rest),
    })
    if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
  }

  if (item.type === 'toggle_watchlist') {
    const { action, lgaId } = item.payload
    if (action === 'add') {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lga_id: lgaId }),
      })
      if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
    } else {
      const res = await fetch(`/api/watchlist/${lgaId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`)
    }
  }
}

// ── IndexedDB helpers (outbox only — no encryption needed here) ───────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('issues_cache'))  db.createObjectStore('issues_cache',  { keyPath: 'id' })
      if (!db.objectStoreNames.contains('profile_cache')) db.createObjectStore('profile_cache', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('sync_meta'))     db.createObjectStore('sync_meta',     { keyPath: 'key' })
      if (!db.objectStoreNames.contains('outbox')) {
        const s = db.createObjectStore('outbox', { keyPath: 'id' })
        s.createIndex('created_at', 'created_at')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function getAllOutboxItems() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('outbox', 'readonly').objectStore('outbox').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function deleteOutboxItem(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('outbox', 'readwrite').objectStore('outbox').delete(id)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

async function incrementAttempt(item) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const store = db.transaction('outbox', 'readwrite').objectStore('outbox')
    const getReq = store.get(item.id)
    getReq.onsuccess = () => {
      const record = getReq.result
      if (!record) { resolve(); return }
      const putReq = store.put({
        ...record,
        attempts:          (record.attempts ?? 0) + 1,
        last_attempted_at: new Date().toISOString(),
      })
      putReq.onsuccess = () => resolve()
      putReq.onerror   = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}
