import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import Sidebar from '@/components/layout/Sidebar'
import { OfflineProvider } from '@/components/OfflineProvider'
import OfflineBanner from '@/components/OfflineBanner'

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
    id:          raw.id          as string,
    full_name:   raw.full_name   as string,
    lga_id:      raw.lga_id      as number | null,
    is_diaspora: raw.is_diaspora as boolean,
    lga: (Array.isArray(raw.lga) ? raw.lga[0] ?? null : raw.lga) as {
      id: number; name: string; state: { name: string } | null
    } | null,
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const unreadNotifications = unreadCount ?? 0

  return (
    <OfflineProvider
      userId={user.id}
      lgaId={profile.lga_id}
      isDisaspora={profile.is_diaspora}
    >
      <div className="min-h-screen bg-[#F8F9FA] flex">
        <Sidebar profile={profile} unreadNotifications={unreadNotifications} />

        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader profile={profile} unreadNotifications={unreadNotifications} />
          <OfflineBanner />
          <main className="flex-1 pb-20 md:pb-0 flex flex-col min-w-0 overflow-x-hidden">
            {children}
          </main>
          <BottomNav />
          <footer className="hidden md:block border-t border-[#E2E8F0] bg-white py-3 px-6 text-center text-xs text-[#94A3B8]">
            © {new Date().getFullYear()} Grassruts · A{' '}
            <span className="font-semibold text-[#475569]">join2getherwork</span>{' '}
            product · The Root of Change
          </footer>
        </div>
      </div>
    </OfflineProvider>
  )
}
