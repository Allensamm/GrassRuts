import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, LogOut, AlertTriangle, Clock, CheckCircle, Eye } from 'lucide-react'

export default async function GovernmentDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/government')

  const { data: govUser } = await supabase
    .from('government_users')
    .select('full_name, role, department, lga_id, state_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!govUser) redirect('/government')

  // Fetch high priority issues for this official's jurisdiction
  const query = supabase
    .from('issues')
    .select(`
      id, title, status, report_count, threshold, created_at, flagged_reason,
      categories(name, icon),
      lgas(name, states(name))
    `)
    .in('status', ['high_priority', 'in_review'])
    .order('report_count', { ascending: false })
    .limit(50)

  if (govUser.lga_id) query.eq('lga_id', govUser.lga_id)

  const { data: issues } = await query

  const counts = {
    high: issues?.filter(i => i.status === 'high_priority').length ?? 0,
    review: issues?.filter(i => i.status === 'in_review').length ?? 0,
  }

  return (
    <div className="min-h-screen bg-[#f0f4f0]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-[#008751]" />
            <div>
              <h1 className="font-bold text-gray-900">Grassruts Government Portal</h1>
              <p className="text-xs text-gray-500">{govUser.full_name} · {govUser.department}</p>
            </div>
          </div>
          <form action="/api/government/auth/signout" method="POST">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors">
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle size={20} className="text-red-500" />
              <span className="text-sm font-medium text-gray-600">High Priority</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{counts.high}</p>
            <p className="text-xs text-gray-400 mt-1">Requires immediate action</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Under Review</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{counts.review}</p>
            <p className="text-xs text-gray-400 mt-1">Flagged for verification</p>
          </div>
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Escalated Issues</h2>
            <p className="text-xs text-gray-400 mt-0.5">Issues with 50+ community reports requiring your attention</p>
          </div>

          {!issues?.length ? (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No escalated issues</p>
              <p className="text-sm mt-1">Your jurisdiction is clear</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {issues.map(issue => (
                <Link
                  key={issue.id}
                  href={`/government/issues/${issue.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">{(issue.categories as unknown as {icon: string})?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{issue.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(issue.lgas as unknown as {name: string})?.name} · {issue.report_count} reports
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      issue.status === 'high_priority'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {issue.status === 'high_priority' ? 'HIGH PRIORITY' : 'IN REVIEW'}
                    </span>
                    <Eye size={16} className="text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
