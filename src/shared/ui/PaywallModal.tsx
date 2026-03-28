'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Check } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export type PaywallFeature =
  | 'people'
  | 'movies'
  | 'travel'
  | 'reminders'
  | 'ai_suggestions'
  | 'ai_chat'
  | 'avatar'
  | 'custom_categories'
  | 'gift_photo'
  | 'actors'

interface PaywallModalProps {
  open: boolean
  feature: PaywallFeature | string
  onClose: () => void
}

const FEATURE_KEY_MAP: Record<string, string> = {
  people: 'paywall.featurePeople',
  movies: 'paywall.featureMovies',
  travel: 'paywall.featureTravel',
  reminders: 'paywall.featureReminders',
  ai_suggestions: 'paywall.featureAiSuggestions',
  ai_chat: 'paywall.featureAiChat',
  avatar: 'paywall.featureAvatar',
  custom_categories: 'paywall.featureCustomCategories',
  gift_photo: 'paywall.featureGiftPhoto',
  actors: 'paywall.featureActors',
}

export function PaywallModal({ open, feature, onClose }: PaywallModalProps) {
  const t = useTranslations()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Блокируем скролл страницы когда модал открыт
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open || !mounted) return null

  const subtitleKey = FEATURE_KEY_MAP[feature] ?? 'paywall.upgradeTitle'

  return createPortal(
    <div
      className="paywall-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="paywall-modal w-full max-w-sm rounded-[24px] bg-bg-card border border-border-card p-6 relative"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-bg-input text-text-muted hover:text-text-secondary transition-colors"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {/* Crown emoji */}
        <div className="text-3xl mb-3">👑</div>

        {/* Title */}
        <h2
          className="text-[22px] font-bold tracking-[-0.5px] text-text-primary mb-1"
          style={{ fontFamily: 'var(--font-cormorant, serif)' }}
        >
          {t('paywall.upgradeTitle')}
        </h2>

        {/* Feature subtitle */}
        <p className="text-sm text-text-secondary mb-5">
          {t(subtitleKey as Parameters<typeof t>[0])}
        </p>

        {/* Benefits */}
        <ul className="flex flex-col gap-2.5 mb-6">
          {(['benefit1', 'benefit2', 'benefit3', 'benefit4'] as const).map((key) => (
            <li key={key} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Check size={11} className="text-primary" />
              </span>
              <span className="text-sm text-text-primary">
                {t(`paywall.${key}` as Parameters<typeof t>[0])}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/pro"
          onClick={onClose}
          className="paywall-cta block w-full rounded-[12px] bg-primary py-3 text-center text-sm font-semibold text-white hover:bg-primary-dark transition-colors mb-3"
        >
          {t('paywall.upgradeCTA')}
        </Link>

        {/* Maybe later */}
        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          {t('paywall.maybeLater')}
        </button>
      </div>
    </div>,
    document.body
  )
}
