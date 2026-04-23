import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Grassruts Government Portal',
  description: 'Government portal for managing escalated community issues.',
}

export default function GovernmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0f4f0]">
      {children}
    </div>
  )
}
