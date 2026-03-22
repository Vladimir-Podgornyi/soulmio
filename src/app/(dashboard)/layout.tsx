import type { Metadata } from 'next'
import { BottomNavClient } from '@/widgets/bottom-nav/ui/BottomNavClient'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <main className="pb-20">
        {children}
      </main>
      <BottomNavClient />
    </div>
  )
}
