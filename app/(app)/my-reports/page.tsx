import { one } from '@/lib/relations'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import IssueCard from '@/components/issues/IssueCard'

export default async function MyReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all issues the user has reported
  const { data: reports } = await supabase
    .from('reports')
    .select(
      `
      issue_id,
      created_at,
      issue:issues(
        id, title, description, status, report_count, threshold,
        community, address, created_at, updated_at,
        category:categories(name, icon, slug),
        lga:lgas(name)
      )
    `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const issues = (reports ?? []).flatMap((r) => {
    const issue = one(r.issue)
    return issue
      ? [{ ...issue, category: one(issue.category), lga: one(issue.lga) }]
      : []
  })

  return (
    <div className="app-content">
      <div className="mb-5">
        <p className="eyebrow">Grassruts / my reports</p>
        <h1 className="text-3xl font-semibold text-[#183D2E] mt-2">
          Your voice, on the record.
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Issues you&apos;ve reported or joined
        </p>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold text-gray-700 mb-1">No reports yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Report a community issue to see it here.
          </p>
          <Link
            href="/report"
            className="inline-block bg-[#177353] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#11573F] transition-colors"
          >
            Report an Issue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}
