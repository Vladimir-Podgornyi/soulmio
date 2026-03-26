'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

const STEPS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const
type StepKey = (typeof STEPS)[number]

const STORAGE_KEY = 'soulmio_app_onboarded'

interface Props {
  onDone: () => void
}

export function InAppOnboarding({ onDone }: Props) {
  const t = useTranslations('inAppOnboarding')
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(false)
  const [contentVisible, setContentVisible] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(id)
  }, [])

  const finish = useCallback(
    (goToPeople?: boolean) => {
      setVisible(false)
      setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, '1')
        } catch { /* ignore */ }
        onDone()
        if (goToPeople) router.push('/people')
      }, 300)
    },
    [onDone, router],
  )

  const next = useCallback(() => {
    if (current < STEPS.length - 1) {
      // Fade out → change step → fade in
      setContentVisible(false)
      setTimeout(() => {
        setCurrent((c) => c + 1)
        setContentVisible(true)
      }, 160)
    } else {
      finish(true)
    }
  }, [current, finish])

  const isLast = current === STEPS.length - 1
  const step = STEPS[current] as StepKey

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.55)',
          opacity: visible ? 1 : 0,
          backdropFilter: 'blur(2px)',
        }}
        onClick={() => finish()}
      />

      {/* Bottom sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div
          className="rounded-t-[28px] px-6 pt-5 pb-8 md:mx-auto md:max-w-md md:rounded-[24px] md:mb-8"
          style={{
            backgroundColor: 'var(--bg-card)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
          }}
        >
          {/* Drag handle */}
          <div className="mx-auto mb-5 h-[4px] w-10 rounded-full bg-[var(--border)]" />

          {/* Animated step content */}
          <div
            className="transition-all duration-150"
            style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? 'translateY(0)' : 'translateY(6px)' }}
          >
            {/* Emoji */}
            <div className="mb-4 flex justify-center">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                {t(`${step}.emoji`)}
              </span>
            </div>

            {/* Text */}
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-xl font-semibold tracking-[-0.4px] text-text-primary">
                {t(`${step}.title`)}
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                {t(`${step}.subtitle`)}
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="mb-6 flex items-center justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 20 : 6,
                  height: 6,
                  backgroundColor:
                    i === current
                      ? 'var(--primary)'
                      : 'var(--border)',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2.5">
            {isLast ? (
              <button
                onClick={() => finish(true)}
                className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {t('addFirstPerson')}
              </button>
            ) : (
              <button
                onClick={next}
                className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {t('next')}
              </button>
            )}
            <button
              onClick={() => finish()}
              className="w-full rounded-xl py-3 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {t('skipTour')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/** Check localStorage (client-only) — returns true if onboarding should be shown */
export function shouldShowInAppOnboarding(): boolean {
  try {
    return !localStorage.getItem(STORAGE_KEY)
  } catch {
    return false
  }
}
