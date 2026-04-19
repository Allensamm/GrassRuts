/**
 * Simple in-memory rate limiter using a sliding-window counter.
 *
 * IMPORTANT: This implementation is intentionally simple and works well for
 * single-instance Node.js deployments. If you scale to multiple instances or
 * serverless functions (e.g. Vercel Edge), replace this with a Redis-backed
 * solution such as @upstash/ratelimit + @upstash/redis.
 */

interface Window {
  count: number
  resetAt: number
}

// Global store — survives across requests within one Node.js process.
const store = new Map<string, Window>()

// Periodically prune expired entries so the Map doesn't grow forever.
setInterval(() => {
  const now = Date.now()
  for (const [key, win] of store) {
    if (win.resetAt < now) store.delete(key)
  }
}, 60_000)

export interface RateLimitOptions {
  /** Unique bucket identifier, e.g. `auth:signin:1.2.3.4` */
  key: string
  /** Maximum allowed requests within the window */
  limit: number
  /** Window length in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  /** Requests remaining in the current window */
  remaining: number
  /** Unix timestamp (ms) when the window resets */
  resetAt: number
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    // Start a new window
    const win: Window = { count: 1, resetAt: now + windowMs }
    store.set(key, win)
    return { success: true, remaining: limit - 1, resetAt: win.resetAt }
  }

  existing.count++

  if (existing.count > limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/**
 * Extract the best available client IP from a Next.js request.
 * Falls back to 'unknown' if no IP can be determined.
 */
export function getClientIp(request: Request): string {
  const headers = request instanceof Request ? request.headers : (request as { headers: Headers }).headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}
