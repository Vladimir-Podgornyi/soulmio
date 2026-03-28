'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/shared/api/supabase'

export type SubscriptionStatusType = 'pro_active' | 'grace' | 'free'

export interface SubscriptionStatus {
  isPro: boolean
  isGrace: boolean
  isFree: boolean
  daysLeft: number | null
  status: SubscriptionStatusType
}

export interface SubscriptionProfile {
  subscription_tier?: string | null
  subscription_ends_at?: string | null
  grace_period_ends_at?: string | null
}

const FREE_STATUS: SubscriptionStatus = {
  isPro: false,
  isGrace: false,
  isFree: true,
  daysLeft: null,
  status: 'free',
}

export function calcSubscriptionStatus(profile: SubscriptionProfile): SubscriptionStatus {
  const now = new Date()
  const endsAt = profile.subscription_ends_at ? new Date(profile.subscription_ends_at) : null
  const graceEndsAt = profile.grace_period_ends_at ? new Date(profile.grace_period_ends_at) : null
  const tier = profile.subscription_tier

  if (tier === 'pro') {
    // Legacy Pro user (set manually, no dates) — treat as active
    if (!endsAt && !graceEndsAt) {
      return { isPro: true, isGrace: false, isFree: false, daysLeft: null, status: 'pro_active' }
    }
    // Active subscription
    if (endsAt && endsAt > now) {
      return { isPro: true, isGrace: false, isFree: false, daysLeft: null, status: 'pro_active' }
    }
    // Grace period: subscription expired but grace hasn't
    if (graceEndsAt && graceEndsAt > now) {
      const ms = graceEndsAt.getTime() - now.getTime()
      const daysLeft = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
      return { isPro: true, isGrace: true, isFree: false, daysLeft, status: 'grace' }
    }
  }

  return { ...FREE_STATUS }
}

/**
 * Хук статуса подписки.
 *
 * Если передать profile (из серверного пропа) — вычисляется синхронно без Supabase запроса.
 * Если profile не передан — делает один запрос к Supabase.
 */
export function useSubscriptionStatus(profile?: SubscriptionProfile): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>(() =>
    profile ? calcSubscriptionStatus(profile) : FREE_STATUS
  )

  useEffect(() => {
    if (profile) return // уже вычислено из пропа
    const supabase = createClient()
    let cancelled = false

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return
      supabase
        .from('profiles')
        .select('subscription_tier, subscription_ends_at, grace_period_ends_at')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data && !cancelled) setStatus(calcSubscriptionStatus(data))
        })
    })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return status
}
