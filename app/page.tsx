import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Users,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Waves,
  Route,
  Lightbulb,
  GraduationCap,
  Sprout,
} from 'lucide-react'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/Badge'

const JOURNEY = [
  {
    Icon: MapPin,
    title: 'Put the problem on the map',
    text: 'Describe what’s happening in your area.',
    number: '01',
  },
  {
    Icon: Users,
    title: 'Bring your neighbours together',
    text: 'Add evidence and support an existing report.',
    number: '02',
  },
  {
    Icon: CheckCircle2,
    title: 'Follow the response',
    text: 'Track updates. Help confirm when it’s fixed.',
    number: '03',
  },
]
const STEPS = [
  {
    number: '01',
    title: 'Report what matters',
    text: 'Choose a category, describe the issue, and add a location. Photos are helpful, but always optional.',
    Icon: FileText,
  },
  {
    number: '02',
    title: 'Build a shared picture',
    text: 'Neighbours can add their own report. At the reporting threshold, an issue is highlighted as high priority.',
    Icon: Users,
  },
  {
    number: '03',
    title: 'Keep the record open',
    text: 'Follow official updates and help verify a resolution. A priority label is not a guarantee of government action.',
    Icon: CheckCircle2,
  },
]

export default async function Home() {
  const supabase = await createClient()
  const [{ data: issues, error }, total, verified] = await Promise.all([
    supabase
      .from('issues')
      .select('id, title, status, community, report_count, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('issues').select('id', { count: 'exact', head: true }),
    supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'verified'),
  ])
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <section className="home-hero">
          <div className="site-container grid items-center gap-12 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
            <div>
              <p className="eyebrow mb-6 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#177353]" /> A voice
                for every community
              </p>
              <h1>
                Small actions.
                <br />
                <span className="text-[#177353]">Better places</span>
                <br />
                to call home.
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-8 text-[#52635B]">
                That broken road. The water that never comes. The streetlight
                that went out. Make it visible, bring your neighbours together,
                and follow what happens next.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/report" className="button button-primary">
                  Report a community issue <ArrowUpRight size={18} />
                </Link>
                <Link href="/explore" className="button button-secondary">
                  See what’s happening <ArrowRight size={17} />
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-[#52635B]">
                <ShieldCheck size={16} /> Free to use. Independent. Community
                led.
              </p>
            </div>
            <div className="journey-illustration">
              <div className="journey-top">
                <span className="eyebrow text-green-100/80">
                  From a concern to a shared record
                </span>
                <Sprout size={28} className="text-[#DAE8A0]" />
              </div>
              <h2 className="mb-7 text-3xl font-semibold text-white">
                Your voice starts
                <br />
                something bigger.
              </h2>
              <div className="journey-sheet">
                {JOURNEY.map(({ Icon, title, text, number }) => (
                  <div key={number} className="journey-step">
                    <span className="journey-icon">
                      <Icon size={21} />
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#193D2F]">{title}</h3>
                      <p className="mt-1 text-sm text-[#52635B]">{text}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#66786D]">
                      {number}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-green-100/80">
                <span>THE ROOT OF CHANGE</span>
                <span>Built for Nigeria ↗</span>
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-[#DDE5DC] bg-white">
          <div className="site-container grid grid-cols-2 gap-6 py-7 md:grid-cols-4">
            <div>
              <p className="metric-value">
                {total.error ? '—' : (total.count?.toLocaleString() ?? '0')}
              </p>
              <p className="metric-label">Community issues reported</p>
            </div>
            <div>
              <p className="metric-value">
                {verified.error
                  ? '—'
                  : (verified.count?.toLocaleString() ?? '0')}
              </p>
              <p className="metric-label">Resolutions verified by residents</p>
            </div>
            <div>
              <p className="metric-value">One place</p>
              <p className="metric-label">
                To follow your community’s concerns
              </p>
            </div>
            <div>
              <p className="metric-value">Your voice</p>
              <p className="metric-label">At the centre of every report</p>
            </div>
          </div>
        </section>
        <section className="site-container section-space">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Around our communities</p>
              <h2>
                Every issue has a place.
                <br />
                Every place has people.
              </h2>
            </div>
            <Link href="/explore" className="text-link">
              Explore all issues <ArrowRight size={17} />
            </Link>
          </div>
          {error ? (
            <div className="empty-state">
              <p>Community reports are temporarily unavailable.</p>
              <Link href="/explore" className="text-link mt-3">
                Try exploring again <ArrowRight size={16} />
              </Link>
            </div>
          ) : issues?.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {issues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.id}`}
                  className="civic-card flex flex-col p-6 transition hover:-translate-y-1 hover:border-[#177353]"
                >
                  <StatusBadge status={issue.status} />
                  <h3 className="mb-5 mt-5 text-lg font-semibold leading-7">
                    {issue.title}
                  </h3>
                  <p className="mb-5 flex items-center gap-2 text-sm text-[#52635B]">
                    <MapPin size={15} />
                    {issue.community || 'Community report'}
                  </p>
                  <div className="mt-auto flex justify-between border-t border-[#E4E9E2] pt-4 text-sm">
                    <span>
                      {issue.report_count} resident report
                      {issue.report_count !== 1 ? 's' : ''}
                    </span>
                    <ArrowUpRight size={19} className="text-[#177353]" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Sprout size={36} className="mx-auto mb-4 text-[#177353]" />
              <h3 className="text-xl font-semibold">
                Your community’s next chapter starts here.
              </h3>
              <p className="mt-2 mb-5">
                No public reports yet. Be the first to document an issue in your
                area.
              </p>
              <Link href="/report" className="button button-primary">
                Make the first report <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
        </section>
        <section className="bg-[#EDF2E8] section-space" id="how-it-works">
          <div className="site-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Participation made practical</p>
                <h2>
                  A clearer path from
                  <br />
                  “someone should” to “we can”.
                </h2>
              </div>
              <p className="max-w-sm text-[#52635B] leading-7">
                One report creates a record. A community makes it harder to
                overlook.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map(({ number, title, text, Icon }) => (
                <div key={number} className="border-t border-[#B9CCB9] pt-6">
                  <div className="mb-7 flex justify-between">
                    <Icon size={27} className="text-[#177353]" />
                    <span className="text-sm text-[#52635B]">{number}</span>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{title}</h3>
                  <p className="leading-7 text-[#52635B]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="site-container section-space">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The everyday things that matter</p>
              <h2>
                Better services.
                <br />
                Stronger neighbourhoods.
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { name: 'Roads & drainage', slug: 'infrastructure', Icon: Route },
              { name: 'Clean water', slug: 'water', Icon: Waves },
              { name: 'Electricity', slug: 'electricity', Icon: Lightbulb },
              {
                name: 'Schools & learning',
                slug: 'education',
                Icon: GraduationCap,
              },
            ].map(({ name, slug, Icon }) => (
              <Link
                href={`/explore?category=${slug}`}
                key={slug}
                className="civic-card p-6 hover:border-[#177353]"
              >
                <Icon size={27} className="mb-6 text-[#177353]" />
                <p className="font-semibold">{name}</p>
                <span className="mt-2 flex items-center gap-2 text-sm text-[#52635B]">
                  See reports <ArrowUpRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="site-container pb-20">
          <div className="community-callout">
            <div>
              <p className="eyebrow text-[#DAE8A0]">
                Home is worth showing up for
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                A better community
                <br />
                starts with your next step.
              </h2>
              <p className="mt-4 max-w-lg text-green-100/80">
                Living here or following from abroad, there’s a part for you to
                play.
              </p>
            </div>
            <Link
              href="/signup"
              className="button bg-[#DAE8A0] text-[#183D2E] hover:bg-white"
            >
              Join your community <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
