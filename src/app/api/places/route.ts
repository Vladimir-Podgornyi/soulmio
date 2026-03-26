import { NextRequest, NextResponse } from 'next/server'

export interface PlaceResult {
  name: string | null
  address: string | null
  rating: number | null
}

/**
 * Разворачивает короткую ссылку maps.app.goo.gl / goo.gl/maps.
 *
 * Стратегия двух попыток:
 * 1. HEAD + redirect:manual → первый Location (мобильные ссылки дают ?q=Название,Адрес)
 * 2. GET + redirect:follow  → финальный URL   (десктопные ссылки дают /maps/place/Название/…)
 */
async function resolveGoogleShortUrl(url: string): Promise<PlaceResult> {
  // Попытка 1: первый редирект (работает для мобильных ссылок)
  try {
    const headRes = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const location = headRes.headers.get('location') ?? ''
    if (location) {
      const result = extractFromRegularUrl(location)
      if (result.name) return result
    }
  } catch {
    // игнорируем
  }

  // Попытка 2: следуем по всем редиректам до финального URL (десктопные ссылки)
  try {
    const getRes = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    const finalUrl = getRes.url
    if (finalUrl && finalUrl !== url) {
      const result = extractFromRegularUrl(finalUrl)
      if (result.name) return result
    }
  } catch {
    // игнорируем
  }

  return { name: null, address: null, rating: null }
}

function extractFromRegularUrl(url: string): PlaceResult {
  try {
    const parsed = new URL(url)

    // Apple Maps: https://maps.apple.com/?q=Название+места,+Адрес
    if (parsed.hostname.includes('apple.com')) {
      const q = parsed.searchParams.get('q')
      if (q) {
        const decoded = decodeURIComponent(q.replace(/\+/g, ' '))
        const commaIdx = decoded.indexOf(',')
        if (commaIdx !== -1) {
          return {
            name: decoded.slice(0, commaIdx).trim(),
            address: decoded.slice(commaIdx + 1).trim(),
            rating: null,
          }
        }
        return { name: decoded.trim(), address: null, rating: null }
      }
    }

    // Google Maps с параметром ?q=
    const q = parsed.searchParams.get('q')
    if (q) {
      const decoded = decodeURIComponent(q.replace(/\+/g, ' '))
      const commaIdx = decoded.indexOf(',')
      if (commaIdx !== -1) {
        return {
          name: decoded.slice(0, commaIdx).trim(),
          address: decoded.slice(commaIdx + 1).trim(),
          rating: null,
        }
      }
      return { name: decoded.trim(), address: null, rating: null }
    }

    // Путь Google Maps: /maps/place/<название>/...
    const match = parsed.pathname.match(/\/maps\/place\/([^/@]+)/)
    if (match?.[1]) {
      const name = decodeURIComponent(match[1].replace(/\+/g, ' ')).replace(/_/g, ' ')
      return { name, address: null, rating: null }
    }
  } catch {
    // некорректный URL
  }

  return { name: null, address: null, rating: null }
}

async function fetchGooglePlaceDetails(
  name: string,
  address: string | null,
  apiKey: string
): Promise<PlaceResult> {
  const query = address ? `${name} ${address}` : name
  const params = new URLSearchParams({
    input: query,
    inputtype: 'textquery',
    key: apiKey,
    fields: 'name,formatted_address,rating',
  })

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params}`
  )
  const json = await res.json() as {
    candidates?: Array<{
      name?: string
      formatted_address?: string
      rating?: number
    }>
  }

  const candidate = json.candidates?.[0]
  return {
    name: candidate?.name ?? name,
    address: candidate?.formatted_address ?? address,
    rating: candidate?.rating ?? null,
  }
}

export async function POST(req: NextRequest) {
  const { url } = (await req.json()) as { url: string }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }

  // Короткие ссылки Google Maps — разворачиваем через заголовок Location
  const isShortUrl =
    url.includes('maps.app.goo.gl') ||
    url.includes('goo.gl/maps')

  let result: PlaceResult

  if (isShortUrl) {
    try {
      result = await resolveGoogleShortUrl(url)
    } catch {
      return NextResponse.json({ name: null, address: null, rating: null })
    }
  } else {
    result = extractFromRegularUrl(url)
  }

  if (!result.name) {
    return NextResponse.json({ name: null, address: null, rating: null })
  }

  // Если задан ключ Google Places API — обогащаем рейтингом и каноническим адресом
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (apiKey) {
    try {
      return NextResponse.json(
        await fetchGooglePlaceDetails(result.name, result.address, apiKey)
      )
    } catch {
      // передаём управление дальше, возвращаем то, что есть
    }
  }

  return NextResponse.json(result)
}
