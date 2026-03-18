import { NextRequest, NextResponse } from 'next/server'

export interface PlaceResult {
  name: string | null
  address: string | null
  rating: number | null
}

/**
 * Разворачивает короткую ссылку goo.gl/maps.app.goo.gl, следуя редиректам,
 * и возвращает заголовок Location первого редиректа, который содержит
 * ?q=Название,+Адрес — гораздо полезнее, чем финальный URL.
 */
async function resolveGoogleShortUrl(url: string): Promise<PlaceResult> {
  const res = await fetch(url, {
    method: 'HEAD',
    redirect: 'manual', // не следовать — нужен заголовок Location
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  const location = res.headers.get('location') ?? ''

  // Заголовок Location: https://maps.google.com?q=Название,+Улица,+Город&ftid=...
  try {
    const parsed = new URL(location)
    const q = parsed.searchParams.get('q')
    if (q) {
      const decoded = decodeURIComponent(q.replace(/\+/g, ' '))
      // Разбить "Название, Улица, Город" → название — первый сегмент, остальное — адрес
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
      const name = decodeURIComponent(match[1].replace(/\+/g, ' '))
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
