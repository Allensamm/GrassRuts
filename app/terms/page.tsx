import Link from 'next/link'
import Image from 'next/image'

export const metadata = { title: 'Terms of Service — Grassruts' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/">
            <Image src="/logo.svg" alt="Grassruts" width={130} height={26} priority />
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. What Grassruts Is</h2>
            <p>Grassruts is a civic technology platform operated by <strong>join2getherwork</strong> that enables Nigerian residents to collectively report community infrastructure problems to government authorities. By using Grassruts, you agree to these terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Eligibility</h2>
            <p>You must be at least 18 years old to create an account. You must register with your actual name and a valid email address. Creating multiple accounts to inflate report counts is prohibited and will result in permanent suspension.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Acceptable Use — Community Issues Only</h2>
            <p>Grassruts is strictly for <strong>community infrastructure issues</strong> that affect the public — roads, water, electricity, public health, schools, environment, and security. You must not use Grassruts to report personal grievances, financial needs, individual disputes, domestic matters, or any issue that does not affect the broader community. Violations will result in your report being removed and your account suspended.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Truthful Reporting</h2>
            <p>You agree to only report issues that genuinely exist in your registered Local Government Area. Fabricating, exaggerating, or coordinating false reports is a violation of these terms and may constitute a criminal offense under Nigerian law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Diaspora Users</h2>
            <p>Users who identify as diaspora (living outside Nigeria) may view and share issues but may not submit new reports or add voices to existing reports. This restriction exists to protect the integrity of the 50-report verification system.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Content You Upload</h2>
            <p>Photos and descriptions you submit become part of the public record on Grassruts. You grant join2getherwork a non-exclusive licence to display this content on the platform and share it with relevant government authorities. Do not upload content you do not own or have permission to share.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. No Guarantee of Government Action</h2>
            <p>Grassruts facilitates reporting and escalation but cannot guarantee that any government authority will respond to or resolve any issue. We are not a government agency and have no legal authority to compel action.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Account Termination</h2>
            <p>We reserve the right to suspend or terminate any account that violates these terms, submits false reports, or misuses the platform in any way.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Changes to These Terms</h2>
            <p>We may update these terms from time to time. Continued use of Grassruts after changes are posted constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Contact</h2>
            <p>Questions? Email <a href="mailto:hello@grassruts.com" className="text-[#008751] hover:underline">hello@grassruts.com</a>. Grassruts is a product of <strong>join2getherwork</strong>.</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link href="/" className="text-[#008751] text-sm font-semibold hover:underline">
            ← Back to Grassruts
          </Link>
        </div>
      </div>
    </div>
  )
}
