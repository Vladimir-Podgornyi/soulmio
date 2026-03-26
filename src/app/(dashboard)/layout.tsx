import type { Metadata } from 'next'
import { BottomNavClient } from '@/widgets/bottom-nav/ui/BottomNavClient'
import { Footer } from '@/widgets/footer/ui/Footer'
import { PageTransition } from '@/shared/ui/PageTransition'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <BottomNavClient />
      <main className="flex-1 pb-20 md:pb-0 md:pt-[60px]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  )
}
