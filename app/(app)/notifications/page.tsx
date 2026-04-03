import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/utils'
import { Bell, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: notifications }, { data: profile }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('users')
      .select('lga_id, lga:lgas(name)')
      .eq('id', user.id)
      .single(),
  ])

  const unreadIds = (notifications ?? []).filter(n => !n.is_read).map(n => n.id)

  // Mark all as read
  if (unreadIds.length > 0) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
  }

  // LGA stats for right panel
  const lga = Array.isArray((profile as any)?.lga) ? (profile as any).lga[0] : (profile as any)?.lga
  let lgaStats = { total: 0, pending: 0, high_priority: 0, resolved: 0, in_review: 0 }
  let highPriorityIssues: any[] = []

  if (profile?.lga_id) {
    const [{ data: statRows }, { data: hotIssues }] = await Promise.all([
      supabase
        .from('issues')
        .select('status')
        .eq('lga_id', profile.lga_id),
      supabase
        .from('issues')
        .select('id, title, report_count, threshold')
        .eq('lga_id', profile.lga_id)
        .eq('status', 'high_priority')
        .order('report_count', { ascending: false })
        .limit(3),
    ])

    for (const row of statRows ?? []) {
      lgaStats.total++
      if (row.status === 'pending') lgaStats.pending++
      else if (row.status === 'high_priority') lgaStats.high_priority++
      else if (row.status === 'resolved') lgaStats.resolved++
      else if (row.status === 'in_review') lgaStats.in_review++
    }
    highPriorityIssues = hotIssues ?? []
  }

  return (
    <div className="px-4 md:px-6 py-5">
      <div className="flex gap-8 items-start">

        {/* Notifications list */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadIds.length > 0 && (
                <p className="text-sm text-gray-400 mt-0.5">{unreadIds.length} new</p>
              )}
            </div>
          </div>

          {!notifications || notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="font-semibold text-gray-700 mb-1">No notifications yet</p>
              <p className="text-sm text-gray-400">
                You&apos;ll be notified when issues you&apos;ve reported reach the escalation threshold.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <Link
                  key={n.id}
                  href={n.issue_id ? `/issues/${n.issue_id}` : '/notifications'}
                  className={`block bg-white border rounded-2xl p-4 transition-colors hover:bg-gray-50 ${
                    !n.is_read && unreadIds.includes(n.id) ? 'border-[#008751]/30 bg-[#E8F5EE]/30' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-4 sticky top-20">
          {/* LGA stats */}
          {lga && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">{lga.name} Overview</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-gray-900">{lgaStats.total}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total issues</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-red-500">{lgaStats.high_priority}</p>
                  <p className="text-xs text-gray-400 mt-0.5">High priority</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-yellow-600">{lgaStats.pending}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pending</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-[#008751]">{lgaStats.resolved}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Resolved</p>
                </div>
              </div>
            </div>
          )}

          {/* High priority issues */}
          {highPriorityIssues.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-red-500" />
                <h3 className="text-sm font-semibold text-gray-900">Urgent in your area</h3>
              </div>
              <div className="space-y-3">
                {highPriorityIssues.map(issue => (
                  <Link key={issue.id} href={`/issues/${issue.id}`} className="block group">
                    <p className="text-xs font-medium text-gray-800 group-hover:text-[#008751] transition-colors leading-snug line-clamp-2">{issue.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((issue.report_count / issue.threshold) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{issue.report_count}/{issue.threshold}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Notification types legend */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Notification types</h3>
            <ul className="space-y-2.5">
              {[
                { icon: TrendingUp, color: 'text-red-500', label: 'High Priority', desc: 'Your issue hit 50 reports' },
                { icon: AlertCircle, color: 'text-blue-500', label: 'In Review', desc: 'Government acknowledged it' },
                { icon: CheckCircle2, color: 'text-[#008751]', label: 'Resolved', desc: 'Issue marked as resolved' },
                { icon: Clock, color: 'text-gray-400', label: 'Updates', desc: 'New activity on your reports' },
              ].map(({ icon: Icon, color, label, desc }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon size={14} className={`${color} mt-0.5 shrink-0`} />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

      </div>
    </div>
  )
}
