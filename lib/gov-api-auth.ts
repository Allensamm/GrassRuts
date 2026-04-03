import { createAdminClient } from './supabase/admin'

export interface GovApiKey {
  id: string
  entity_name: string
  department: string | null
  lga_id: number | null
  state_id: number | null
  permissions: string[]
}

export async function verifyGovApiKey(request: Request): Promise<GovApiKey | null> {
  const authHeader = request.headers.get('Authorization')
  const apiKeyHeader = request.headers.get('X-API-Key')

  const key = apiKeyHeader ?? authHeader?.replace('Bearer ', '')
  if (!key) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('gov_api_keys')
    .select('id, entity_name, department, lga_id, state_id, permissions')
    .eq('api_key', key)
    .eq('is_active', true)
    .single()

  return data ?? null
}

export function hasPermission(apiKey: GovApiKey, permission: 'read' | 'write'): boolean {
  return apiKey.permissions.includes(permission)
}
