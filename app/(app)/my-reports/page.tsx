import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import IssueCard from '@/components/issues/IssueCard'

export default async function MyReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all issues the user has reported
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      issue_id,
      created_at,
      issue:issues(
        id, title, description, status, report_count, threshold,
        community, address, created_at, updated_at,
        category:categories(name, icon, slug),
        lga:lgas(name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const issues = (reports ?? [])
    .map(r => (Array.isArray((r as any).issue) ? (r as any).issue[0] : (r as any).issue))
    .filter(Boolean)

  return (
    <div className="px-4 md:px-6 py-5">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Issues you&apos;ve reported or joined</p>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold text-gray-700 mb-1">No reports yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Report a community issue to see it here.
          </p>
          <Link
            href="/report"
            className="inline-block bg-[#008751] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#006B40] transition-colors"
          >
            Report an Issue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue as any} />
          ))}
        </div>
      )}
    </div>
  )
}
