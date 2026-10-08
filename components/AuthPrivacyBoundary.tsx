'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clearPrivateDeviceData } from '@/lib/offline/privacy'
export default function AuthPrivacyBoundary() {
  useEffect(() => {
    const client = createClient()
    let previous: string | null | undefined
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      const next = session?.user.id ?? null
      if (event === 'SIGNED_OUT' || (previous && next !== previous))
        void clearPrivateDeviceData()
      previous = next
    })
    return () => subscription.unsubscribe()
  }, [])
  return null
}
