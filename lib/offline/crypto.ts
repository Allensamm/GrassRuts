// Per-account random key, scoped to this browser tab's signed-in session.
// Logging out erases the key and drafts. No key is derived from a public user ID.
let _key: CryptoKey | null = null
let _owner: string | null = null
let generation = 0
let initialization: { owner: string; promise: Promise<void> } | null = null
export function getCryptoOwner(): string {
  if (!_owner || !_key) throw new Error('Please sign in before saving a draft.')
  return _owner
}
export function resetCrypto() {
  generation++
  initialization = null
  _key = null
  _owner = null
}
export async function initCrypto(userId: string): Promise<void> {
  if (_key && _owner === userId) return
  if (initialization?.owner === userId) return initialization.promise
  const current = ++generation
  _key = null
  _owner = null
  const promise = (async () => {
    const name = `gr_key_${userId}`
    let encoded = sessionStorage.getItem(name)
    if (!encoded) {
      encoded = btoa(
        String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
      )
      sessionStorage.setItem(name, encoded)
    }
    const key = await crypto.subtle.importKey(
      'raw',
      Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    )
    if (current !== generation)
      throw new Error('Your signed-in account changed. Please try again.')
    _key = key
    _owner = userId
  })()
  initialization = { owner: userId, promise }
  try {
    await promise
  } finally {
    if (current === generation) initialization = null
  }
}

export function isCryptoReady(): boolean {
  return _key !== null
}

function requireKey(): CryptoKey {
  if (!_key)
    throw new Error('Offline crypto not initialised — call initCrypto first')
  return _key
}

// seal: JSON → compress → encrypt → base64 envelope
export async function seal(data: unknown): Promise<{ iv: string; ct: string }> {
  const current = generation
  const key = requireKey()
  const compressed = await compress(JSON.stringify(data))
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)))
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    compressed as unknown as BufferSource,
  )
  if (current !== generation)
    throw new Error('Your signed-in account changed. Please try again.')
  return { iv: u8b64(iv), ct: u8b64(new Uint8Array(ct)) }
}

// unseal: base64 envelope → decrypt → decompress → JSON
export async function unseal<T>(envelope: {
  iv: string
  ct: string
}): Promise<T> {
  const key = requireKey()
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64u8(envelope.iv) as unknown as BufferSource },
    key,
    b64u8(envelope.ct) as unknown as BufferSource,
  )
  return JSON.parse(await decompress(new Uint8Array(plain))) as T
}

// ── Compression ──────────────────────────────────────────────────────────────

async function compress(str: string): Promise<ArrayBuffer> {
  const encoded = new TextEncoder().encode(str)
  if (typeof CompressionStream === 'undefined')
    return encoded.buffer as ArrayBuffer
  const cs = new CompressionStream('deflate-raw')
  const writer = cs.writable.getWriter()
  writer.write(encoded)
  writer.close()
  return new Response(cs.readable).arrayBuffer()
}

async function decompress(data: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined')
    return new TextDecoder().decode(data)
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
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}
