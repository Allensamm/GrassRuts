import Image from 'next/image'
import { one } from '@/lib/relations'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  cn,
  getStatusColor,
  getStatusLabel,
  formatDate,
  timeAgo,
} from '@/lib/utils'
import RealtimeReportCount from '@/components/issues/RealtimeReportCount'
import AddReportButton from '@/components/issues/AddReportButton'
import ResolutionVote from '@/components/issues/ResolutionVote'
import WatchlistButton from '@/components/issues/WatchlistButton'
import ShareButton from '@/components/issues/ShareButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function IssueDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: issue } = await supabase
    .from('issues')
    .select(
      `
      id, title, description, status, report_count, threshold, lga_id,
      community, address, created_at, escalated_at, resolved_at, verified_at,
      category:categories(name, icon, government_body),
      lga:lgas(id, name, state:states(name))
    `,
    )
    .eq('id', id)
    .single()

  if (!issue) notFound()

  const category = one(issue.category)
  const lga = one(issue.lga)
  const lgaState = Array.isArray(lga?.state) ? lga.state[0] : lga?.state

  // Check if user has reported, their resolution vote, diaspora status, and watchlist
  let userHasReported = false
  let userVote: boolean | null = null
  let isDisaspora = false
  let isWatching = false
  if (user) {
    const [
      { data: report },
      { data: confirmation },
      { data: profile },
      { data: watchEntry },
    ] = await Promise.all([
      supabase
        .from('reports')
        .select('id')
        .eq('issue_id', id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('resolution_confirmations')
        .select('is_resolved')
        .eq('issue_id', id)
        .eq('user_id', user.id)
        .single(),
      supabase.from('users').select('is_diaspora').eq('id', user.id).single(),
      supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('lga_id', issue.lga_id ?? 0)
        .maybeSingle(),
    ])
    userHasReported = !!report
    userVote = confirmation?.is_resolved ?? null
    isDisaspora = profile?.is_diaspora ?? false
    isWatching = !!watchEntry
  }

  const { data: voteCounts, error: voteError } = await supabase
    .from('public_resolution_counts')
    .select('confirmed,denied')
    .eq('issue_id', id)
    .maybeSingle()
  const confirmedCount = voteCounts?.confirmed ?? 0,
    deniedCount = voteCounts?.denied ?? 0
  const { data: evidence, error: evidenceError } = await supabase
    .from('public_issue_evidence')
    .select('url')
    .eq('issue_id', id)
    .limit(9)

  // Government updates (timeline)
  const { data: govUpdates, error: updatesError } = await supabase
    .from('issue_updates')
    .select('update_type, message, created_at, actor_name')
    .eq('issue_id', id)
    .order('created_at', { ascending: true })

  // Build timeline
  type TimelineEvent = {
    date: string
    label: string
    sublabel?: string
    icon: string
    accent?: string
  }
  const timeline: TimelineEvent[] = []
  timeline.push({
    date: issue.created_at,
    label: 'Issue reported',
    sublabel: 'Reported by a community member',
    icon: '🌱',
  })
  if (issue.escalated_at) {
    timeline.push({
      date: issue.escalated_at,
      label: 'Escalated to High Priority',
      sublabel: `${issue.threshold} reports reached`,
      icon: '🔥',
      accent: 'text-red-600',
    })
  }
  for (const u of govUpdates ?? []) {
    const typeLabel: Record<string, string> = {
      acknowledged: 'Government acknowledged',
      in_progress: 'Work in progress',
      resolved: 'Marked as resolved',
      rejected: 'Issue rejected',
    }
    timeline.push({
      date: u.created_at,
      label: typeLabel[u.update_type] ?? u.update_type,
      sublabel: [u.actor_name || 'Public authority', u.message]
        .filter(Boolean)
        .join(' · '),
      icon: '🏛️',
      accent: 'text-blue-600',
    })
  }
  if (issue.resolved_at) {
    timeline.push({
      date: issue.resolved_at,
      label: 'Marked resolved by government',
      icon: '✅',
      accent: 'text-green-600',
    })
  }
  if (issue.verified_at) {
    timeline.push({
      date: issue.verified_at,
      label: 'Community verified as resolved',
      icon: '🎉',
      accent: 'text-green-700',
    })
  }
  timeline.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const isResolved = issue.status === 'resolved' || issue.status === 'verified'

  return (
    <div className="max-w-3xl mx-auto">
      {(voteError || evidenceError || updatesError) && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Some photos, activity, or verification totals are temporarily
          unavailable. Please try again later.
        </p>
      )}
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={16} /> All community issues
      </Link>

      {/* Category + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category?.icon ?? '❓'}</span>
          <span className="text-sm text-gray-500 font-medium">
            {category?.name ?? 'Other'}
          </span>
        </div>
        <span
          className={cn(
            'text-xs font-semibold px-3 py-1 rounded-full',
            getStatusColor(issue.status),
          )}
        >
          {getStatusLabel(issue.status)}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-semibold text-[#183D2E] mb-4 leading-tight">
        {issue.title}
      </h1>

      {/* Location + date */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
        {(issue.community || lga?.name) && (
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {issue.community ? `${issue.community}, ` : ''}
            {lga?.name}
            {lgaState?.name ? `, ${lgaState.name}` : ''}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {formatDate(issue.created_at)}
        </span>
      </div>

      <div className="civic-card mb-6 grid gap-5 p-5 sm:grid-cols-2">
        <div>
          <p className="eyebrow">Relevant authority</p>
          <p className="mt-2 font-semibold">
            {category?.government_body || 'Relevant local authority'}
          </p>
          <p className="mt-1 text-xs text-[#52635B]">
            This identifies responsibility, not an acknowledgement.
          </p>
        </div>
        <div>
          <p className="eyebrow">What happens next</p>
          <p className="mt-2 text-sm leading-7 text-[#52635B]">
            {issue.status === 'verified'
              ? 'Reporters have verified this resolution.'
              : issue.status === 'resolved'
                ? 'The authority has marked this resolved. Reporters can confirm whether it is fixed.'
                : 'Residents can add evidence and support. Official responses will appear in the timeline below.'}
          </p>
        </div>
      </div>
      {/* Resolution vote (when gov marks resolved) */}
      {issue.status === 'resolved' && userHasReported && !voteError && (
        <ResolutionVote
          issueId={id}
          userVote={userVote}
          confirmedCount={confirmedCount ?? 0}
          deniedCount={deniedCount ?? 0}
          totalReporters={issue.report_count}
        />
      )}

      {/* Real-time report count */}
      <RealtimeReportCount
        issueId={id}
        initialCount={issue.report_count}
        threshold={issue.threshold}
        initialStatus={issue.status}
      />

      {/* Description */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Description
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {issue.description}
        </p>
        {issue.address && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-3">
            <MapPin size={11} /> {issue.address}
          </p>
        )}
      </div>

      {/* Evidence photos */}
      {evidence && evidence.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Photo Evidence
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {evidence.map((e, i) => (
              <a key={i} href={e.url} target="_blank" rel="noopener noreferrer">
                <Image
                  unoptimized
                  width={400}
                  height={400}
                  src={e.url}
                  alt={`Evidence ${i + 1}`}
                  className="w-full aspect-square object-cover rounded-xl"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Activity timeline */}
      {timeline.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Activity Timeline
          </h2>
          <div className="space-y-4">
            {timeline.map((event, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-base">{event.icon}</span>
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-gray-100 mt-1" />
                  )}
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      event.accent ?? 'text-gray-800',
                    )}
                  >
                    {event.label}
                  </p>
                  {event.sublabel && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.sublabel}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {timeAgo(event.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share + Watchlist row */}
      <div className="flex gap-2 mb-3">
        <ShareButton
          title={issue.title}
          reportCount={issue.report_count}
          lgaName={lga?.name ?? 'your area'}
        />
        {lga && user && (
          <WatchlistButton
            lgaId={lga.id}
            lgaName={lga.name}
            initialWatching={isWatching}
          />
        )}
      </div>

      {/* CTA */}
      <AddReportButton
        signedIn={!!user}
        issueId={id}
        userHasReported={userHasReported}
        isResolved={isResolved}
        isDisaspora={isDisaspora}
      />

      <p className="mt-5 text-center text-xs text-[#52635B]">
        Public concern. Private account details. Please keep personal
        information out of reports.
      </p>
    </div>
  )
}
