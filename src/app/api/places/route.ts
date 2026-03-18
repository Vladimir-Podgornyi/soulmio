import { NextRequest, NextResponse } from 'next/server'

export interface PlaceResult {
  name: string | null
  address: string | null
  rating: number | null
}

/**
 * Resolves a short goo.gl/maps.app.goo.gl URL by following redirects
 * and returns the Location header from the first redirect, which contains
 * ?q=Name,+Address — much more useful than the final resolved URL.
 */
async function resolveGoogleShortUrl(url: string): Promise<PlaceResult> {
  const res = await fetch(url, {
    method: 'HEAD',
    redirect: 'manual', // don't follow — we want the Location header
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  const location = res.headers.get('location') ?? ''

  // Location header: https://maps.google.com?q=Name,+Street,+City&ftid=...
  try {
    const parsed = new URL(location)
    const q = parsed.searchParams.get('q')
    if (q) {
      const decoded = decodeURIComponent(q.replace(/\+/g, ' '))
      // Split "Name, Street, City" → name is first segment, rest is address
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
    // ignore
  }

  return { name: null, address: null, rating: null }
}

function extractFromRegularUrl(url: string): PlaceResult {
  try {
    const parsed = new URL(url)

    // Apple Maps: https://maps.apple.com/?q=Place+Name,+Address
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

    // Google Maps with ?q= param
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

    // Google Maps path: /maps/place/<name>/...
    const match = parsed.pathname.match(/\/maps\/place\/([^/@]+)/)
    if (match?.[1]) {
      const name = decodeURIComponent(match[1].replace(/\+/g, ' '))
      return { name, address: null, rating: null }
    }
  } catch {
    // invalid URL
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

  // Short Google Maps links — resolve via Location header
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

  // If Google Places API key is set — enrich with rating and canonical address
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (apiKey) {
    try {
      return NextResponse.json(
        await fetchGooglePlaceDetails(result.name, result.address, apiKey)
      )
    } catch {
      // fall through to return what we have
    }
  }

  return NextResponse.json(result)
}
