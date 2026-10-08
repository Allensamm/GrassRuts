import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { isWithinJurisdiction } from '../lib/jurisdiction'
import { issueSchema, reportSchema, idempotencySchema } from '../lib/submission'
import { initCrypto, seal, unseal, resetCrypto } from '../lib/offline/crypto'

test('private drafts cannot be decrypted by another account or a new session', async () => {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
  try {
    await Promise.all([initCrypto('resident-a'), initCrypto('resident-a')])
    const draft = await seal({ description: 'Private unfinished report' })
    await initCrypto('resident-b')
    await assert.rejects(unseal(draft))
    await initCrypto('resident-a')
    assert.deepEqual(await unseal(draft), {
      description: 'Private unfinished report',
    })
    resetCrypto()
    values.clear()
    await initCrypto('resident-a')
    await assert.rejects(unseal(draft))
  } finally {
    resetCrypto()
    Reflect.deleteProperty(globalThis, 'sessionStorage')
  }
})

test('government scope cannot be widened by choosing another issue', () => {
  assert.equal(
    isWithinJurisdiction(
      { lga_id: 1, state_id: null },
      { lga_id: 2, state_id: 1 },
    ),
    false,
  )
  assert.equal(
    isWithinJurisdiction(
      { lga_id: null, state_id: 1 },
      { lga_id: 2, state_id: 2 },
    ),
    false,
  )
  assert.equal(
    isWithinJurisdiction(
      { lga_id: 1, state_id: 1 },
      { lga_id: 1, state_id: 2 },
    ),
    false,
  )
  assert.equal(
    isWithinJurisdiction(
      { lga_id: 1, state_id: 1 },
      { lga_id: 1, state_id: 1 },
    ),
    true,
  )
  assert.equal(
    isWithinJurisdiction(
      { lga_id: null, state_id: 1 },
      { lga_id: 5, state_id: null },
    ),
    false,
  )
})
test('submission boundaries reject unsafe coordinates and oversized content', () => {
  const valid = {
    category_slug: 'water',
    title: 'Water pipe broken',
    description: 'The water pipe outside the market has been leaking.',
  }
  assert.equal(issueSchema.safeParse(valid).success, true)
  assert.equal(issueSchema.safeParse({ ...valid, lat: 100 }).success, false)
  assert.equal(issueSchema.safeParse({ ...valid, lng: 181 }).success, false)
  assert.equal(
    reportSchema.safeParse({ description: 'x'.repeat(1001) }).success,
    false,
  )
  assert.equal(idempotencySchema.safeParse('arbitrary-string').success, false)
})
test('service worker never stores private navigation or React payloads', async () => {
  const handlers: Record<string, (event: unknown) => void> = {}
  let writes = 0,
    online = true
  const cachedFallback = new Response('Offline help')
  const context = {
    URL,
    self: {
      location: { origin: 'http://localhost:3000' },
      addEventListener: (type: string, fn: (event: unknown) => void) =>
        (handlers[type] = fn),
    },
    caches: {
      open: async () => ({ put: async () => writes++ }),
      match: async (path: string) =>
        path === '/offline' ? cachedFallback : undefined,
    },
    fetch: async () => {
      if (!online) throw new Error('offline')
      return new Response('Private profile', {
        headers: { 'Cache-Control': 'no-store' },
      })
    },
  }
  vm.runInNewContext(await readFile('public/sw.js', 'utf8'), context)
  let response: Promise<Response> | undefined
  const request = {
    url: 'http://localhost:3000/profile',
    method: 'GET',
    mode: 'navigate',
    headers: new Headers(),
  }
  handlers.fetch({
    request,
    respondWith: (p: Promise<Response>) => (response = p),
  })
  assert.equal(await (await response)?.text(), 'Private profile')
  assert.equal(writes, 0)
  online = false
  handlers.fetch({
    request,
    respondWith: (p: Promise<Response>) => (response = p),
  })
  assert.equal(await (await response)?.text(), 'Offline help')
  response = undefined
  handlers.fetch({
    request: {
      ...request,
      mode: 'cors',
      url: 'http://localhost:3000/dashboard?_rsc=abc',
      headers: new Headers({ RSC: '1' }),
    },
    respondWith: (p: Promise<Response>) => (response = p),
  })
  assert.equal(response, undefined)
})
