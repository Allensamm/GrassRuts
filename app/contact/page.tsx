import Link from 'next/link'
import { Mail, ShieldCheck, Users, ArrowUpRight } from 'lucide-react'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import PageIntro from '@/components/ui/PageIntro'
export const metadata = { title: 'Get in touch — Grassruts' }
export default function Contact() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="site-container section-space">
        <PageIntro
          eyebrow="We’re listening"
          title="Let’s keep the conversation going."
          description="Questions, feedback, or an idea for your community? Reach the right team below."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              Icon: Mail,
              title: 'Questions & feedback',
              text: 'Help with the platform, a bug you spotted, or an idea to make reporting easier.',
              email: 'hello@grassruts.com',
            },
            {
              Icon: Users,
              title: 'Partnerships & media',
              text: 'Work with us, request brand assets, or tell the story of your community.',
              email: 'press@grassruts.com',
            },
            {
              Icon: ShieldCheck,
              title: 'Privacy & your account',
              text: 'Ask about your information, request account deletion, or raise a privacy concern.',
              email: 'privacy@grassruts.com',
            },
          ].map(({ Icon, title, text, email }) => (
            <div key={email} className="civic-card flex flex-col p-7">
              <span className="journey-icon mb-6">
                <Icon size={23} />
              </span>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="my-4 flex-1 text-sm leading-7 text-[#52635B]">
                {text}
              </p>
              <a href={`mailto:${email}`} className="text-link break-all">
                {email}
                <ArrowUpRight size={16} className="shrink-0" />
              </a>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[#52635B]">
          Email links open your email app so you can compose and send your
          message.
        </p>
        <div className="community-callout mt-12">
          <div>
            <p className="eyebrow text-[#DAE8A0]">
              Something needs attention nearby?
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Give your community a shared record.
            </h2>
            <p className="mt-4 max-w-xl text-green-100/80">
              Use a report for local infrastructure concerns. For immediate
              danger, contact the relevant emergency service directly. This
              platform is not an emergency service.
            </p>
          </div>
          <Link href="/report" className="button bg-[#DAE8A0] text-[#183D2E]">
            Report an issue <ArrowUpRight size={18} />
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
