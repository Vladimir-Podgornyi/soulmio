'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'

export const CURRENCIES = ['EUR', 'USD', 'RUB', 'GBP', 'CHF'] as const
export type CurrencyCode = (typeof CURRENCIES)[number]

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  RUB: '₽',
  GBP: '£',
  CHF: 'Fr.',
}

const LOCALE_DEFAULT_CURRENCY: Record<string, string> = {
  en: 'USD',
  de: 'EUR',
  ru: 'RUB',
}

const STORAGE_KEY = 'soulmio_currency'
const MANUAL_KEY  = 'soulmio_currency_manual'

export function useCurrency() {
  const locale = useLocale()
  const localDefault = LOCALE_DEFAULT_CURRENCY[locale] ?? 'EUR'

  const [currency, setCurrencyState] = useState<string>(localDefault)

  useEffect(() => {
    const isManual = localStorage.getItem(MANUAL_KEY) === 'true'
    const stored   = localStorage.getItem(STORAGE_KEY)

    if (isManual && stored && CURRENCIES.includes(stored as CurrencyCode)) {
      // Пользователь выбирал валюту вручную — оставляем её
      setCurrencyState(stored)
    } else {
      // Нет ручного выбора — следуем языку
      setCurrencyState(localDefault)
    }
  }, [localDefault]) // пересчитывается при смене локали

  function setCurrency(c: string) {
    localStorage.setItem(STORAGE_KEY, c)
    localStorage.setItem(MANUAL_KEY, 'true')
    setCurrencyState(c)
  }

  const symbol = CURRENCY_SYMBOLS[currency] ?? currency

  return { currency, symbol, setCurrency }
}

export function formatPrice(price: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency
  const formatted = price.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  if (currency === 'RUB') return `${formatted} ${sym}`
  return `${sym}${formatted}`
}
