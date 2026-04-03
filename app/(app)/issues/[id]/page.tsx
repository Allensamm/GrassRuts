import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cn, getStatusColor, getStatusLabel, formatDate, timeAgo } from '@/lib/utils'
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

  const { data: { user } } = await supabase.auth.getUser()

  const { data: issue } = await supabase
    .from('issues')
    .select(`
      id, title, description, status, report_count, threshold, lga_id,
      community, address, created_at, escalated_at, resolved_at, verified_at,
      category:categories(name, icon),
      lga:lgas(id, name, state:states(name)),
      creator:users!issues_created_by_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (!issue) notFound()

  const category = Array.isArray((issue as any).category) ? (issue as any).category[0] : (issue as any).category
  const lga = Array.isArray((issue as any).lga) ? (issue as any).lga[0] : (issue as any).lga
  const creator = Array.isArray((issue as any).creator) ? (issue as any).creator[0] : (issue as any).creator
  const lgaState = Array.isArray(lga?.state) ? lga.state[0] : lga?.state

  // Check if user has reported, their resolution vote, diaspora status, and watchlist
  let userHasReported = false
  let userVote: boolean | null = null
  let isDisaspora = false
  let isWatching = false
  if (user) {
    const [{ data: report }, { data: confirmation }, { data: profile }, { data: watchEntry }] = await Promise.all([
      supabase.from('reports').select('id').eq('issue_id', id).eq('user_id', user.id).single(),
      supabase.from('resolution_confirmations').select('is_resolved').eq('issue_id', id).eq('user_id', user.id).single(),
      supabase.from('users').select('is_diaspora').eq('id', user.id).single(),
      supabase.from('watchlist').select('id').eq('user_id', user.id).eq('lga_id', (issue as any).lga_id ?? 0).maybeSingle(),
    ])
    userHasReported = !!report
    userVote = confirmation?.is_resolved ?? null
    isDisaspora = profile?.is_diaspora ?? false
    isWatching = !!watchEntry
  }

  // Resolution vote counts
  const [{ count: confirmedCount }, { count: deniedCount }] = await Promise.all([
    supabase.from('resolution_confirmations').select('id', { count: 'exact', head: true }).eq('issue_id', id).eq('is_resolved', true),
    supabase.from('resolution_confirmations').select('id', { count: 'exact', head: true }).eq('issue_id', id).eq('is_resolved', false),
  ])

  // Evidence photos
  const { data: reportRows } = await supabase.from('reports').select('id').eq('issue_id', id)
  const { data: evidence } = reportRows?.length
    ? await supabase.from('evidence').select('url').in('report_id', reportRows.map(r => r.id)).limit(9)
    : { data: [] }

  // Government updates (timeline)
  const { data: govUpdates } = await supabase
    .from('issue_updates')
    .select('update_type, message, created_at, government_user:government_users(full_name, department)')
    .eq('issue_id', id)
    .order('created_at', { ascending: true })

  // Build timeline
  type TimelineEvent = { date: string; label: string; sublabel?: string; icon: string; accent?: string }
  const timeline: TimelineEvent[] = []
  timeline.push({ date: issue.created_at, label: 'Issue reported', sublabel: creator?.full_name ? `by ${creator.full_name}` : undefined, icon: '🌱' })
  if (issue.escalated_at) {
    timeline.push({ date: issue.escalated_at, label: 'Escalated to High Priority', sublabel: `${issue.threshold} reports reached`, icon: '🔥', accent: 'text-red-600' })
  }
  for (const u of govUpdates ?? []) {
    const gov = Array.isArray((u as any).government_user) ? (u as any).government_user[0] : (u as any).government_user
    const typeLabel: Record<string, string> = {
      acknowledged: 'Government acknowledged',
      in_progress: 'Work in progress',
      resolved: 'Marked as resolved',
      rejected: 'Issue rejected',
    }
    timeline.push({
      date: u.created_at,
      label: typeLabel[u.update_type] ?? u.update_type,
      sublabel: gov ? `${gov.full_name}${gov.department ? `, ${gov.department}` : ''}` : undefined,
      icon: '🏛️',
      accent: 'text-blue-600',
    })
  }
  if (issue.resolved_at) {
    timeline.push({ date: issue.resolved_at, label: 'Marked resolved by government', icon: '✅', accent: 'text-green-600' })
  }
  if (issue.verified_at) {
    timeline.push({ date: issue.verified_at, label: 'Community verified as resolved', icon: '🎉', accent: 'text-green-700' })
  }
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const isResolved = issue.status === 'resolved' || issue.status === 'verified'

  return (
    <div className="px-4 md:px-6 py-5 max-w-3xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} /> Back
      </Link>

      {/* Category + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category?.icon ?? '❓'}</span>
          <span className="text-sm text-gray-500 font-medium">{category?.name ?? 'Other'}</span>
        </div>
        <span className={cn('text-xs font-semibold px-3 py-1 rounded-full', getStatusColor(issue.status))}>
          {getStatusLabel(issue.status)}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold text-gray-900 mb-2 leading-snug">{issue.title}</h1>

      {/* Location + date */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-400">
        {(issue.community || lga?.name) && (
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {issue.community ? `${issue.community}, ` : ''}{lga?.name}{lgaState?.name ? `, ${lgaState.name}` : ''}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {formatDate(issue.created_at)}
        </span>
      </div>

      {/* Resolution vote (when gov marks resolved) */}
      {issue.status === 'resolved' && userHasReported && (
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
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{issue.description}</p>
        {issue.address && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-3">
            <MapPin size={11} /> {issue.address}
          </p>
        )}
      </div>

      {/* Evidence photos */}
      {evidence && evidence.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Photo Evidence</h2>
          <div className="grid grid-cols-3 gap-2">
            {evidence.map((e, i) => (
              <a key={i} href={e.url} target="_blank" rel="noopener noreferrer">
                <img src={e.url} alt={`Evidence ${i + 1}`} className="w-full aspect-square object-cover rounded-xl" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Activity timeline */}
      {timeline.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Activity Timeline</h2>
          <div className="space-y-4">
            {timeline.map((event, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-base">{event.icon}</span>
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', event.accent ?? 'text-gray-800')}>{event.label}</p>
                  {event.sublabel && <p className="text-xs text-gray-400 mt-0.5">{event.sublabel}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">{timeAgo(event.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share + Watchlist row */}
      <div className="flex gap-2 mb-3">
        <ShareButton title={issue.title} reportCount={issue.report_count} lgaName={lga?.name ?? 'your area'} />
        {lga && (
          <WatchlistButton lgaId={lga.id} lgaName={lga.name} initialWatching={isWatching} />
        )}
      </div>

      {/* CTA */}
      <AddReportButton
        issueId={id}
        userHasReported={userHasReported}
        isResolved={isResolved}
        isDisaspora={isDisaspora}
      />

      {creator && (
        <p className="text-center text-xs text-gray-400 mt-4">
          First reported by {creator.full_name}
        </p>
      )}
    </div>
  )
}
