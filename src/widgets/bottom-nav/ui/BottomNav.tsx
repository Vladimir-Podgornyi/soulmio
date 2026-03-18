'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Home, Users, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, labelKey: 'nav.home' },
  { href: '/people', icon: Users, labelKey: 'nav.people' },
  { href: '/settings', icon: Settings, labelKey: 'nav.settings' },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[64px] items-center justify-around bg-bg-secondary border-t border-border px-2 pb-safe">
      {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
        const isActive = pathname === href

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.8}
              className={isActive ? 'text-primary' : 'text-text-muted'}
            />
            {/* Активная точка */}
            <span
              className={`h-1 w-1 rounded-full transition-opacity ${
                isActive ? 'bg-primary opacity-100' : 'opacity-0'
              }`}
            />
          </Link>
        )
      })}
    </nav>
  )
}
