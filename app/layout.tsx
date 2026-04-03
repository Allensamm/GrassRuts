import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Grassruts — The Root of Change',
  description:
    'Report community problems to government authorities. When 50 people from your area report the same issue, it becomes HIGH PRIORITY and is automatically escalated.',
  keywords: ['Nigeria', 'civic tech', 'community', 'government', 'issues', 'LGA'],
  openGraph: {
    title: 'Grassruts — The Root of Change',
    description: 'Your community has a voice. Make it heard.',
    type: 'website',
  },
  manifest: '/manifest.webmanifest',
  themeColor: '#008751',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Grassruts',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
    </html>
  )
}
