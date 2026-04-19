import Link from 'next/link'
import Image from 'next/image'
import { Mail, MessageSquare, Users, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Contact — Grassruts' }

const CONTACT_TYPES = [
  {
    icon: MessageSquare,
    title: 'General Enquiries',
    desc: 'Questions about how Grassruts works, how to report issues, or anything else.',
    email: 'hello@grassruts.com',
  },
  {
    icon: Users,
    title: 'Media & Press',
    desc: 'Interview requests, brand assets, partnership discussions, or press coverage.',
    email: 'press@grassruts.com',
  },
  {
    icon: Mail,
    title: 'Privacy & Data',
    desc: 'Account deletion requests, data access, or any privacy-related questions.',
    email: 'privacy@grassruts.com',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]" style={{ fontFamily: 'var(--font-display)' }}>

      {/* Nav */}
      <nav className="bg-white border-b border-[#EBEBEA] px-4 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.svg" alt="Grassruts" width={130} height={26} priority />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-sm font-medium text-[#717171] hover:text-[#1A1A1A] transition-colors">
              About
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-14">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B7D46]">Get in Touch</span>
          <h1 className="text-5xl font-extrabold text-[#1A1A1A] mt-3 mb-4">
            We'd love to hear<br />from you.
          </h1>
          <p className="text-[#717171] text-xl leading-relaxed max-w-xl">
            Whether you have a question, a bug to report, or just want to tell us what's happening in your community — we're listening.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">

          {/* Left: Contact form */}
          <div>
            <div className="bg-white border border-[#EBEBEA] rounded-2xl p-8">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Send a message</h2>
              <form className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wide mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Chidi"
                      className="w-full px-4 py-3 rounded-xl border border-[#EBEBEA] text-sm text-[#1A1A1A] placeholder:text-[#C0C0BC] focus:outline-none focus:border-[#1B7D46] focus:ring-2 focus:ring-[#1B7D46]/10 transition-all bg-[#FAFAF8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wide mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Okonkwo"
                      className="w-full px-4 py-3 rounded-xl border border-[#EBEBEA] text-sm text-[#1A1A1A] placeholder:text-[#C0C0BC] focus:outline-none focus:border-[#1B7D46] focus:ring-2 focus:ring-[#1B7D46]/10 transition-all bg-[#FAFAF8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wide mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="chidi@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-[#EBEBEA] text-sm text-[#1A1A1A] placeholder:text-[#C0C0BC] focus:outline-none focus:border-[#1B7D46] focus:ring-2 focus:ring-[#1B7D46]/10 transition-all bg-[#FAFAF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wide mb-2">
                    Subject
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-[#EBEBEA] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1B7D46] focus:ring-2 focus:ring-[#1B7D46]/10 transition-all bg-[#FAFAF8]"
                  >
                    <option value="">Select a topic...</option>
                    <option>General question</option>
                    <option>Report a bug</option>
                    <option>Media / Press enquiry</option>
                    <option>Partnership</option>
                    <option>Privacy / Data request</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wide mb-2">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-4 py-3 rounded-xl border border-[#EBEBEA] text-sm text-[#1A1A1A] placeholder:text-[#C0C0BC] focus:outline-none focus:border-[#1B7D46] focus:ring-2 focus:ring-[#1B7D46]/10 transition-all bg-[#FAFAF8] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1B7D46] hover:bg-[#0F4D2E] text-white py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-green-900/20 flex items-center justify-center gap-2"
                >
                  Send Message <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>

          {/* Right: Contact types + info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Or reach us directly</h2>
              <div className="space-y-4">
                {CONTACT_TYPES.map(({ icon: Icon, title, desc, email }) => (
                  <div
                    key={title}
                    className="bg-white border border-[#EBEBEA] rounded-2xl p-6 hover:border-[#1B7D46]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-[#F0FAF4] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-[#1B7D46]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1A1A] text-sm mb-1">{title}</p>
                        <p className="text-xs text-[#717171] leading-relaxed mb-2">{desc}</p>
                        <a
                          href={`mailto:${email}`}
                          className="text-xs font-bold text-[#1B7D46] hover:underline"
                        >
                          {email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Response time */}
            <div className="bg-[#0F4D2E] rounded-2xl p-6 text-white">
              <p className="font-bold mb-2">⏱ Response Times</p>
              <p className="text-white/65 text-sm leading-relaxed">
                We aim to respond to all messages within <strong className="text-white">48 hours</strong>. For urgent community issues, please use the platform directly — reports are monitored in real time.
              </p>
            </div>

            {/* Platform CTA */}
            <div className="bg-[#F5F5F2] border border-[#EBEBEA] rounded-2xl p-6">
              <p className="font-bold text-[#1A1A1A] mb-2">Have a community issue to report?</p>
              <p className="text-[#717171] text-sm mb-4">
                Don't email us — go straight to the platform where your report will be visible to your whole community.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-[#D97B34] hover:bg-[#C06A25] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-px"
              >
                Report an Issue <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#EBEBEA]">
          <Link href="/" className="text-[#1B7D46] text-sm font-semibold hover:underline">
            ← Back to Grassruts
          </Link>
        </div>
      </div>
    </div>
  )
}
