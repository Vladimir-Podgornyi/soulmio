'use client'

import dynamic from 'next/dynamic'

const BottomNav = dynamic(() => import('./BottomNav').then((m) => m.BottomNav), {
  ssr: false,
})

export { BottomNav as BottomNavClient }
