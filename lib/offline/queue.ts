// Outbox queue: persists actions to IndexedDB and replays them when online.
// Each item carries a UUID that doubles as the idempotency key — the server
// uses it to reject duplicate submissions even if the client retries.

import { outboxStore, OutboxItem } from './idb'

const MAX_ATTEMPTS = 5

// ── Enqueue ───────────────────────────────────────────────────────────────────

export async function enqueueReport(payload: {
  category_slug: string
  title:         string
  description:   string
  address?:      string
  community?:    string
  lat?:          number | null
  lng?:          number | null
  photo_urls?:   string[]
}): Promise<string> {
  const id = crypto.randomUUID()
  await outboxStore.enqueue({
    id,
    type:       'create_issue',
    payload,
    created_at: new Date().toISOString(),
  })
  await registerBackgroundSync()
  return id
}

export async function enqueueAddReport(issueId: string, payload: {
  description:  string
  photo_urls?:  string[]
}): Promise<string> {
  const id = crypto.randomUUID()
  await outboxStore.enqueue({
    id,
    type:       'add_report',
    payload:    { issueId, ...payload },
    created_at: new Date().toISOString(),
  })
  await registerBackgroundSync()
  return id
}

export async function enqueueWatchlistToggle(
  action: 'add' | 'remove',
  lgaId: number
): Promise<void> {
  const id = crypto.randomUUID()
  await outboxStore.enqueue({
    id,
    type:       'toggle_watchlist',
    payload:    { action, lgaId },
    created_at: new Date().toISOString(),
  })
  await registerBackgroundSync()
}

// ── Process ───────────────────────────────────────────────────────────────────

export async function processOutbox(): Promise<{ processed: number; failed: number }> {
  const items = await outboxStore.getAll()
  let processed = 0
  let failed    = 0

  for (const item of items) {
    try {
      await submitItem(item)
      await outboxStore.remove(item.id)
      processed++
    } catch {
      await outboxStore.updateAttempt(item.id)
      failed++
      // Give up after MAX_ATTEMPTS — prevents stuck items blocking the queue
      if (item.attempts + 1 >= MAX_ATTEMPTS) {
        await outboxStore.remove(item.id)
      }
    }
  }

  return { processed, failed }
}

export const pendingCount = () => outboxStore.count()

// ── HTTP submission ───────────────────────────────────────────────────────────

async function submitItem(item: OutboxItem): Promise<void> {
  const idempotencyHeaders = {
    'Content-Type':       'application/json',
    'X-Idempotency-Key':  item.id,
  }

  if (item.type === 'create_issue') {
    const res = await fetch('/api/issues', {
      method:  'POST',
      headers: idempotencyHeaders,
      body:    JSON.stringify(item.payload),
    })
    // 409 = already created (idempotent success), treat as success
    if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
  }

  if (item.type === 'add_report') {
    const { issueId, ...rest } = item.payload as { issueId: string }
    const res = await fetch(`/api/issues/${issueId}/report`, {
      method:  'POST',
      headers: idempotencyHeaders,
      body:    JSON.stringify(rest),
    })
    if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
  }

  if (item.type === 'toggle_watchlist') {
    const { action, lgaId } = item.payload as { action: 'add' | 'remove'; lgaId: number }
    if (action === 'add') {
      const res = await fetch('/api/watchlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lga_id: lgaId }),
      })
      if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
    } else {
      const res = await fetch(`/api/watchlist/${lgaId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`)
    }
  }
}

// ── Background Sync registration ──────────────────────────────────────────────

async function registerBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    // SyncManager is not available in all browsers (Firefox, some Safari)
    if ('sync' in reg) {
      await (reg as any).sync.register('grassruts-outbox')
    }
  } catch {
    // Graceful degradation — OfflineProvider handles retry via online event
  }
}
