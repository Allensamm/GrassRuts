import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, Users, Flag, CheckCircle, XCircle } from 'lucide-react'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const [{ data: flagged }, { data: stats }] = await Promise.all([
    supabase
      .from('issues')
      .select('id, title, status, report_count, flagged_reason, created_at, lgas(name)')
      .eq('status', 'in_review')
      .not('flagged_reason', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('issues').select('status'),
  ])

  const counts = {
    total: stats?.length ?? 0,
    high: stats?.filter(i => i.status === 'high_priority').length ?? 0,
    resolved: stats?.filter(i => i.status === 'resolved').length ?? 0,
    flagged: flagged?.length ?? 0,
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <ShieldAlert size={20} className="text-[#D4AF37]" />
          <h1 className="font-bold">Grassruts Admin</h1>
          <span className="ml-auto text-xs text-gray-500">{user.email}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Issues', value: counts.total, color: 'text-white' },
            { label: 'High Priority', value: counts.high, color: 'text-red-400' },
            { label: 'Resolved', value: counts.resolved, color: 'text-green-400' },
            { label: 'Flagged', value: counts.flagged, color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Flagged Issues */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
            <Flag size={16} className="text-yellow-400" />
            <h2 className="font-semibold">Flagged Issues — Suspicious Voting</h2>
          </div>

          {!flagged?.length ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p>No flagged issues</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {flagged.map(issue => (
                <div key={issue.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{issue.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(issue.lgas as unknown as {name: string})?.name} · {issue.report_count} reports · {issue.flagged_reason}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={`/api/admin/issues/${issue.id}/approve`} method="POST">
                      <button className="flex items-center gap-1 text-xs bg-green-900/40 text-green-400 border border-green-800 px-3 py-1.5 rounded-lg hover:bg-green-900/60 transition-colors">
                        <CheckCircle size={12} /> Approve
                      </button>
                    </form>
                    <form action={`/api/admin/issues/${issue.id}/reject`} method="POST">
                      <button className="flex items-center gap-1 text-xs bg-red-900/40 text-red-400 border border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-900/60 transition-colors">
                        <XCircle size={12} /> Remove
                      </button>
                    </form>
                    <Link href={`/issues/${issue.id}`} className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg hover:border-gray-500 transition-colors">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
