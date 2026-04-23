import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, Users, MapPin } from 'lucide-react'
import GovResponseForm from './GovResponseForm'

export default async function GovernmentIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/government')

  const { data: govUser } = await supabase
    .from('government_users')
    .select('id, full_name, department, lga_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!govUser) redirect('/government')

  const { data: issue } = await supabase
    .from('issues')
    .select(`
      id, title, description, status, report_count, threshold, created_at, address, community,
      categories(name, icon),
      lgas(name, states(name)),
      issue_updates(id, update_type, message, created_at, government_users(full_name, department))
    `)
    .eq('id', id)
    .single()

  if (!issue) notFound()

  return (
    <div className="min-h-screen bg-[#f0f4f0]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Shield size={18} className="text-[#008751]" />
          <h1 className="font-bold text-gray-900">Grassruts Government Portal</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/government/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        {/* Issue Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{(issue.categories as unknown as {icon: string})?.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase">{(issue.categories as unknown as {name: string})?.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  issue.status === 'high_priority' ? 'bg-red-100 text-red-700' :
                  issue.status === 'in_review' ? 'bg-blue-100 text-blue-700' :
                  issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {issue.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{issue.title}</h1>
              <p className="text-gray-600 text-sm leading-relaxed">{issue.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={14} />
              <span><strong className="text-gray-900">{issue.report_count}</strong> / {issue.threshold} reports</span>
            </div>
            {issue.community && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={14} />
                <span>{issue.community}, {(issue.lgas as unknown as {name: string})?.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Previous Updates */}
        {Array.isArray(issue.issue_updates) && issue.issue_updates.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Response History</h2>
            <div className="space-y-4">
              {(issue.issue_updates as unknown as {id: string, update_type: string, message: string, created_at: string, government_users: {full_name: string, department: string}}[]).map(update => (
                <div key={update.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#008751] mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{update.update_type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{update.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {update.government_users?.full_name} · {new Date(update.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Response Form */}
        <GovResponseForm issueId={id} govUserId={govUser.id} currentStatus={issue.status} />
      </main>
    </div>
  )
}
