'use client'

import { useTranslations } from 'next-intl'
import type { Profile } from '@/entities/user/model/types'

interface DashboardPageProps {
  profile: Profile
}

export function DashboardPage({ profile }: DashboardPageProps) {
  const t = useTranslations()
  const displayName = profile.full_name?.split(' ')[0] ?? profile.email ?? 'there'

  return (
    <div className="min-h-screen bg-s-bg-primary px-4 pt-14 pb-8">
      <h1 className="text-[28px] font-bold tracking-[-0.5px] text-s-text-primary">
        {t('dashboard.greeting', { name: displayName })}
      </h1>
    </div>
  )
}
