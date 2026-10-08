import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="site-container min-h-[65vh] py-10">
        {children}
      </main>
      <PublicFooter />
    </>
  )
}
