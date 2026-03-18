// Конфигурация приложения — константы, переменные окружения
export const APP_NAME = 'Soulmio'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
} as const

export const FREE_PLAN_LIMITS = {
  MAX_PEOPLE: 1,
  MAX_CUSTOM_CATEGORIES: 2,
  MAX_AI_SUGGESTIONS_PER_MONTH: 3,
} as const

export const DEFAULT_CATEGORIES = ['food', 'restaurants', 'gifts', 'movies', 'travel'] as const
export const FREE_DEFAULT_CATEGORIES = ['food', 'restaurants', 'gifts'] as const
