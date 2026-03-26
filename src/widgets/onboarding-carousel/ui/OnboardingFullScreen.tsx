'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'

type SlideKey = 'slide1' | 'slide2' | 'slide3' | 'slide4' | 'slide5'

const SLIDES: { key: SlideKey; img: string }[] = [
  { key: 'slide1', img: '/onboarding1.png' },
  { key: 'slide2', img: '/onboarding2.png' },
  { key: 'slide3', img: '/onboarding3.png' },
  { key: 'slide4', img: '/onboarding4.png' },
  { key: 'slide5', img: '/onboarding5.png' },
]

const INTERVAL_MS = 5000

// Dark background matching the app theme
const DARK = '#080808'

interface Props {
  onDone: () => void
}

export function OnboardingFullScreen({ onDone }: Props) {
  const t = useTranslations('onboarding')
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), [])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused, next])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current ?? 0))
    if (Math.abs(dx) > 40 && dy < 60) dx < 0 ? next() : prev()
    touchStartX.current = null
    touchStartY.current = null
  }

  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1

  return (
    <>
    <style>{`
      /* Portrait mobile */
      @media (max-width: 767px) and (orientation: portrait) {
        .ob-title { font-size: 2.25rem !important; line-height: 1.08 !important; }
      }
      /* Landscape mobile — compact layout so content stays at bottom */
      @media (orientation: landscape) and (max-height: 500px) {
        .ob-content  { padding-bottom: 0.5rem !important; }
        .ob-text-box { min-height: 68px !important; margin-bottom: 0.5rem !important; }
        .ob-title    { font-size: 1.25rem !important; line-height: 1.08 !important; margin-bottom: 0.25rem !important; }
      }
    `}</style>
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ backgroundColor: DARK }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background slides — full screen cover on all devices */}
      {SLIDES.map((s, i) => (
        <div
          key={s.key}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.img} alt="" className="h-full w-full object-cover object-center" />
        </div>
      ))}

      {/* Gradient overlay — dark at top (brand/skip) and bottom (text) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.7) 72%, rgba(0,0,0,0.88) 100%)',
        }}
      />

      {/* ─────────────────────────────────────────
          BRAND + SKIP
      ───────────────────────────────────────── */}
      <div className="absolute left-6 top-8 flex items-center gap-2 md:left-10">
        <span className="text-xl" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>🫶</span>
        <span
          className="text-sm font-semibold tracking-[-0.3px] text-white"
          style={{
            fontFamily: 'var(--font-dm-sans)',
            textShadow: '0 1px 4px rgba(0,0,0,0.7)',
          }}
        >
          SoulMio
        </span>
      </div>

      {!isLast && (
        <button
          onClick={onDone}
          className="absolute right-6 top-8 text-sm font-medium text-white/80 transition-colors hover:text-white md:right-10"
          style={{
            fontFamily: 'var(--font-dm-sans)',
            textShadow: '0 1px 4px rgba(0,0,0,0.7)',
          }}
        >
          {t('skip')}
        </button>
      )}

      {/* ─────────────────────────────────────────
          BOTTOM CONTENT — text + dots + buttons
      ───────────────────────────────────────── */}
      <div className="ob-content absolute inset-x-0 bottom-0 px-6 pb-[27px] md:px-14 md:pb-14">
        {/* Slide text cross-fade */}
        <div className="ob-text-box relative mb-7 min-h-[110px]">
          {SLIDES.map((s, i) => (
            <div
              key={s.key}
              className="absolute inset-0 flex flex-col justify-end transition-opacity duration-500"
              style={{
                opacity: i === current ? 1 : 0,
                pointerEvents: i === current ? 'auto' : 'none',
              }}
            >
              <h2
                className="ob-title mb-2.5 text-[1.9rem] leading-[1.08] text-white md:text-[2.25rem]"
                style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300 }}
              >
                {t(`${s.key}.title`)}
              </h2>
              <p
                className="max-w-sm text-[0.85rem] leading-relaxed text-white/60 md:text-base md:text-white/65"
                style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 400 }}
              >
                {t(`${s.key}.subtitle`)}
              </p>
            </div>
          ))}
        </div>

        {/* Dots + action button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setPaused(true) }}
                aria-label={`Slide ${i + 1}`}
                className="h-[5px] rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 24 : 6,
                  background:
                    i === current ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={onDone}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: '#E8735A', fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('getStarted')}
            </button>
          ) : (
            <button
              onClick={next}
              className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              aria-label="Next"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M6.5 4L11.5 9L6.5 14"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
