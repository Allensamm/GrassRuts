import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('users')
    .select('id, full_name, lga_id, is_diaspora, lga:lgas(id, name, state:states(name))')
    .eq('id', user.id)
    .single()

  if (!profileRaw) redirect('/signup/profile')

  const raw = profileRaw as any
  const profile = {
    id: raw.id as string,
    full_name: raw.full_name as string,
    lga_id: raw.lga_id as number | null,
    is_diaspora: raw.is_diaspora as boolean,
    lga: (Array.isArray(raw.lga) ? raw.lga[0] ?? null : raw.lga) as {
      id: number
      name: string
      state: { name: string } | null
    } | null,
  }

  // Fetch unread notification count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const unreadNotifications = unreadCount ?? 0

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <Sidebar profile={profile} unreadNotifications={unreadNotifications} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader profile={profile} unreadNotifications={unreadNotifications} />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
