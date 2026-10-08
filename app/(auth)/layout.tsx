import PublicHeader from '@/components/layout/PublicHeader'
import { MapPin, ShieldCheck, Users } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="auth-shell">
        <aside className="auth-story">
          <p className="eyebrow text-[#DAE8A0] mb-6">
            Your neighbourhood. Your voice.
          </p>
          <h1>
            A little participation.
            <br />A lasting difference.
          </h1>
          <p className="mt-7 text-lg leading-8 text-green-100/80">
            Join people who care about the places they call home.
          </p>
          <div className="mt-12 space-y-5">
            {[
              { Icon: MapPin, text: 'Follow the issues closest to you.' },
              {
                Icon: Users,
                text: 'Build a shared record with your neighbours.',
              },
              {
                Icon: ShieldCheck,
                text: 'Help verify real progress in your community.',
              },
            ].map(({ Icon, text }) => (
              <p
                key={text}
                className="flex items-center gap-4 text-sm text-green-100"
              >
                <Icon size={20} />
                {text}
              </p>
            ))}
          </div>
          <p className="mt-16 text-xs text-green-100/70">
            Independent · Non-partisan · Built for Nigeria
          </p>
        </aside>
        <section>{children}</section>
      </main>
    </>
  )
}
