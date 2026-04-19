import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import FaqAccordion from '@/components/landing/FaqAccordion'
import NigeriaMap from '@/components/landing/NigeriaMap'
import AnimateOnScroll from '@/components/landing/AnimateOnScroll'
import StatsSection from '@/components/landing/StatsSection'
import {
  MapPin, Users, CheckCircle2, Globe, ArrowRight,
  Bell, TrendingUp, Shield,
} from 'lucide-react'

async function getStats() {
  try {
    const supabase = await createClient()
    const [issues, resolved, lgaRows, reports] = await Promise.all([
      supabase.from('issues').select('id', { count: 'exact', head: true }),
      supabase.from('issues').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
      supabase.from('issues').select('lga_id').not('lga_id', 'is', null),
      supabase.from('reports').select('id', { count: 'exact', head: true }),
    ])
    const uniqueLgas = new Set((lgaRows.data || []).map(i => i.lga_id)).size
    return {
      totalIssues: issues.count ?? 0,
      resolvedIssues: resolved.count ?? 0,
      activeLgas: uniqueLgas,
      totalReports: reports.count ?? 0,
    }
  } catch {
    return { totalIssues: 0, resolvedIssues: 0, activeLgas: 0, totalReports: 0 }
  }
}

const STEPS = [
  {
    n: '01',
    emoji: '📝',
    title: 'Report the Problem',
    desc: 'Spot a broken road, dry borehole, or failed streetlight? Describe it, drop a pin, add a photo — done in under 2 minutes.',
  },
  {
    n: '02',
    emoji: '👥',
    title: 'Community Validates',
    desc: 'When 50 people from the same LGA report the same issue, it becomes HIGH PRIORITY. Numbers create pressure that can\'t be ignored.',
  },
  {
    n: '03',
    emoji: '🏛️',
    title: 'Government Gets Notified',
    desc: 'High-priority issues are automatically pushed to the right authority — Ministry of Works, Water Corp, Police — whoever owns the fix.',
  },
  {
    n: '04',
    emoji: '✅',
    title: 'Community Confirms Resolution',
    desc: 'Government says it\'s fixed? Great. But the issue stays open until 50% of reporters confirm it with their own eyes. No more cover-ups.',
  },
]

const MOCK_ISSUES = [
  {
    emoji: '🛣️',
    category: 'Infrastructure',
    title: 'Airport Road collapsed after flooding — impassable for 3 months',
    lga: 'Gwagwalada LGA',
    state: 'FCT',
    status: 'HIGH PRIORITY' as const,
    reports: 52,
    timeAgo: '2 days ago',
    avatarColors: ['#1B7D46', '#D97B34', '#5B8FD9', '#E8A849'],
  },
  {
    emoji: '💧',
    category: 'Water Supply',
    title: 'Community borehole dry since February, 3 streets without water',
    lga: 'Surulere LGA',
    state: 'Lagos',
    status: 'IN PROGRESS' as const,
    reports: 34,
    timeAgo: '5 days ago',
    avatarColors: ['#5B8FD9', '#1B7D46', '#D97B34'],
  },
  {
    emoji: '💡',
    category: 'Electricity',
    title: 'All streetlights out on Market Street since the last rainstorm',
    lga: 'Yola North LGA',
    state: 'Adamawa',
    status: 'NEW' as const,
    reports: 8,
    timeAgo: '1 day ago',
    avatarColors: ['#E8A849', '#DC4B4B'],
  },
]

const STATUS_STYLES = {
  'HIGH PRIORITY': {
    bg: 'bg-red-50', text: 'text-[#DC4B4B]', dot: 'bg-[#DC4B4B]', border: 'border-red-100',
  },
  'IN PROGRESS': {
    bg: 'bg-amber-50', text: 'text-[#D97B34]', dot: 'bg-[#E8A849]', border: 'border-amber-100',
  },
  'NEW': {
    bg: 'bg-blue-50', text: 'text-[#5B8FD9]', dot: 'bg-[#5B8FD9]', border: 'border-blue-100',
  },
  'RESOLVED': {
    bg: 'bg-green-50', text: 'text-[#3AAF6C]', dot: 'bg-[#3AAF6C]', border: 'border-green-100',
  },
}

const DIASPORA_CITIES = [
  { city: 'Lagos', state: 'Lagos', issues: 47, trending: true },
  { city: 'Abuja', state: 'FCT', issues: 31, trending: true },
  { city: 'Kano', state: 'Kano', issues: 23, trending: false },
  { city: 'Port Harcourt', state: 'Rivers', issues: 28, trending: true },
  { city: 'Ibadan', state: 'Oyo', issues: 15, trending: false },
  { city: 'Enugu', state: 'Enugu', issues: 9, trending: false },
]

const FOR_WHOM = [
  {
    icon: MapPin,
    accentColor: '#1B7D46',
    bgColor: 'bg-[#F0FAF4]',
    title: 'Nigerian Residents',
    desc: 'You live with the problem every day. Report it, get your neighbours to confirm it, and watch it become impossible to ignore.',
    cta: 'Start Reporting',
    href: '/login',
  },
  {
    icon: Globe,
    accentColor: '#5B8FD9',
    bgColor: 'bg-[#EFF4FF]',
    title: 'Diaspora Nigerians',
    desc: 'Far from home but not disconnected. Monitor what\'s happening in your village and amplify issues to accelerate resolution.',
    cta: 'Watch Your Community',
    href: '/login',
  },
  {
    icon: Shield,
    accentColor: '#D97B34',
    bgColor: 'bg-[#FEF5EE]',
    title: 'Government Officials',
    desc: 'Access a live feed of verified, community-backed issues in your jurisdiction. No more guessing what\'s urgent — the data speaks.',
    cta: 'Explore the Platform',
    href: '/explore',
  },
]

export default async function LandingPage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-[#FAFAF8]" style={{ fontFamily: 'var(--font-display)' }}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#EBEBEA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between">
          <Image src="/logo.svg" alt="Grassruts" width={140} height={28} priority />
          <div className="hidden md:flex items-center gap-8">
            <Link href="/explore" className="text-sm font-medium text-[#717171] hover:text-[#1A1A1A] transition-colors">
              Explore Issues
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-[#717171] hover:text-[#1A1A1A] transition-colors">
              How It Works
            </Link>
            <Link href="#faq" className="text-sm font-medium text-[#717171] hover:text-[#1A1A1A] transition-colors">
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-semibold text-[#1A1A1A] hover:text-[#1B7D46] transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="bg-[#D97B34] hover:bg-[#C06A25] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-orange-900/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-[#0F4D2E] relative overflow-hidden" style={{ minHeight: '720px' }}>
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
        {/* Decorative blobs */}
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#1B7D46]/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-[#D97B34]/8 blur-3xl pointer-events-none" />

        {/* Map — absolutely positioned on the right, does not affect layout */}
        <div
          className="hidden lg:block absolute pointer-events-none animate-fade-in delay-400"
          style={{ top: '50%', right: '-4%', transform: 'translateY(-50%)', width: '58%', zIndex: 1 }}
        >
          <NigeriaMap />
        </div>

        {/* Text — flows normally, constrained to left side */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative" style={{ zIndex: 2 }}>
          <div className="lg:max-w-[48%]">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-[#E8A849] text-xs font-bold px-4 py-2 rounded-full mb-8 animate-fade-in tracking-wide">
              🇳🇬 &nbsp;Built for 200 million Nigerians
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold text-white leading-[1.05] mb-6 animate-fade-in-up">
              Your Community.<br />
              Your Voice.<br />
              <span className="text-[#E8A849]">Your Power.</span>
            </h1>
            <p className="text-white/60 text-xl leading-relaxed mb-10 animate-fade-in-up delay-200">
              Report community problems, get your neighbours to confirm them — when 50 voices speak together, government <em>must</em> listen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-[#D97B34] hover:bg-[#C06A25] text-white px-8 py-4 rounded-xl font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-900/25"
              >
                Report an Issue <ArrowRight size={18} />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/20 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5"
              >
                Explore Issues
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-4 animate-fade-in delay-500">
              <div className="flex -space-x-2">
                {['#1B7D46','#D97B34','#5B8FD9','#E8A849','#DC4B4B'].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0F4D2E] flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: c }}
                  >
                    {['A','K','C','Y','O'][i]}
                  </div>
                ))}
              </div>
              <p className="text-white/50 text-sm">
                Join thousands of Nigerians already reporting
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll direction="fade" className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B7D46]">The Process</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A1A1A] mt-3 mb-4">
              From Problem to Pressure<br className="hidden sm:block" /> in 4 Steps
            </h2>
            <p className="text-[#717171] text-lg max-w-xl mx-auto">
              No bureaucracy. No phone calls to offices. Just collective action that demands results.
            </p>
          </AnimateOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <AnimateOnScroll key={i} delay={i * 100}>
                <div className="gr-card p-7 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#F0FAF4] flex items-center justify-center text-2xl flex-shrink-0">
                      {step.emoji}
                    </div>
                    <span className="text-2xl font-black text-[#EBEBEA] tracking-tight">{step.n}</span>
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] text-lg mb-3 leading-snug">{step.title}</h3>
                  <p className="text-[#717171] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Issues Feed Preview ── */}
      <section className="py-24 bg-[#F5F5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll direction="fade" className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B7D46]">Live Feed</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A1A1A] mt-3 mb-4">
              Real Issues. Real Communities.
            </h2>
            <p className="text-[#717171] text-lg max-w-xl mx-auto">
              Every report is a voice demanding change. Here's what's happening right now across Nigeria.
            </p>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {MOCK_ISSUES.map((issue, i) => {
              const s = STATUS_STYLES[issue.status]
              const pct = Math.min((issue.reports / 50) * 100, 100)
              return (
                <AnimateOnScroll key={i} delay={i * 120}>
                  <div className="issue-card p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#F5F5F2] flex items-center justify-center text-xl flex-shrink-0">
                        {issue.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border mb-2 ${s.bg} ${s.text} ${s.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {issue.status}
                        </div>
                        <p className="text-sm font-bold text-[#1A1A1A] leading-snug line-clamp-2">
                          {issue.title}
                        </p>
                      </div>
                    </div>

                    {/* Location + time */}
                    <div className="flex items-center gap-1.5 text-xs text-[#717171] mb-5">
                      <MapPin size={12} className="flex-shrink-0" />
                      {issue.lga}, {issue.state}
                      <span className="ml-auto">{issue.timeAgo}</span>
                    </div>

                    {/* Progress */}
                    <div className="mb-5 flex-1">
                      <div className="flex justify-between text-xs text-[#717171] mb-1.5">
                        <span className="font-semibold text-[#1B7D46]">{issue.reports} reports</span>
                        <span>50 needed</span>
                      </div>
                      <div className="h-2 bg-[#F0F0EE] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 100
                              ? 'linear-gradient(90deg, #1B7D46, #2AAE6A)'
                              : 'linear-gradient(90deg, #D97B34, #E8A849)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Footer: avatars + count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {issue.avatarColors.map((c, j) => (
                            <div
                              key={j}
                              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: c }}
                            >
                              {['A','B','C','D'][j]}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-[#717171] font-medium">
                          +{Math.max(0, issue.reports - issue.avatarColors.length)} more
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#1B7D46]">
                        <TrendingUp size={12} />
                        Active
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              )
            })}
          </div>

          <AnimateOnScroll direction="fade" className="text-center">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 text-[#1B7D46] font-bold text-base hover:gap-3 transition-all group"
            >
              View All Issues
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Impact Stats ── */}
      <section id="stats" className="py-24 bg-[#1B7D46] relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#0F4D2E]/50 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <AnimateOnScroll direction="fade" className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E8A849]">Impact</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mt-3 mb-4">
              The Numbers Don't Lie
            </h2>
            <p className="text-white/60 text-lg max-w-lg mx-auto">
              Every number here represents a Nigerian who decided their community deserved better.
            </p>
          </AnimateOnScroll>

          <StatsSection
            totalIssues={stats.totalIssues}
            totalReports={stats.totalReports}
            activeLgas={stats.activeLgas}
            resolvedIssues={stats.resolvedIssues}
          />
        </div>
      </section>

      {/* ── Diaspora Section ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Text */}
            <AnimateOnScroll direction="left">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B7D46]">For the Diaspora</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A1A1A] mt-3 mb-6 leading-tight">
                Stay Connected<br />to Home.
              </h2>
              <p className="text-[#717171] text-lg leading-relaxed mb-4">
                Whether you're in London, Houston, or Dubai — you can still watch over the streets you grew up on. See what's being reported in your hometown, share issues with your network, and amplify the voices of those left behind.
              </p>
              <p className="text-[#717171] text-lg leading-relaxed mb-10">
                Distance doesn't have to mean disconnection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 bg-[#D97B34] hover:bg-[#C06A25] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-900/20"
                >
                  Find Your Community <ArrowRight size={16} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 border-2 border-[#EBEBEA] text-[#1A1A1A] hover:border-[#1B7D46] hover:text-[#1B7D46] px-7 py-3.5 rounded-xl font-semibold text-sm transition-all"
                >
                  Create Account
                </Link>
              </div>
            </AnimateOnScroll>

            {/* Right: City activity grid */}
            <AnimateOnScroll direction="right">
              <div className="grid grid-cols-2 gap-4">
                {DIASPORA_CITIES.map((item, i) => (
                  <div
                    key={i}
                    className="bg-[#FAFAF8] border border-[#EBEBEA] rounded-2xl p-5 hover:border-[#1B7D46]/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-[#1A1A1A] text-sm">{item.city}</p>
                        <p className="text-xs text-[#717171]">{item.state} State</p>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${item.trending ? 'bg-[#DC4B4B] animate-pulse' : 'bg-[#EBEBEA]'}`} />
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-2xl font-extrabold text-[#1B7D46]">{item.issues}</span>
                        <p className="text-xs text-[#717171] mt-0.5">active issues</p>
                      </div>
                      {item.trending && (
                        <span className="text-xs font-semibold text-[#DC4B4B] bg-red-50 px-2 py-1 rounded-full">
                          Trending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#717171] text-center mt-4">
                Live data from communities across Nigeria
              </p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ── Who It's For ── */}
      <section className="py-24 bg-[#0F4D2E] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <AnimateOnScroll direction="fade" className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E8A849]">Built For Everyone</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mt-3 mb-4">
              From Badagry to Borno
            </h2>
            <p className="text-white/55 text-lg max-w-lg mx-auto">
              Whether you live there, left there, or govern there — Grassruts works for you.
            </p>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6">
            {FOR_WHOM.map(({ icon: Icon, accentColor, bgColor, title, desc, cta, href }, i) => (
              <AnimateOnScroll key={i} delay={i * 120}>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col h-full hover:bg-white/8 transition-colors group">
                  <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon size={24} style={{ color: accentColor }} />
                  </div>
                  <h3 className="font-bold text-white text-xl mb-3">{title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed flex-1">{desc}</p>
                  <Link
                    href={href}
                    className="mt-7 inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:gap-3"
                    style={{ color: accentColor }}
                  >
                    {cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust quote ── */}
      <section className="py-20 bg-[#F5F5F2]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <AnimateOnScroll direction="fade">
            <div className="text-5xl mb-8">🤝</div>
            <blockquote className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] leading-snug mb-6">
              "We don't care about your party, your religion, or your tribe.
              <span className="text-[#1B7D46]"> We care about your community."</span>
            </blockquote>
            <p className="text-[#717171] text-base">
              From the streets of Lagos to the villages of Kebbi — one platform, one mission.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <AnimateOnScroll direction="fade" className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B7D46]">Questions</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A1A1A] mt-3 mb-4">
              Frequently Asked
            </h2>
            <p className="text-[#717171] text-lg">Everything you need to know before you start.</p>
          </AnimateOnScroll>
          <AnimateOnScroll>
            <FaqAccordion />
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-[#D97B34] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#C06A25]/40 blur-3xl" />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative">
          <AnimateOnScroll direction="fade">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-full mb-8 tracking-wide">
              🇳🇬 &nbsp;Join the movement
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
              Your LGA needs<br />your voice.
            </h2>
            <p className="text-white/75 text-xl mb-10">
              Stop waiting for someone else to report it. Be the first.
              Every movement starts with one person.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#D97B34] px-8 py-4 rounded-xl font-extrabold text-base hover:bg-[#FEF5EE] transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Report Your First Issue <ArrowRight size={18} />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5"
              >
                Browse Active Issues
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0F4D2E] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <Image src="/logo.svg" alt="Grassruts" width={130} height={26} className="mb-4" />
              <p className="text-white/45 text-sm leading-relaxed mb-6">
                The civic technology platform empowering Nigerian communities to demand accountability.
              </p>
              <div className="flex items-center gap-3">
                {['X (Twitter)', 'Instagram', 'Facebook', 'YouTube'].map((label) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors text-white/50 hover:text-white text-xs font-bold"
                    title={label}
                  >
                    {label[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <p className="text-white text-sm font-bold mb-5">Platform</p>
              <ul className="space-y-3">
                {[
                  { label: 'Explore Issues', href: '/explore' },
                  { label: 'Report an Issue', href: '/login' },
                  { label: 'How It Works', href: '#how-it-works' },
                  { label: 'Impact Stats', href: '#stats' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-white/45 hover:text-white text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-white text-sm font-bold mb-5">Company</p>
              <ul className="space-y-3">
                {[
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                  { label: 'FAQ', href: '#faq' },
                  { label: 'Press Kit', href: '/about' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-white/45 hover:text-white text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-white text-sm font-bold mb-5">Legal</p>
              <ul className="space-y-3">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Cookie Policy', href: '/privacy' },
                  { label: 'Data Usage', href: '/privacy' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-white/45 hover:text-white text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-xs">
              © {new Date().getFullYear()} Grassruts · A{' '}
              <span className="text-white/50 font-semibold">join2getherwork</span> product
            </p>
            <p className="text-white/30 text-xs font-semibold tracking-wide">
              Built for Nigerians, by Nigerians 🇳🇬
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
