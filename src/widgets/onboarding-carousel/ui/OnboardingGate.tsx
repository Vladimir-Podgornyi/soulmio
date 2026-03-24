'use client'

import { useState, useEffect } from 'react'
import { OnboardingFullScreen } from './OnboardingFullScreen'

const STORAGE_KEY = 'soulmio_onboarded'

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'loading' | 'onboarding' | 'done'>('loading')

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    setPhase(seen ? 'done' : 'onboarding')
  }, [])

  function handleDone() {
    localStorage.setItem(STORAGE_KEY, '1')
    setPhase('done')
  }

  // Brief blank while localStorage is read — prevents flash of form before onboarding
  if (phase === 'loading') {
    return <div className="fixed inset-0 bg-black" />
  }

  if (phase === 'onboarding') {
    return <OnboardingFullScreen onDone={handleDone} />
  }

  return <>{children}</>
}
