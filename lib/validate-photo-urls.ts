/**
 * Validates that every photo URL belongs to this project's Supabase storage
 * bucket, preventing users from injecting arbitrary external URLs that could
 * be used for content spoofing or SSRF-like attacks.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

/**
 * Returns true only if every URL in the array:
 *  1. Is a valid absolute HTTPS URL
 *  2. Belongs to this project's Supabase storage origin
 *  3. Points to the 'evidence' bucket
 */
export function validatePhotoUrls(urls: string[]): boolean {
  if (!SUPABASE_URL) return false

  let supabaseOrigin: string
  try {
    supabaseOrigin = new URL(SUPABASE_URL).origin
  } catch {
    return false
  }

  return urls.every(raw => {
    try {
      const u = new URL(raw)
      // Must be HTTPS and come from our Supabase project
      if (u.protocol !== 'https:') return false
      if (u.origin !== supabaseOrigin) return false
      // Must be under the storage/v1/object/public/evidence path
      if (!u.pathname.startsWith('/storage/v1/object/public/evidence/')) return false
      return true
    } catch {
      return false
    }
  })
}
