import { rateLimit, getClientIp } from './rate-limit'
import { createHash } from 'crypto'
import { createAdminClient } from './supabase/admin'

export interface GovApiKey {
  id: string
  entity_name: string
  department: string | null
  lga_id: number | null
  state_id: number | null
  permissions: string[]
}

/**
 * Hash an API key the same way the migration does.
 * SHA-256 of the raw key bytes, hex-encoded — no salt needed because
 * API keys are long random strings (high entropy), unlike passwords.
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

export async function verifyGovApiKey(
  request: Request,
): Promise<GovApiKey | null> {
  const limit = await rateLimit({
    key: `gov:api:${getClientIp(request)}`,
    limit: 120,
    windowMs: 60000,
  })
  if (!limit.success) return null
  const authHeader = request.headers.get('Authorization')
  const apiKeyHeader = request.headers.get('X-API-Key')

  const rawKey = apiKeyHeader ?? authHeader?.replace('Bearer ', '')
  if (!rawKey?.trim()) return null

  // Compare hashes, never the plaintext key
  const keyHash = hashApiKey(rawKey.trim())

  const admin = createAdminClient()
  const { data } = await admin
    .from('gov_api_keys')
    .select('id, entity_name, department, lga_id, state_id, permissions')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  return data ?? null
}

export function hasPermission(
  apiKey: GovApiKey | null,
  permission: 'read' | 'write',
): boolean {
  return apiKey?.permissions?.includes(permission) ?? false
}

export async function getJurisdictionIssue(
  id: string,
  scope: { lga_id: number | null; state_id: number | null },
) {
  const admin = createAdminClient()
  const { data: issue } = await admin
    .from('issues')
    .select('id,status,title,lga_id')
    .eq('id', id)
    .maybeSingle()
  if (!issue) return null
  const { data: lga } = await admin
    .from('lgas')
    .select('state_id')
    .eq('id', issue.lga_id)
    .maybeSingle()
  const { isWithinJurisdiction } = await import('./jurisdiction')
  return isWithinJurisdiction(scope, {
    lga_id: issue.lga_id,
    state_id: lga?.state_id ?? null,
  })
    ? issue
    : null
}
