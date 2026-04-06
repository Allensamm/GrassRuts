'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'Is Grassruts free to use?',
    a: 'Yes — 100% free for every Nigerian citizen. No subscription, no hidden charges. We believe civic participation should never have a price tag.',
  },
  {
    q: 'Who can report an issue?',
    a: 'Any Nigerian resident can report issues affecting their Local Government Area (LGA). You must be registered and your account must be linked to the LGA where the problem exists. Diaspora Nigerians can watch issues and share them, but reporting is reserved for residents — to keep reports genuine.',
  },
  {
    q: 'What happens when an issue reaches 50 reports?',
    a: 'It becomes HIGH PRIORITY and is automatically flagged to the relevant government authority — whether that\'s the Ministry of Works, State Water Corporation, or your LGA council. The issue becomes an official record with timestamps, report count, and evidence that\'s hard to ignore.',
  },
  {
    q: 'Can the government remove or hide an issue?',
    a: 'No. Government officials can update the status of an issue (e.g. mark it "In Review" or "Resolved") but they cannot delete or hide it. All reports and updates are permanently recorded and visible to the community.',
  },
  {
    q: 'Can I report an issue from another LGA?',
    a: 'No — and this is by design. Every report is locked to your registered LGA on the server. This prevents manipulation and ensures that only people who actually live with the problem are counted. If you moved recently, update your profile.',
  },
  {
    q: 'What types of issues can I report?',
    a: 'Community infrastructure problems only: broken roads and bridges, water supply failure, power outages, public health hazards, school deterioration, flooding, illegal dumping, and security concerns. Personal financial problems, individual disputes, or private grievances are not accepted.',
  },
  {
    q: 'I live abroad — can I still use Grassruts?',
    a: 'Yes! Diaspora Nigerians can create an account with diaspora mode enabled. You can watch issues in your home community, receive updates, and share issues to amplify awareness. Reporting is restricted to residents to keep the data credible.',
  },
  {
    q: 'How does Grassruts prevent fake or personal reports?',
    a: 'Three layers of protection: (1) Your report is automatically locked to your registered LGA — you literally cannot file for another area. (2) AI moderation checks every submission and rejects personal requests like "I need money" or individual complaints. (3) The 50-report threshold is itself a filter — fake issues won\'t get 50 real neighbours to confirm them.',
  },
  {
    q: 'What if the government marks an issue resolved but it isn\'t?',
    a: 'The community has the final say. When government marks something resolved, the original reporters receive a notification asking "Is it actually fixed?" The issue only moves to VERIFIED status when 50%+ of reporters confirm. If they don\'t, it goes back to HIGH PRIORITY automatically.',
  },
  {
    q: 'What happens if the government never responds?',
    a: 'The issue stays visible and active on Grassruts indefinitely. The public record of inaction is itself pressure. We are also building direct integrations with state government portals and plan to publish monthly transparency reports showing response rates by LGA.',
  },
]

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div key={i} className="gr-card overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
          >
            <span className="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
              {faq.q}
            </span>
            <ChevronDown
              size={18}
              className="shrink-0 text-[#008751] transition-transform duration-300"
              style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: open === i ? '400px' : '0px' }}
          >
            <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">
              {faq.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
