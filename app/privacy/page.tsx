import Link from 'next/link'
import Image from 'next/image'

export const metadata = { title: 'Privacy Policy — Grassruts' }

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. What We Collect</h2>
            <p>When you create an account on Grassruts, we collect your email address, full name, and your Local Government Area (LGA). When you report an issue, we collect the issue title, description, location (GPS coordinates and address), and any photos you choose to upload. We do not collect your phone number or any government-issued ID.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. How We Use Your Data</h2>
            <p>Your data is used solely to operate the Grassruts platform — to display community issues, count reports, escalate issues to government authorities, and notify you of updates on issues you have reported. We do not sell your data to third parties. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Who Sees Your Reports</h2>
            <p>Issues you report are visible to other Grassruts users. Your name is attached to issues you create. When an issue is escalated to a government authority via our API, the issue data (title, description, location, report count, evidence photos) is shared with that authority. Your email address is never shared.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Data Storage</h2>
            <p>All data is stored on Supabase infrastructure, hosted within secure cloud environments. Photos are stored in Supabase Storage with public read access (so anyone can view evidence photos attached to an issue). We apply industry-standard security practices including row-level security on all database tables.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Your Rights</h2>
            <p>You may request deletion of your account and associated data at any time by contacting us at privacy@grassruts.com. Note that reports you have contributed to community issues may remain as part of that issue's history even after account deletion, to preserve the integrity of the public record.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Cookies</h2>
            <p>We use a single authentication cookie to keep you logged in. We do not use tracking cookies or third-party analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Contact</h2>
            <p>For privacy-related questions, email <a href="mailto:privacy@grassruts.com" className="text-[#008751] hover:underline">privacy@grassruts.com</a>. Grassruts is a product of <strong>join2getherwork</strong>.</p>
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
