import Link from 'next/link'
import { MapPin, Users, Eye, Sprout, ArrowUpRight } from 'lucide-react'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
export const metadata = { title: 'Our purpose — Grassruts' }
export default function About() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <section className="bg-[#193E30] py-20 text-white">
          <div className="site-container">
            <p className="eyebrow text-[#DAE8A0]">The root of change</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
              The places we call home
              <br />
              deserve a little more care.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-green-100/80">
              Grassruts helps Nigerian communities turn everyday concerns into a
              shared, visible record—and keep track of what happens next.
            </p>
          </div>
        </section>
        <section className="site-container section-space">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="eyebrow">Why we’re here</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">
                A concern is easier to overlook.
                <br />A community is harder to ignore.
              </h2>
            </div>
            <div className="space-y-5 leading-8 text-[#52635B]">
              <p>
                A broken road or an unreliable water supply affects more than a
                single household. But the people living with the problem often
                have no shared place to document it.
              </p>
              <p>
                Grassruts brings those experiences together. Residents can
                report issues, support concerns in their local area, follow
                authority responses, and verify resolutions. We are independent
                and non-partisan.
              </p>
            </div>
          </div>
        </section>
        <section className="bg-[#EDF2E8] section-space">
          <div className="site-container">
            <p className="eyebrow">What guides us</p>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {[
                {
                  Icon: Users,
                  title: 'People at the centre',
                  text: 'Reporting should be understandable, accessible, and useful to the people affected.',
                },
                {
                  Icon: MapPin,
                  title: 'Local knowledge matters',
                  text: 'Residents bring the context that a national headline or a distant dashboard can miss.',
                },
                {
                  Icon: Eye,
                  title: 'Progress should be visible',
                  text: 'A report, an official response, and a community-verified resolution are different milestones. We show the difference.',
                },
                {
                  Icon: Sprout,
                  title: 'Participation adds up',
                  text: 'Community support helps highlight an issue. It does not replace emergency services or guarantee government action.',
                },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="civic-card p-7">
                  <Icon size={27} className="mb-6 text-[#177353]" />
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-7 text-[#52635B]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="site-container section-space">
          <div className="community-callout">
            <div>
              <p className="eyebrow text-[#DAE8A0]">Built by join2getherwork</p>
              <h2 className="mt-3 text-3xl font-semibold">
                For the everyday work
                <br />
                of a better community.
              </h2>
              <p className="mt-4 text-green-100/80">
                Have an idea, a partnership, or a question? We’d like to hear
                it.
              </p>
            </div>
            <Link
              href="/contact"
              className="button bg-[#DAE8A0] text-[#183D2E]"
            >
              Get in touch <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
