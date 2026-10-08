import { createHash } from 'node:crypto'
import { createAdminClient } from './supabase/admin'
interface Options {
  key: string
  limit: number
  windowMs: number
}
interface Result {
  success: boolean
  remaining: number
  resetAt: number
}
const local = new Map<string, { count: number; resetAt: number }>()
export async function rateLimit({
  key,
  limit,
  windowMs,
}: Options): Promise<Result> {
  const hash = createHash('sha256').update(key).digest('hex')
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data, error } = await createAdminClient().rpc(
        'consume_request_limit',
        { p_key: hash, p_limit: limit, p_window_ms: windowMs },
      )
      if (!error && data?.[0])
        return {
          success: data[0].allowed,
          remaining: data[0].remaining,
          resetAt: Date.parse(data[0].reset_at),
        }
    } catch {}
  }
  // Development can preview authentication before the migration is applied.
  // Production fails closed if its shared limiter is unavailable.
  const now = Date.now()
  if (process.env.NODE_ENV === 'production')
    return { success: false, remaining: 0, resetAt: now + 60000 }
  for (const [k, v] of local) if (v.resetAt <= now) local.delete(k)
  if (local.size >= 10000)
    return { success: false, remaining: 0, resetAt: now + 60000 }
  const item = local.get(hash) ?? { count: 0, resetAt: now + windowMs }
  item.count++
  local.set(hash, item)
  return {
    success: item.count <= limit,
    remaining: Math.max(0, limit - item.count),
    resetAt: item.resetAt,
  }
}
export function getClientIp(request: Request): string {
  // Vercel owns this header. Other hosts must configure a trusted proxy header;
  // never trust arbitrary x-forwarded-for input as an abuse-control identity.
  if (process.env.VERCEL === '1')
    return (
      request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
      'unknown'
    )
  return 'shared'
}
