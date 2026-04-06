import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import FaqAccordion from '@/components/landing/FaqAccordion'
import NigeriaMap from '@/components/landing/NigeriaMap'
import { MapPin, Users, TrendingUp, CheckCircle2, Globe, Bell, ArrowRight, Zap } from 'lucide-react'

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
    n: '01', icon: '📝', color: 'bg-green-50 border-green-100',
    title: 'You Report the Problem',
    desc: 'See a road that\'s been broken for years? A borehole that\'s been dry for months? Describe it, pin the location, add a photo — done in 2 minutes.',
  },
  {
    n: '02', icon: '👥', color: 'bg-blue-50 border-blue-100',
    title: 'Your Neighbours Confirm It',
    desc: 'When 50 people from the same LGA report the same issue, it becomes HIGH PRIORITY. Numbers make noise that can\'t be ignored.',
  },
  {
    n: '03', icon: '🏛️', color: 'bg-orange-50 border-orange-100',
    title: 'Government Gets the Memo',
    desc: 'High-priority issues are automatically pushed to the right authority — the Ministry of Works, State Water Corp, Police, whoever owns the problem.',
  },
  {
    n: '04', icon: '✅', color: 'bg-purple-50 border-purple-100',
    title: 'YOU Decide When It\'s Done',
    desc: 'Government says it\'s fixed? Good. But the issue doesn\'t close until 50% of reporters confirm it with their own eyes. No more quiet cover-ups.',
  },
]

const CATEGORIES = [
  { icon: '🛣️', name: 'Roads & Infrastructure', desc: 'Potholes, collapsed bridges, drainage' },
  { icon: '💧', name: 'Water Supply', desc: 'Dry taps, burst pipes, sewage' },
  { icon: '⚡', name: 'Electricity', desc: 'Outages, fallen cables, transformers' },
  { icon: '🏥', name: 'Public Health', desc: 'Hospitals, disease, sanitation' },
  { icon: '🔒', name: 'Security', desc: 'Crime, unsafe areas, streetlights' },
  { icon: '🏫', name: 'Education', desc: 'School buildings, facilities, teachers' },
  { icon: '🌍', name: 'Environment', desc: 'Flooding, erosion, illegal dumps' },
  { icon: '❓', name: 'Other', desc: 'Any public community problem' },
]

const FOR_WHOM = [
  {
    icon: MapPin, color: 'text-[#008751]', bg: 'bg-green-50',
    title: 'Nigerian Residents',
    desc: 'You live with the problem every day. Report it, get your neighbours to confirm it, and watch it become impossible to ignore.',
    cta: 'Start Reporting', href: '/login',
  },
  {
    icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50',
    title: 'Diaspora Nigerians',
    desc: 'Far from home but not disconnected. Watch what\'s happening in your village, your city, your people — and share issues to amplify them.',
    cta: 'Watch Your Community', href: '/login',
  },
  {
    icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50',
    title: 'Government Officials',
    desc: 'Access a live API of verified, community-backed issues in your jurisdiction. No more guessing what\'s urgent — the data speaks.',
    cta: 'API Documentation', href: '/explore',
  },
]

export default async function LandingPage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Image src="/logo.svg" alt="Grassruts" width={150} height={30} priority />
          <div className="flex items-center gap-6">
            <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-900 hidden sm:block transition-colors">
              Explore Issues
            </Link>
            <Link href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 hidden sm:block transition-colors">
              How It Works
            </Link>
            <Link href="#faq" className="text-sm text-gray-500 hover:text-gray-900 hidden md:block transition-colors">
              FAQ
            </Link>
            <Link
              href="/login"
              className="bg-[#008751] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#006B40] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-[#012b1a] overflow-hidden relative">
        {/* background grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(0,200,100,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,100,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#008751]/20 text-[#00D46A] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 animate-fade-in">
                🇳🇬 &nbsp;Built for 200 million Nigerians
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 animate-fade-in-up">
                Your Community<br />
                Has a Voice.<br />
                <span className="text-[#00D46A]">Make It Heard.</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg animate-fade-in-up delay-200">
                Report community problems. Get your neighbours to confirm them.
                When 50 voices speak together, the government <em>must</em> listen.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-300">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 bg-[#008751] hover:bg-[#006B40] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-green-900/30"
                >
                  Report an Issue <ArrowRight size={16} />
                </Link>
                <Link
                  href="/explore"
                  className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 text-white border border-white/15 px-7 py-3.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  See Active Issues
                </Link>
              </div>
            </div>

            {/* Right: Nigeria Network Map */}
            <div className="animate-fade-in delay-400">
              <NigeriaMap />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-[#008751]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              { value: stats.totalIssues.toLocaleString(), label: 'Issues Reported', icon: Bell },
              { value: stats.totalReports.toLocaleString(), label: 'Community Reports', icon: Users },
              { value: stats.activeLgas.toLocaleString(), label: 'LGAs Active', icon: MapPin },
              { value: stats.resolvedIssues.toLocaleString(), label: 'Issues Resolved', icon: CheckCircle2 },
            ].map(({ value, label, icon: Icon }, i) => (
              <div key={i} className="space-y-1">
                <Icon size={18} className="mx-auto text-white/60 mb-2" />
                <div className="text-3xl font-extrabold">{value || '—'}</div>
                <div className="text-white/70 text-xs font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#008751]">The Process</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-3">
            From Problem to Pressure in 4 Steps
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            No bureaucracy. No phone calls to offices. No begging. Just collective action.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => (
            <div key={i} className={`gr-card border p-6 animate-fade-in-up ${step.color}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{step.icon}</span>
                <span className="text-xs font-black text-gray-300">{step.n}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 leading-snug">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 50-Report Mechanic Visual ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#008751]">The Threshold</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-3">
            50 Voices = Undeniable
          </h2>
          <p className="text-gray-500 mb-10 max-w-lg mx-auto">
            One complaint is easy to dismiss. Fifty residents from the same area, all reporting the same broken road? That's data. That's pressure.
          </p>

          {/* Progress visualization */}
          <div className="gr-card p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-2xl">🛣️</span>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900 text-sm">Collapsed road on Airport Road, Abuja</p>
                <p className="text-xs text-gray-400 mt-0.5">Infrastructure · Gwagwalada LGA</p>
              </div>
              <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-full whitespace-nowrap">
                🔥 HIGH PRIORITY
              </span>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span className="font-semibold text-[#008751]">52 community reports</span>
                <span>Threshold: 50</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#008751] to-[#00D46A]" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#008751] font-semibold">
              <TrendingUp size={13} />
              Automatically escalated to Ministry of Works — 2 days ago
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#008751]">What You Can Report</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-3">
            Any Public Problem. Any LGA.
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <div
              key={i}
              className="gr-card p-5 text-center cursor-default animate-fade-in-up"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <p className="font-bold text-gray-900 text-sm mb-1">{cat.name}</p>
              <p className="text-xs text-gray-400 leading-snug">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who is it for ── */}
      <section className="bg-[#012b1a] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00D46A]">Built For Everyone</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-3">
              From Badagry to Borno
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Whether you live there, left there, or govern there — Grassruts works for you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FOR_WHOM.map(({ icon: Icon, color, bg, title, desc, cta, href }, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-bold text-white text-lg mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed flex-1">{desc}</p>
                <Link
                  href={href}
                  className="mt-6 flex items-center gap-2 text-[#00D46A] text-sm font-semibold hover:gap-3 transition-all"
                >
                  {cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Quote ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-6">🤝</div>
          <blockquote className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug mb-6">
            "We don't care about your party, your religion, or your tribe.
            <span className="text-[#008751]"> We care about your community."</span>
          </blockquote>
          <p className="text-gray-400 text-sm">
            From the streets of Lagos to the villages of Kebbi — one platform, one mission.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#008751]">Questions</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-3">
              Frequently Asked
            </h2>
            <p className="text-gray-500">Everything you need to know before you start.</p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#008751] py-20 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Your LGA needs your voice.
          </h2>
          <p className="text-white/75 mb-8 text-lg">
            Stop waiting for someone else to report it. Be the first.
            Every movement starts with one person.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="bg-white text-[#008751] px-8 py-4 rounded-xl font-extrabold text-sm hover:bg-gray-50 transition-colors"
            >
              Report Your First Issue
            </Link>
            <Link
              href="/explore"
              className="bg-white/10 border border-white/25 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              Browse Active Issues
            </Link>
          </div>
        </div>
      </section>

      {/* ── Page footer (replaces the global footer on the landing page) ── */}
      <footer className="bg-[#012b1a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Grassruts" width={120} height={24} />
              <span className="text-gray-600 hidden sm:block">|</span>
              <span className="text-xs text-gray-500 hidden sm:block">The Root of Change</span>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-gray-500">
              <Link href="/explore" className="hover:text-gray-300 transition-colors">Explore Issues</Link>
              <Link href="#how-it-works" className="hover:text-gray-300 transition-colors">How It Works</Link>
              <Link href="#faq" className="hover:text-gray-300 transition-colors">FAQ</Link>
              <Link href="/login" className="hover:text-gray-300 transition-colors">Sign Up</Link>
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} Grassruts · A <span className="text-gray-400 font-semibold">join2getherwork</span> product · The Root of Change
          </div>
        </div>
      </footer>
    </div>
  )
}
