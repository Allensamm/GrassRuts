import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Users, Shield, Zap } from 'lucide-react'

export const metadata = { title: 'About — Grassruts' }

const VALUES = [
  {
    icon: Users,
    title: 'Community First',
    desc: 'Every decision we make is guided by one question: does this make it easier for ordinary Nigerians to be heard?',
  },
  {
    icon: Shield,
    title: 'Radical Transparency',
    desc: 'All issues are public. All report counts are real. No filtering, no suppression. The data belongs to the community.',
  },
  {
    icon: MapPin,
    title: 'Hyperlocal by Design',
    desc: 'Infrastructure problems are local. Our LGA-level structure ensures reports reach exactly the right authority.',
  },
  {
    icon: Zap,
    title: 'Action Over Awareness',
    desc: 'We don\'t just document problems — we create pressure. 50 reports triggers automatic government notification.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]" style={{ fontFamily: 'var(--font-display)' }}>

      {/* Nav */}
      <nav className="bg-white border-b border-[#EBEBEA] px-4 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.svg" alt="Grassruts" width={130} height={26} priority />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-sm font-medium text-[#717171] hover:text-[#1A1A1A] transition-colors">
              Contact
            </Link>
            <Link
              href="/login"
              className="bg-[#1B7D46] hover:bg-[#0F4D2E] text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-[#0F4D2E] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-[#E8A849] text-xs font-bold px-4 py-2 rounded-full mb-8 tracking-wide">
            🇳🇬 &nbsp;A join2getherwork product
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
            The Root of Change.
          </h1>
          <p className="text-white/65 text-xl leading-relaxed max-w-2xl">
            Grassruts is a civic technology platform built to give Nigerian communities the tools they need to report infrastructure problems, validate them collectively, and demand action from the right authorities.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">

        {/* Mission */}
        <section className="mb-20">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B7D46]">Our Mission</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] mt-3 mb-6">
            Why Grassruts Exists
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-[#717171] text-base leading-relaxed">
            <p>
              Across Nigeria, communities deal with the same story: a road collapses, a borehole dries up, streetlights go dark. One person reports it. Nothing happens. Another complains online. Still nothing.
            </p>
            <p>
              The problem isn't a lack of awareness — it's a lack of organized, verifiable pressure. Grassruts changes that. When 50 people from the same LGA report the same issue, it becomes data. Data that can't be ignored.
            </p>
          </div>
        </section>

        {/* How it works summary */}
        <section className="mb-20 bg-[#F5F5F2] rounded-3xl p-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B7D46]">The Mechanism</span>
          <h2 className="text-3xl font-extrabold text-[#1A1A1A] mt-3 mb-8">
            50 Voices = Undeniable
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '1', label: 'Report', desc: 'Any Nigerian can report a community infrastructure problem in under 2 minutes.' },
              { n: '2', label: 'Validate', desc: 'Neighbours in the same LGA confirm the same issue, building a community-backed record.' },
              { n: '3', label: 'Escalate', desc: 'At 50 reports, the issue is automatically flagged as HIGH PRIORITY and sent to the relevant authority.' },
              { n: '4', label: 'Resolve', desc: 'The community — not just the government — decides when an issue is truly resolved.' },
            ].map((step) => (
              <div key={step.n} className="bg-white rounded-2xl p-6 border border-[#EBEBEA]">
                <div className="text-3xl font-black text-[#1B7D46]/20 mb-3">{step.n}</div>
                <p className="font-bold text-[#1A1A1A] mb-2">{step.label}</p>
                <p className="text-sm text-[#717171] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mb-20">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B7D46]">What We Believe</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] mt-3 mb-10">
            Our Values
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-[#EBEBEA] rounded-2xl p-7 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#F0FAF4] rounded-xl flex items-center justify-center mb-4">
                  <Icon size={22} className="text-[#1B7D46]" />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-lg mb-2">{title}</h3>
                <p className="text-[#717171] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Built by */}
        <section className="mb-20 border-t border-[#EBEBEA] pt-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B7D46]">The Builder</span>
          <h2 className="text-3xl font-extrabold text-[#1A1A1A] mt-3 mb-6">
            Built by join2getherwork
          </h2>
          <p className="text-[#717171] text-base leading-relaxed max-w-2xl mb-6">
            Grassruts is a product of <strong className="text-[#1A1A1A]">join2getherwork</strong>, a studio building civic and community technology for African communities. We believe technology should serve people — not just entertain them.
          </p>
          <p className="text-[#717171] text-base leading-relaxed max-w-2xl">
            Grassruts is non-partisan. We don't take sides, we don't favour states or parties. We only care about one thing: making it easier for communities to get the infrastructure they were promised.
          </p>
        </section>

        {/* Press kit note */}
        <section id="press" className="mb-16 bg-[#0F4D2E] rounded-3xl p-10 text-white">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E8A849]">Press & Media</span>
          <h2 className="text-2xl font-extrabold mt-3 mb-4">
            Press Kit
          </h2>
          <p className="text-white/65 leading-relaxed mb-6">
            For media inquiries, interview requests, brand assets (logo, screenshots, brand guidelines), or partnership discussions — reach out to our team directly.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#D97B34] hover:bg-[#C06A25] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-px"
          >
            Contact the Team <ArrowRight size={16} />
          </Link>
        </section>

        <div className="flex items-center justify-between pt-6 border-t border-[#EBEBEA]">
          <Link href="/" className="text-[#1B7D46] text-sm font-semibold hover:underline">
            ← Back to Grassruts
          </Link>
          <Link href="/contact" className="text-[#717171] text-sm hover:text-[#1A1A1A] transition-colors">
            Get in touch →
          </Link>
        </div>
      </div>
    </div>
  )
}
