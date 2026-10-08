import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Service role client — only use in server-side API routes, never expose to client
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error('Server database access is not configured')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
