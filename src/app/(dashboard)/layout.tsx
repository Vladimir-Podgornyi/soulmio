import { BottomNavClient } from '@/widgets/bottom-nav/ui/BottomNavClient'

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
