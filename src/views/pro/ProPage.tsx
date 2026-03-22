'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Check, X, Zap } from 'lucide-react'

interface ProPageProps {
  isPro: boolean
}

// Feature comparison rows
// type: 'compare' shows Free value vs Pro value
// type: 'bool' shows X for free, check for pro
interface FeatureRow {
  type: 'compare' | 'bool'
  labelKey: string
  freeKey?: string
  proKey?: string
}

export function ProPage({ isPro }: ProPageProps) {
  const t = useTranslations()

  const features: FeatureRow[] = [
    { type: 'compare', labelKey: 'pro.people',         freeKey: 'pro.peopleFree',      proKey: 'pro.peoplePro' },
    { type: 'compare', labelKey: 'pro.categories',     freeKey: 'pro.categoriesFree',  proKey: 'pro.categoriesPro' },
    { type: 'compare', labelKey: 'pro.customCat',      freeKey: 'pro.customCatFree',   proKey: 'pro.customCatPro' },
    { type: 'bool',    labelKey: 'pro.avatar' },
    { type: 'bool',    labelKey: 'pro.customRelation' },
    { type: 'bool',    labelKey: 'pro.giftPhoto' },
    { type: 'compare', labelKey: 'pro.customItems',    freeKey: 'pro.customItemsFree',  proKey: 'pro.customItemsPro' },
    { type: 'bool',    labelKey: 'pro.reminders' },
    { type: 'bool',    labelKey: 'pro.actors' },
    { type: 'compare', labelKey: 'pro.ai',             freeKey: 'pro.aiFree',          proKey: 'pro.aiPro' },
    { type: 'bool',    labelKey: 'pro.aiChat' },
  ]

  return (
    <div className="min-h-screen bg-bg-primary pb-28">
      {/* Back */}
      <div className="px-4 pt-14">
        <Link
          href="/settings"
          className="mb-6 flex items-center gap-1 text-sm text-text-secondary"
        >
          <ChevronLeft size={16} />
          {t('common.back')}
        </Link>
      </div>

      {/* Hero gradient header */}
      <div
        className="mx-4 mb-6 rounded-[24px] px-6 py-8 text-center"
        style={{ background: 'linear-gradient(145deg, #7A3020, #C94F38)' }}
      >
        <div className="mb-3 flex items-center justify-center gap-2">
          <Zap size={22} className="text-white" fill="white" />
          <span className="text-2xl font-bold tracking-[-0.5px] text-white">
            Soulmio Pro
          </span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          {t('pro.subtitle')}
        </p>
        <div className="inline-block rounded-full bg-white/15 px-4 py-1.5">
          <span className="text-base font-bold text-white">{t('pro.price')}</span>
        </div>
      </div>

      {/* Already Pro banner */}
      {isPro && (
        <div className="mx-4 mb-5 rounded-[14px] bg-[#2A3A28] border border-[#5CBD8A]/20 px-4 py-3 flex items-center gap-3">
          <Check size={18} className="text-[#5CBD8A] flex-shrink-0" />
          <p className="text-sm font-medium text-[#5CBD8A]">{t('pro.alreadyPro')}</p>
        </div>
      )}

      {/* Feature comparison table */}
      <div className="px-4 mb-6">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary px-1">
          {t('pro.featuresTitle')}
        </p>

        <div className="rounded-[14px] bg-bg-card border border-border-card overflow-hidden">
          {/* Header row */}
          <div className="flex items-center border-b border-border-card px-4 py-3 bg-bg-input/50">
            <div className="flex-1" />
            <div className="w-20 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
              {t('pro.free')}
            </div>
            <div className="w-20 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">
              {t('pro.proLabel')}
            </div>
          </div>

          {features.map((f, i) => (
            <div key={f.labelKey}>
              {i > 0 && <div className="mx-4 h-px bg-border-card" />}
              <div className="flex items-center gap-2 px-4 py-3.5">
                <p className="flex-1 text-sm text-text-primary leading-snug">
                  {t(f.labelKey as Parameters<typeof t>[0])}
                </p>

                {/* Free column */}
                <div className="w-20 flex justify-center">
                  {f.type === 'bool' ? (
                    <X size={15} className="text-text-muted" />
                  ) : (
                    <span className="text-center text-xs text-text-secondary leading-snug">
                      {f.freeKey ? t(f.freeKey as Parameters<typeof t>[0]) : ''}
                    </span>
                  )}
                </div>

                {/* Pro column */}
                <div className="w-20 flex justify-center">
                  {f.type === 'bool' ? (
                    <Check size={15} className="text-primary" />
                  ) : (
                    <span className="text-center text-xs font-semibold text-primary leading-snug">
                      {f.proKey ? t(f.proKey as Parameters<typeof t>[0]) : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {!isPro && (
        <div className="px-4">
          <button
            disabled
            className="w-full rounded-[14px] bg-primary text-white font-semibold text-base opacity-60 cursor-not-allowed mb-2 py-4"
          >
            {t('pro.cta')}
          </button>
          <p className="text-center text-xs text-text-muted px-4 leading-relaxed">
            {t('pro.ctaHint')}
          </p>
        </div>
      )}
    </div>
  )
}
