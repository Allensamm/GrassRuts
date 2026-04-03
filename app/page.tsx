import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

async function getStats() {
  try {
    const supabase = await createClient()
    const [issues, resolved, lgaRows] = await Promise.all([
      supabase.from('issues').select('id', { count: 'exact', head: true }),
      supabase.from('issues').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
      supabase.from('issues').select('lga_id').not('lga_id', 'is', null),
    ])

    const uniqueLgas = new Set((lgaRows.data || []).map((i) => i.lga_id)).size

    return {
      totalIssues: issues.count ?? 0,
      resolvedIssues: resolved.count ?? 0,
      activeLgas: uniqueLgas,
    }
  } catch {
    return { totalIssues: 0, resolvedIssues: 0, activeLgas: 0 }
  }
}

const steps = [
  {
    icon: '📝',
    title: 'Report a Community Issue',
    description:
      "See a road that's been broken for years? No water in your area? Report it — along with your neighbors.",
  },
  {
    icon: '👥',
    title: 'Your Community Verifies',
    description:
      'When 50 people from your area report the same issue, it becomes HIGH PRIORITY. Numbers speak louder than words.',
  },
  {
    icon: '🏛️',
    title: 'Government Gets Notified',
    description:
      'High-priority issues are automatically sent to the right government authority. No more shouting into the void.',
  },
  {
    icon: '✅',
    title: 'You Confirm Resolution',
    description:
      "The issue isn't closed until YOU say it's fixed. The community that raised the alarm sounds the all-clear.",
  },
]

export default async function LandingPage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo.svg" alt="Grassruts" width={160} height={32} priority />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/explore" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">
              Explore Issues
            </Link>
            <Link href="/gov/login" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">
              For Government
            </Link>
            <Link
              href="/login"
              className="bg-[#008751] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#006B40] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#008751] to-[#006B40] text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            🇳🇬 Built for Nigerian Citizens
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Your Community Has a Voice.
            <br />
            Make It Heard.
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Report the problems affecting your community. When enough voices speak together, the government must listen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="bg-white text-[#008751] px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Report an Issue
            </Link>
            <Link
              href="/explore"
              className="bg-white/10 text-white border border-white/20 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              See Active Issues
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">
            The Movement So Far
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-[#008751]">{stats.totalIssues.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">Issues Reported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#008751]">{stats.resolvedIssues.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">Issues Resolved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#008751]">{stats.activeLgas.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">LGAs Active</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">How Grassruts Works</h2>
        <p className="text-center text-gray-500 mb-12">Four steps from problem to solution</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 relative">
              <div className="text-3xl mb-4">{step.icon}</div>
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#008751] text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-[#008751] text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Built for Every Nigerian</h2>
          <p className="text-white/80 max-w-2xl mx-auto text-base leading-relaxed">
            From the streets of Lagos to the villages of Kebbi, Grassruts works for everyone. We don&apos;t care
            about your party, your religion, or your tribe. We care about your community.
          </p>
        </div>
      </section>

      {/* Diaspora Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 sm:p-12 text-center">
          <div className="text-4xl mb-4">🌍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Far From Home. Still Connected.</h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-6 leading-relaxed">
            Living abroad? See exactly what&apos;s happening in your home community. Know which roads are broken,
            which taps are dry, which problems need attention. Stay informed. Stay connected. Stay involved.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#008751] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors"
          >
            Monitor Your Home Community
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Grassruts" width={120} height={24} />
              <span className="text-gray-300 hidden sm:block">|</span>
              <span className="text-xs text-gray-400 hidden sm:block">The Root of Change</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <Link href="/gov/login" className="hover:text-gray-600">
                For Government
              </Link>
              <Link href="/privacy" className="hover:text-gray-600">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-gray-600">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
