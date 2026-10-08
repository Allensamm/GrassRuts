import PublicHeader from '@/components/layout/PublicHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Grassruts Government Portal',
  description: 'Government portal for managing escalated community issues.',
}

export default function GovernmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F7F8F2]">
      <PublicHeader />
      <div id="main-content">{children}</div>
    </div>
  )
}
