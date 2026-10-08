// Outbox queue: persists actions to IndexedDB and replays them when online.
// Each item carries a UUID that doubles as the idempotency key — the server
// uses it to reject duplicate submissions even if the client retries.

import { outboxStore, OutboxItem } from './idb'
import { seal, unseal, getCryptoOwner } from './crypto'
import { createClient } from '@/lib/supabase/client'

// ── Enqueue ───────────────────────────────────────────────────────────────────

export async function enqueueReport(payload: {
  category_slug: string
  title: string
  description: string
  address?: string
  community?: string
  lat?: number | null
  lng?: number | null
  photo_urls?: string[]
}): Promise<string> {
  const id = crypto.randomUUID()
  await outboxStore.enqueue({
    id,
    user_id: getCryptoOwner(),
    type: 'create_issue',
    payload: await seal(payload),
    created_at: new Date().toISOString(),
  })
  window.dispatchEvent(new Event('grassruts-outbox-change'))
  return id
}

export async function enqueueAddReport(
  issueId: string,
  payload: {
    description: string
    photo_urls?: string[]
  },
): Promise<string> {
  const id = crypto.randomUUID()
  await outboxStore.enqueue({
    id,
    user_id: getCryptoOwner(),
    type: 'add_report',
    payload: await seal({ issueId, ...payload }),
    created_at: new Date().toISOString(),
  })
  window.dispatchEvent(new Event('grassruts-outbox-change'))
  return id
}

export async function enqueueWatchlistToggle(
  action: 'add' | 'remove',
  lgaId: number,
): Promise<void> {
  const id = crypto.randomUUID()
  await outboxStore.enqueue({
    id,
    user_id: getCryptoOwner(),
    type: 'toggle_watchlist',
    payload: await seal({ action, lgaId }),
    created_at: new Date().toISOString(),
  })
  window.dispatchEvent(new Event('grassruts-outbox-change'))
}

// ── Process ───────────────────────────────────────────────────────────────────

export async function processOutbox(
  userId: string,
): Promise<{ processed: number; failed: number }> {
  const items = (await outboxStore.getAll()).filter(
    (item) => item.user_id === userId,
  )
  const supabase = createClient()
  let processed = 0
  let failed = 0

  for (const item of items) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || user.id !== userId) break
      await submitItem({
        ...item,
        payload: await unseal(item.payload as { iv: string; ct: string }),
      })
      await outboxStore.remove(item.id)
      processed++
    } catch {
      await outboxStore.updateAttempt(item.id)
      failed++
      // Retain failures for an explicit retry; never silently discard a citizen's report.
    }
  }

  return { processed, failed }
}

export const pendingCount = async (userId: string) =>
  (await outboxStore.getAll()).filter((item) => item.user_id === userId).length

// ── HTTP submission ───────────────────────────────────────────────────────────

async function submitItem(item: OutboxItem): Promise<void> {
  const idempotencyHeaders = {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': item.id,
    'X-Outbox-Owner': item.user_id,
  }

  if (item.type === 'create_issue') {
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: idempotencyHeaders,
      body: JSON.stringify(item.payload),
    })
    // 409 = already created (idempotent success), treat as success
    if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
  }

  if (item.type === 'add_report') {
    const { issueId, ...rest } = item.payload as { issueId: string }
    const res = await fetch(`/api/issues/${issueId}/report`, {
      method: 'POST',
      headers: idempotencyHeaders,
      body: JSON.stringify(rest),
    })
    if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
  }

  if (item.type === 'toggle_watchlist') {
    const { action, lgaId } = item.payload as {
      action: 'add' | 'remove'
      lgaId: number
    }
    if (action === 'add') {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Outbox-Owner': item.user_id,
        },
        body: JSON.stringify({ lga_id: lgaId }),
      })
      if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
    } else {
      const res = await fetch(`/api/watchlist/${lgaId}`, {
        method: 'DELETE',
        headers: { 'X-Outbox-Owner': item.user_id },
      })
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`)
    }
  }
}
