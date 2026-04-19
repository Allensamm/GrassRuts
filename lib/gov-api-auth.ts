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

export async function verifyGovApiKey(request: Request): Promise<GovApiKey | null> {
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

export function hasPermission(apiKey: GovApiKey, permission: 'read' | 'write'): boolean {
  return apiKey.permissions.includes(permission)
}
