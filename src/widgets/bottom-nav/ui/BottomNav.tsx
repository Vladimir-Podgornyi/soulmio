'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Home, Users, Settings, Search, ShieldCheck } from 'lucide-react'
import { createClient } from '@/shared/api/supabase'
import { SearchModal } from '@/features/search/ui/SearchModal'

const NAV_BEFORE = [
  { href: '/dashboard', icon: Home, labelKey: 'nav.home' },
  { href: '/people', icon: Users, labelKey: 'nav.people' },
] as const

const NAV_AFTER = [
  { href: '/settings', icon: Settings, labelKey: 'nav.settings' },
] as const

function NavLink({
  href,
  icon: Icon,
  labelKey,
  label,
  isActive,
  t,
  desktop = false,
}: {
  href: string
  icon: typeof Home
  labelKey: string
  label?: string
  isActive: boolean
  t: ReturnType<typeof useTranslations>
  desktop?: boolean
}) {
  const displayLabel = label ?? t(labelKey as Parameters<typeof t>[0])

  if (desktop) {
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-bg text-primary'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }`}
      >
        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
        {displayLabel}
      </Link>
    )
  }
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
    >
      <Icon
        size={22}
        strokeWidth={isActive ? 2.2 : 1.8}
        className={isActive ? 'text-primary' : 'text-text-muted'}
      />
      <span
        className={`h-1 w-1 rounded-full transition-opacity ${
          isActive ? 'bg-primary opacity-100' : 'opacity-0'
        }`}
      />
    </Link>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations()
  const [searchOpen, setSearchOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUserId(data.user?.id ?? null)
      if (data.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single()
        setIsAdmin(profile?.is_admin ?? false)
      }
    })
  }, [])

  return (
    <>
      {/* ── Mobile: bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 transform-gpu flex h-[64px] items-center justify-around bg-bg-secondary border-t border-border px-2 pb-safe">
        {NAV_BEFORE.map(({ href, icon, labelKey }) => (
          <NavLink key={href} href={href} icon={icon} labelKey={labelKey} isActive={pathname === href} t={t} />
        ))}

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
        >
          <Search size={22} strokeWidth={1.8} className="text-text-muted" />
          <span className="h-1 w-1 rounded-full opacity-0" />
        </button>

        {NAV_AFTER.map(({ href, icon, labelKey }) => (
          <NavLink key={href} href={href} icon={icon} labelKey={labelKey} isActive={pathname === href} t={t} />
        ))}
        {isAdmin && (
          <NavLink
            href="/admin"
            icon={ShieldCheck}
            labelKey="nav.admin"
            label="Admin"
            isActive={pathname === '/admin'}
            t={t}
          />
        )}
      </nav>

      {/* ── Desktop: top nav ── */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-40 h-[60px] items-center justify-between bg-bg-secondary border-b border-border px-6">
        <Link
          href="/dashboard"
          className="text-[17px] font-bold tracking-[-0.5px] text-text-primary hover:text-primary transition-colors"
        >
          SoulMio
        </Link>

        <div className="flex items-center gap-1">
          {NAV_BEFORE.map(({ href, icon, labelKey }) => (
            <NavLink key={href} href={href} icon={icon} labelKey={labelKey} isActive={pathname === href} t={t} desktop />
          ))}

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
          >
            <Search size={16} strokeWidth={1.8} />
            {t('nav.search')}
          </button>

          {NAV_AFTER.map(({ href, icon, labelKey }) => (
            <NavLink key={href} href={href} icon={icon} labelKey={labelKey} isActive={pathname === href} t={t} desktop />
          ))}
          {isAdmin && (
            <NavLink
              href="/admin"
              icon={ShieldCheck}
              labelKey="nav.admin"
              label="Admin"
              isActive={pathname === '/admin'}
              t={t}
              desktop
            />
          )}
        </div>
      </nav>

      {searchOpen && userId && (
        <SearchModal userId={userId} onClose={() => setSearchOpen(false)} />
      )}
    </>
  )
}
