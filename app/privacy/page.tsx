import Link from 'next/link'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export const metadata = { title: 'Privacy Policy — Grassruts' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <main id="main-content" className="prose-civic">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Last updated: October 2026
        </p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              1. What We Collect
            </h2>
            <p>
              When you create an account on Grassruts, we collect your email
              address, full name, and your Local Government Area (LGA). When you
              report an issue, we collect the issue title, description, location
              (GPS coordinates and address), and any photos you choose to
              upload. We do not collect your phone number or any
              government-issued ID.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              2. How We Use Your Data
            </h2>
            <p>
              Your data is used solely to operate the Grassruts platform — to
              display community issues, count reports, escalate issues to
              government authorities, and notify you of updates on issues you
              have reported. We do not sell your data to third parties. We do
              not use your data for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              3. Who Sees Your Reports
            </h2>
            <p>
              Issue descriptions, locations, photos, counts, and authority
              responses are publicly visible without signing in. Public issue
              pages identify the author as a community member, rather than
              displaying their profile name. When an issue is escalated to a
              government authority via our API, the issue data (title,
              description, location, report count, evidence photos) is shared
              with that authority. Your email address is never shared.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              4. Data Storage
            </h2>
            <p>
              Account and report data is stored on Supabase infrastructure.
              Draft reports may be encrypted and saved on your device while you
              are signed in; signing out clears those local drafts. Photos are
              stored in Supabase Storage with public read access (so anyone can
              view evidence photos attached to an issue). Database access
              policies restrict private account information. Titles and
              descriptions are sent to our moderation provider, Anthropic, to
              check whether submissions concern community issues. If you request
              location detection, coordinates are sent to OpenStreetMap’s
              Nominatim service to suggest an address.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              5. Your Rights
            </h2>
            <p>
              You may request deletion of your account and associated data at
              any time by contacting us at privacy@grassruts.com. Note that
              reports you have contributed to community issues may remain as
              part of that issue’s history even after account deletion, to
              preserve the integrity of the public record.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Cookies</h2>
            <p>
              We use a single authentication cookie to keep you logged in. We do
              not use tracking cookies or third-party analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Contact</h2>
            <p>
              For privacy-related questions, email{' '}
              <a
                href="mailto:privacy@grassruts.com"
                className="text-[#177353] hover:underline"
              >
                privacy@grassruts.com
              </a>
              . Grassruts is a product of <strong>join2getherwork</strong>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link
            href="/"
            className="text-[#177353] text-sm font-semibold hover:underline"
          >
            ← Back to Grassruts
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
