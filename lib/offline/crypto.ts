// Browser-only — never runs on the server.
// Derives an AES-GCM-256 key from the user's ID + a per-device random salt.
// The key lives in memory for the session; the salt persists in localStorage.
// Each record is compress-then-encrypt before IndexedDB, decrypt-then-decompress on read.

let _key: CryptoKey | null = null

function getDeviceSalt(): Uint8Array<ArrayBuffer> {
  let hex = localStorage.getItem('gr_salt')
  if (!hex) {
    const bytes = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)))
    hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem('gr_salt', hex)
  }
  const arr = new Uint8Array(new ArrayBuffer(16))
  hex.match(/.{2}/g)!.forEach((h, i) => { arr[i] = parseInt(h, 16) })
  return arr
}

export async function initCrypto(userId: string): Promise<void> {
  if (_key) return
  const salt = getDeviceSalt()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(userId),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  _key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export function isCryptoReady(): boolean {
  return _key !== null
}

function requireKey(): CryptoKey {
  if (!_key) throw new Error('Offline crypto not initialised — call initCrypto first')
  return _key
}

// seal: JSON → compress → encrypt → base64 envelope
export async function seal(data: unknown): Promise<{ iv: string; ct: string }> {
  const key        = requireKey()
  const compressed = await compress(JSON.stringify(data))
  const iv         = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)))
  const ct         = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    compressed as unknown as BufferSource
  )
  return { iv: u8b64(iv), ct: u8b64(new Uint8Array(ct)) }
}

// unseal: base64 envelope → decrypt → decompress → JSON
export async function unseal<T>(envelope: { iv: string; ct: string }): Promise<T> {
  const key   = requireKey()
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64u8(envelope.iv) as unknown as BufferSource },
    key,
    b64u8(envelope.ct) as unknown as BufferSource
  )
  return JSON.parse(await decompress(new Uint8Array(plain))) as T
}

// ── Compression ──────────────────────────────────────────────────────────────

async function compress(str: string): Promise<ArrayBuffer> {
  const encoded = new TextEncoder().encode(str)
  if (typeof CompressionStream === 'undefined') return encoded.buffer as ArrayBuffer
  const cs = new CompressionStream('deflate-raw')
  const writer = cs.writable.getWriter()
  writer.write(encoded)
  writer.close()
  return new Response(cs.readable).arrayBuffer()
}

async function decompress(data: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined') return new TextDecoder().decode(data)
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  writer.write(data as unknown as BufferSource)
  writer.close()
  return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer())
}

// ── Base64 ────────────────────────────────────────────────────────────────────

function u8b64(b: Uint8Array): string {
  return btoa(String.fromCharCode(...b))
}

function b64u8(s: string): Uint8Array {
  return Uint8Array.from(atob(s), c => c.charCodeAt(0))
}
