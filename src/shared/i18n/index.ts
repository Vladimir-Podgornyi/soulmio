// i18n setup — re-export next-intl utilities
export { useTranslations, useLocale } from 'next-intl'

export const locales = ['en', 'de', 'ru'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
