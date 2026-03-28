'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useSubscriptionStatus, type SubscriptionProfile } from '@/shared/lib/useSubscriptionStatus'

interface GracePeriodBannerProps {
  /** Передай profile чтобы избежать лишнего Supabase запроса */
  profile?: SubscriptionProfile
}

/**
 * Тонкий баннер, видимый только в grace period (подписка истекла, но есть неделя на продление).
 * Показывает сколько дней осталось и кнопку "Продлить".
 */
export function GracePeriodBanner({ profile }: GracePeriodBannerProps) {
  const t = useTranslations()
  const { isGrace, daysLeft } = useSubscriptionStatus(profile)

  if (!isGrace) return null

  return (
    <div
      className="grace-period-banner flex items-center gap-3 px-4 h-11"
      style={{
        backgroundColor: 'var(--grace-banner-bg)',
        color: 'var(--grace-banner-text)',
      }}
    >
      <p className="flex-1 text-xs font-medium leading-snug truncate">
        {daysLeft != null && daysLeft > 0
          ? t('paywall.graceBanner', { days: daysLeft })
          : t('paywall.graceBannerExpired')}
      </p>
      <Link
        href="/pro"
        className="grace-renew-btn flex-shrink-0 rounded-[8px] px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ backgroundColor: 'var(--grace-banner-text)', color: 'var(--grace-banner-bg)' }}
      >
        {t('paywall.graceRenew')}
      </Link>
    </div>
  )
}
