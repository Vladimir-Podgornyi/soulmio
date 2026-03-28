'use client'

import { useState, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useSubscriptionStatus } from '@/shared/lib/useSubscriptionStatus'
import { PaywallModal, type PaywallFeature } from './PaywallModal'

interface ProLockProps {
  children: ReactNode
  feature: PaywallFeature | string
  /**
   * Передай profile чтобы избежать Supabase запроса (синхронный расчёт).
   * Если не передан — хук сам запросит профиль из БД.
   */
  profile?: {
    subscription_tier?: string | null
    subscription_ends_at?: string | null
    grace_period_ends_at?: string | null
  }
}

/**
 * Обёртка для Pro-контента.
 *
 * - Если пользователь Pro → показывает children как обычно
 * - Если Free → показывает children с полупрозрачным оверлеем и иконкой замочка
 *   При клике → открывает PaywallModal
 */
export function ProLock({ children, feature, profile }: ProLockProps) {
  const { isPro } = useSubscriptionStatus(profile)
  const [paywallOpen, setPaywallOpen] = useState(false)

  if (isPro) return <>{children}</>

  return (
    <>
      <div
        className="pro-lock relative cursor-pointer"
        onClick={() => setPaywallOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPaywallOpen(true) }}
        aria-label="Pro feature — click to upgrade"
      >
        {children}

        {/* Overlay */}
        <div
          className="pro-lock-overlay absolute inset-0 flex items-center justify-center rounded-[inherit]"
          style={{ backgroundColor: 'var(--pro-lock-overlay, rgba(10,9,8,0.45))' }}
        >
          <Lock
            className="text-primary transition-transform duration-200 hover:scale-110 drop-shadow-md"
            style={{ width: 24, height: 24 }}
          />
        </div>
      </div>

      <PaywallModal
        open={paywallOpen}
        feature={feature}
        onClose={() => setPaywallOpen(false)}
      />
    </>
  )
}
