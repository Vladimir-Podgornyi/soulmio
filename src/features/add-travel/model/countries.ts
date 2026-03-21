export function getFlagEmoji(code: string): string {
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  )
}

export interface Country {
  code: string
  en: string
  de: string
  ru: string
}

export const COUNTRIES: Country[] = [
  { code: 'FR', en: 'France', de: 'Frankreich', ru: 'Франция' },
  { code: 'DE', en: 'Germany', de: 'Deutschland', ru: 'Германия' },
  { code: 'IT', en: 'Italy', de: 'Italien', ru: 'Италия' },
  { code: 'ES', en: 'Spain', de: 'Spanien', ru: 'Испания' },
  { code: 'GB', en: 'United Kingdom', de: 'Vereinigtes Königreich', ru: 'Великобритания' },
  { code: 'US', en: 'USA', de: 'USA', ru: 'США' },
  { code: 'JP', en: 'Japan', de: 'Japan', ru: 'Япония' },
  { code: 'CN', en: 'China', de: 'China', ru: 'Китай' },
  { code: 'TR', en: 'Turkey', de: 'Türkei', ru: 'Турция' },
  { code: 'TH', en: 'Thailand', de: 'Thailand', ru: 'Таиланд' },
  { code: 'GR', en: 'Greece', de: 'Griechenland', ru: 'Греция' },
  { code: 'PT', en: 'Portugal', de: 'Portugal', ru: 'Португалия' },
  { code: 'NL', en: 'Netherlands', de: 'Niederlande', ru: 'Нидерланды' },
  { code: 'CH', en: 'Switzerland', de: 'Schweiz', ru: 'Швейцария' },
  { code: 'AT', en: 'Austria', de: 'Österreich', ru: 'Австрия' },
  { code: 'CZ', en: 'Czech Republic', de: 'Tschechien', ru: 'Чехия' },
  { code: 'HU', en: 'Hungary', de: 'Ungarn', ru: 'Венгрия' },
  { code: 'PL', en: 'Poland', de: 'Polen', ru: 'Польша' },
  { code: 'RU', en: 'Russia', de: 'Russland', ru: 'Россия' },
  { code: 'AE', en: 'UAE', de: 'Vereinigte Arabische Emirate', ru: 'ОАЭ' },
  { code: 'EG', en: 'Egypt', de: 'Ägypten', ru: 'Египет' },
  { code: 'MA', en: 'Morocco', de: 'Marokko', ru: 'Марокко' },
  { code: 'IN', en: 'India', de: 'Indien', ru: 'Индия' },
  { code: 'VN', en: 'Vietnam', de: 'Vietnam', ru: 'Вьетнам' },
  { code: 'ID', en: 'Indonesia', de: 'Indonesien', ru: 'Индонезия' },
  { code: 'SG', en: 'Singapore', de: 'Singapur', ru: 'Сингапур' },
  { code: 'AU', en: 'Australia', de: 'Australien', ru: 'Австралия' },
  { code: 'NZ', en: 'New Zealand', de: 'Neuseeland', ru: 'Новая Зеландия' },
  { code: 'CA', en: 'Canada', de: 'Kanada', ru: 'Канада' },
  { code: 'MX', en: 'Mexico', de: 'Mexiko', ru: 'Мексика' },
  { code: 'BR', en: 'Brazil', de: 'Brasilien', ru: 'Бразилия' },
  { code: 'AR', en: 'Argentina', de: 'Argentinien', ru: 'Аргентина' },
  { code: 'CU', en: 'Cuba', de: 'Kuba', ru: 'Куба' },
  { code: 'HR', en: 'Croatia', de: 'Kroatien', ru: 'Хорватия' },
  { code: 'ME', en: 'Montenegro', de: 'Montenegro', ru: 'Черногория' },
  { code: 'RS', en: 'Serbia', de: 'Serbien', ru: 'Сербия' },
  { code: 'BG', en: 'Bulgaria', de: 'Bulgarien', ru: 'Болгария' },
  { code: 'RO', en: 'Romania', de: 'Rumänien', ru: 'Румыния' },
  { code: 'SK', en: 'Slovakia', de: 'Slowakei', ru: 'Словакия' },
  { code: 'SI', en: 'Slovenia', de: 'Slowenien', ru: 'Словения' },
  { code: 'SE', en: 'Sweden', de: 'Schweden', ru: 'Швеция' },
  { code: 'NO', en: 'Norway', de: 'Norwegen', ru: 'Норвегия' },
  { code: 'DK', en: 'Denmark', de: 'Dänemark', ru: 'Дания' },
  { code: 'FI', en: 'Finland', de: 'Finnland', ru: 'Финляндия' },
  { code: 'IS', en: 'Iceland', de: 'Island', ru: 'Исландия' },
  { code: 'BE', en: 'Belgium', de: 'Belgien', ru: 'Бельгия' },
  { code: 'IE', en: 'Ireland', de: 'Irland', ru: 'Ирландия' },
  { code: 'IL', en: 'Israel', de: 'Israel', ru: 'Израиль' },
  { code: 'GE', en: 'Georgia', de: 'Georgien', ru: 'Грузия' },
  { code: 'AM', en: 'Armenia', de: 'Armenien', ru: 'Армения' },
  { code: 'AZ', en: 'Azerbaijan', de: 'Aserbaidschan', ru: 'Азербайджан' },
  { code: 'KZ', en: 'Kazakhstan', de: 'Kasachstan', ru: 'Казахстан' },
  { code: 'UZ', en: 'Uzbekistan', de: 'Usbekistan', ru: 'Узбекистан' },
  { code: 'KR', en: 'South Korea', de: 'Südkorea', ru: 'Южная Корея' },
  { code: 'TW', en: 'Taiwan', de: 'Taiwan', ru: 'Тайвань' },
  { code: 'PH', en: 'Philippines', de: 'Philippinen', ru: 'Филиппины' },
  { code: 'MY', en: 'Malaysia', de: 'Malaysia', ru: 'Малайзия' },
  { code: 'LK', en: 'Sri Lanka', de: 'Sri Lanka', ru: 'Шри-Ланка' },
  { code: 'MV', en: 'Maldives', de: 'Malediven', ru: 'Мальдивы' },
  { code: 'CY', en: 'Cyprus', de: 'Zypern', ru: 'Кипр' },
  { code: 'MT', en: 'Malta', de: 'Malta', ru: 'Мальта' },
  { code: 'TN', en: 'Tunisia', de: 'Tunesien', ru: 'Тунис' },
  { code: 'ZA', en: 'South Africa', de: 'Südafrika', ru: 'ЮАР' },
  { code: 'KE', en: 'Kenya', de: 'Kenia', ru: 'Кения' },
  { code: 'TZ', en: 'Tanzania', de: 'Tansania', ru: 'Танзания' },
  { code: 'PE', en: 'Peru', de: 'Peru', ru: 'Перу' },
  { code: 'CO', en: 'Colombia', de: 'Kolumbien', ru: 'Колумбия' },
  { code: 'CL', en: 'Chile', de: 'Chile', ru: 'Чили' },
  { code: 'DO', en: 'Dominican Republic', de: 'Dominikanische Republik', ru: 'Доминиканская Республика' },
  { code: 'MU', en: 'Mauritius', de: 'Mauritius', ru: 'Маврикий' },
  { code: 'SC', en: 'Seychelles', de: 'Seychellen', ru: 'Сейшелы' },
  { code: 'LT', en: 'Lithuania', de: 'Litauen', ru: 'Литва' },
  { code: 'LV', en: 'Latvia', de: 'Lettland', ru: 'Латвия' },
  { code: 'EE', en: 'Estonia', de: 'Estland', ru: 'Эстония' },
  { code: 'BY', en: 'Belarus', de: 'Weissrussland', ru: 'Беларусь' },
]

export function searchCountries(query: string, locale: string): Country[] {
  if (query.length < 3) return []
  const q = query.toLowerCase()
  const key = (locale === 'ru' ? 'ru' : locale === 'de' ? 'de' : 'en') as 'en' | 'de' | 'ru'
  return COUNTRIES.filter(
    (c) =>
      c[key].toLowerCase().includes(q) ||
      c.en.toLowerCase().includes(q) ||
      c.ru.toLowerCase().includes(q) ||
      c.de.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
  ).slice(0, 8)
}
