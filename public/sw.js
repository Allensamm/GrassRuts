// Cache only an explicit, account-independent offline page and public assets.
// Authenticated HTML, RSC payloads, API requests and evidence are always network-only.
const CACHE = 'grassruts-public-v3'
const PUBLIC_ASSETS = [
  '/offline',
  '/logo.svg',
  '/icon.svg',
  '/manifest.webmanifest',
]
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PUBLIC_ASSETS)),
  )
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('grassruts-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')))
    return
  }
  if (!PUBLIC_ASSETS.includes(url.pathname) || request.headers.get('RSC'))
    return
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  )
})
// Report replay runs in the signed-in page, where both the account and encryption
// key are available. A service worker must never replay another account's outbox.
