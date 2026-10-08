import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import AuthPrivacyBoundary from '@/components/AuthPrivacyBoundary'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Grassruts — The Root of Change',
  description:
    'Report local issues, bring your neighbours together, and follow community progress across Nigeria.',
  keywords: [
    'Nigeria',
    'civic tech',
    'community',
    'government',
    'issues',
    'LGA',
  ],
  openGraph: {
    title: 'Grassruts — The Root of Change',
    description: 'Your community has a voice. Make it heard.',
    type: 'website',
  },
  manifest: '/manifest.webmanifest',
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
    <html
      lang="en"
      className={`${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 font-body">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ServiceWorkerRegistration />
        <AuthPrivacyBoundary />
        {children}
      </body>
    </html>
  )
}
