import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, type Locale, locales } from './index'

function parseAcceptLanguage(header: string): Locale {
  // Парсим "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6"
  // → берём первую поддерживаемую локаль
  const preferred = header
    .split(',')
    .map((part) => {
      const [lang, q] = part.trim().split(';q=')
      return { lang: lang.split('-')[0].toLowerCase(), q: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
    .map((item) => item.lang)

  return (preferred.find((lang) => (locales as readonly string[]).includes(lang)) as Locale) ?? defaultLocale
}

// Статическая карта импортов — обязательно для Turbopack (импорты через шаблонные строки не работают)
async function loadMessages(locale: Locale) {
  switch (locale) {
    case 'de':
      return (await import('../../../messages/de.json')).default
    case 'ru':
      return (await import('../../../messages/ru.json')).default
    default:
      return (await import('../../../messages/en.json')).default
  }
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  // Приоритет: 1) явная кука (пользователь вручную сменил язык)
  //            2) заголовок браузера Accept-Language
  //            3) откат на английский
  const cookieLocale = cookieStore.get('locale')?.value
  const acceptLanguage = headerStore.get('accept-language') ?? ''

  let locale: Locale
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    locale = cookieLocale as Locale
  } else if (acceptLanguage) {
    locale = parseAcceptLanguage(acceptLanguage)
  } else {
    locale = defaultLocale
  }

  return {
    locale,
    messages: await loadMessages(locale),
  }
})
