import { NextResponse } from 'next/server'

interface ParseResult {
  title: string | null
  price: number | null
  imageUrl: string | null
}

/* ── Wildberries ───────────────────────────────────── */

function extractWbNm(url: string): string | null {
  const m = url.match(/wildberries\.ru\/catalog\/(\d+)/)
  return m?.[1] ?? null
}

/**
 * Basket index для CDN изображений WB.
 * Маппинг vol → basket (актуален на 2024–2025).
 */
function wbBasket(vol: number): number {
  if (vol <=  143) return  1
  if (vol <=  287) return  2
  if (vol <=  431) return  3
  if (vol <=  719) return  4
  if (vol <= 1007) return  5
  if (vol <= 1061) return  6
  if (vol <= 1115) return  7
  if (vol <= 1169) return  8
  if (vol <= 1313) return  9
  if (vol <= 1601) return 10
  if (vol <= 1655) return 11
  if (vol <= 1919) return 12
  if (vol <= 2045) return 13
  if (vol <= 2189) return 14
  if (vol <= 2399) return 15
  if (vol <= 2619) return 16
  if (vol <= 2759) return 17
  if (vol <= 2919) return 18
  if (vol <= 3099) return 19
  if (vol <= 3299) return 20
  if (vol <= 3499) return 21
  if (vol <= 3699) return 22
  if (vol <= 3999) return 23
  if (vol <= 4299) return 24
  if (vol <= 4599) return 25
  if (vol <= 4999) return 26
  if (vol <= 5299) return 27
  if (vol <= 5599) return 28
  if (vol <= 5899) return 29
  return 30
}

function wbImageUrl(nm: string): string {
  const n = parseInt(nm, 10)
  const vol = Math.floor(n / 100000)
  const part = Math.floor(n / 1000)
  const basket = String(wbBasket(vol)).padStart(2, '0')
  return `https://basket-${basket}.wbbasket.ru/vol${vol}/part${part}/${nm}/images/big/1.webp`
}

async function tryWildberries(nm: string): Promise<ParseResult> {
  type Products = { name?: string; salePriceU?: number; priceU?: number }[]

  function parseProducts(json: Record<string, unknown>): Products {
    return (
      ((json?.data as Record<string, unknown>)?.products as Products) ??
      ((json?.payload as Record<string, unknown>)?.products as Products) ??
      (json?.products as Products) ??
      []
    )
  }

  const WB_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    'Origin': 'https://www.wildberries.ru',
    'Referer': 'https://www.wildberries.ru/',
  }

  // Пробуем несколько известных эндпоинтов WB по очереди
  const endpoints = [
    `https://card.wb.ru/cards/v1/detail?nm=${nm}`,
    `https://card.wb.ru/cards/detail?nm=${nm}`,
    `https://wbx-content-v2.wbstatic.net/ru/${nm}.json`,
  ]

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: WB_HEADERS,
        signal: AbortSignal.timeout(6000),
      })

      console.log(`[WB] ${url} → ${res.status}`)

      if (!res.ok) continue

      const json = await res.json() as Record<string, unknown>
      const products = parseProducts(json)
      const p = products[0]

      if (p?.name) {
        const priceKopecks = p.salePriceU ?? p.priceU ?? null
        return {
          title: p.name,
          price: priceKopecks != null ? Math.round(priceKopecks / 100) : null,
          imageUrl: wbImageUrl(nm),
        }
      }
    } catch (err) {
      console.log(`[WB] ${url} → error:`, err)
    }
  }

  // Все API недоступны, но изображение через CDN может сработать
  return { title: null, price: null, imageUrl: wbImageUrl(nm) }
}

/* ── Yandex Market ─────────────────────────────────── */

/**
 * YM блокирует любые серверные запросы через CAPTCHA.
 * Вытаскиваем название товара из URL-слага — это лучше, чем ничего.
 * Пример: /card/smartfon-apple-iphone-17-pro-512gb → "Smartfon Apple Iphone 17 Pro 512Gb"
 */
function tryYandexMarketUrl(url: string): ParseResult {
  const m = url.match(/market\.yandex\.[a-z]+\/(?:card|product)\/([^/?#]+)/)
  if (!m) return { title: null, price: null, imageUrl: null }

  // Убираем финальный числовой ID если есть в slug
  const slug = m[1].replace(/-\d+$/, '')
  const title = slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return { title: title || null, price: null, imageUrl: null }
}

/* ── Meta-tag helpers ─────────────────────────────── */

function getMeta(html: string, ...properties: string[]): string | null {
  for (const prop of properties) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop}["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const m = html.match(pattern)
      if (m?.[1]) return decodeHtmlEntities(m[1])
    }
  }
  return null
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

/* ── Title extraction ─────────────────────────────── */

function extractTitle(html: string): string | null {
  const meta = getMeta(html, 'og:title', 'twitter:title')
  if (meta) return cleanTitle(meta)

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch?.[1]) return cleanTitle(decodeHtmlEntities(titleMatch[1].trim()))

  return null
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*[:\-|–]\s*(Amazon\.[a-z.]+|Yandex Market|eBay|AliExpress|Wildberries).*$/i, '')
    .replace(/\s*\|\s*.*$/, '')
    .trim()
}

/* ── Image extraction ─────────────────────────────── */

function extractImage(html: string): string | null {
  const meta = getMeta(html, 'og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src')
  if (meta) return normaliseUrl(meta)

  const patterns = [
    /"landingImageUrl"\s*:\s*"(https?:\/\/[^"]+)"/,
    /"hiRes"\s*:\s*"(https?:\/\/[^"]+)"/,
    /"dynamicImageUrl"\s*:\s*"(https?:\/\/[^"]+)"/,
    /"imageUrl"\s*:\s*"(https?:\/\/[^"]+)"/,
    /"largeImage"\s*:\s*"(https?:\/\/[^"]+)"/,
    /data-old-hires=["'](https?:\/\/[^"']+)["']/,
    /data-zoom-image=["'](https?:\/\/[^"']+)["']/,
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1]) return normaliseUrl(m[1])
  }

  return null
}

function normaliseUrl(url: string): string {
  if (url.startsWith('//')) return 'https:' + url
  return url
}

/* ── Price extraction ─────────────────────────────── */

function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null
  const str = String(raw).trim()

  const euMatch = str.match(/(\d[\d\s.]*),(\d{2})\s*[€$£₽]?$/)
  if (euMatch) {
    const num = parseFloat(euMatch[1].replace(/[\s.]/g, '') + '.' + euMatch[2])
    if (!isNaN(num) && num > 0) return num
  }

  const clean = str.replace(/[^\d.]/g, '')
  const num = parseFloat(clean)
  return !isNaN(num) && num > 0 ? num : null
}

function extractPrice(html: string): number | null {
  const metaRaw = getMeta(html, 'og:price:amount', 'product:price:amount')
  const metaPrice = parsePrice(metaRaw)
  if (metaPrice !== null) return metaPrice

  const jsonLdPrice = tryJsonLdPrice(html)
  if (jsonLdPrice !== null) return jsonLdPrice

  const scriptPatterns: RegExp[] = [
    /"priceAmount"\s*:\s*"?(\d+[.,]?\d*)["?,]/,
    /"finalPrice"\s*:\s*"?(\d+[.,]?\d*)["?,]/,
    /"salePrice"\s*:\s*"?(\d+[.,]?\d*)["?,]/,
    /"currentPrice"\s*:\s*"?(\d+[.,]?\d*)["?,]/,
    /"discountedPrice"\s*:\s*"?(\d+[.,]?\d*)["?,]/,
    /"regular_price"\s*:\s*"?(\d+[.,]?\d*)["?,]/,
    /"sale_price"\s*:\s*"?(\d+[.,]?\d*)["?,]/,
    /"price"\s*:\s*"(\d+[.,]?\d*)"/,
    /"price"\s*:\s*(\d+[.,]?\d*)\s*[,}]/,
    /data-price=["'](\d+[.,]?\d*)["']/,
    /itemprop=["']price["'][^>]+content=["'](\d+[.,]?\d*)["']/,
    /content=["'](\d+[.,]?\d*)["'][^>]+itemprop=["']price["']/,
    /"wholePriceInteger"\s*:\s*"?(\d+)"?/,
    /"buyingPrice"\s*:\s*"?(\d+[.,]?\d*)["?,]/,
  ]
  for (const p of scriptPatterns) {
    const m = html.match(p)
    if (m?.[1]) {
      const parsed = parsePrice(m[1])
      if (parsed !== null) return parsed
    }
  }

  return null
}

function tryJsonLdPrice(html: string): number | null {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1]) as Record<string, unknown>
      const candidates: Record<string, unknown>[] = Array.isArray(data['@graph'])
        ? (data['@graph'] as Record<string, unknown>[])
        : [data]
      for (const item of candidates) {
        const offers = item['offers']
        if (!offers || typeof offers !== 'object') continue
        const o = Array.isArray(offers)
          ? (offers as Record<string, unknown>[])[0]
          : (offers as Record<string, unknown>)
        const raw = o?.['price'] ?? o?.['lowPrice']
        const parsed = parsePrice(String(raw ?? ''))
        if (parsed !== null) return parsed
      }
    } catch { /* ignore */ }
  }
  return null
}

/* ── Main handler ─────────────────────────────────── */

export async function POST(req: Request) {
  try {
    const body = await req.json() as { url?: string }
    const url = body.url?.trim()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // ── Wildberries: специальный JSON API ──
    const wbNm = extractWbNm(url)
    if (wbNm) {
      const result = await tryWildberries(wbNm)
      // Возвращаем даже частичный результат (хотя бы изображение)
      if (result.title || result.price || result.imageUrl) {
        return NextResponse.json<ParseResult>(result)
      }
    }

    // ── Yandex Market: заголовок из URL-слага (HTML всегда заблокирован) ──
    if (url.includes('market.yandex.')) {
      return NextResponse.json<ParseResult>(tryYandexMarketUrl(url))
    }

    // ── Универсальный HTML-парсинг ──
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,de;q=0.8,ru;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    })

    if (!response.ok) {
      return NextResponse.json<ParseResult>({ title: null, price: null, imageUrl: null })
    }

    const html = await response.text()

    return NextResponse.json<ParseResult>({
      title: extractTitle(html),
      price: extractPrice(html),
      imageUrl: extractImage(html),
    })
  } catch {
    return NextResponse.json<ParseResult>({ title: null, price: null, imageUrl: null })
  }
}
