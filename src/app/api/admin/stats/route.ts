import { NextResponse } from 'next/server'
import { requireAdmin } from '@/shared/lib/adminGuard'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

type Range = 'day' | 'week' | 'month' | 'year'

function getDateRange(range: Range): {
  start: Date
  prevStart: Date
  prevEnd: Date
} {
  const now = new Date()
  const start = new Date(now)
  const prevStart = new Date(now)
  const prevEnd = new Date(now)

  switch (range) {
    case 'day':
      start.setDate(start.getDate() - 1)
      prevStart.setDate(prevStart.getDate() - 2)
      prevEnd.setDate(prevEnd.getDate() - 1)
      break
    case 'week':
      start.setDate(start.getDate() - 7)
      prevStart.setDate(prevStart.getDate() - 14)
      prevEnd.setDate(prevEnd.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      prevStart.setMonth(prevStart.getMonth() - 2)
      prevEnd.setMonth(prevEnd.getMonth() - 1)
      break
    case 'year':
      start.setFullYear(start.getFullYear() - 1)
      prevStart.setFullYear(prevStart.getFullYear() - 2)
      prevEnd.setFullYear(prevEnd.getFullYear() - 1)
      break
  }

  return { start, prevStart, prevEnd }
}

export async function GET(request: Request) {
  const adminOrResponse = await requireAdmin()
  if (adminOrResponse instanceof Response) return adminOrResponse

  const { searchParams } = new URL(request.url)
  const range = (searchParams.get('range') ?? 'month') as Range

  // Используем базовый клиент с service role — обходит RLS и видит все строки
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { start, prevStart, prevEnd } = getDateRange(range)

  // Current period
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())

  const { count: proUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_tier', 'pro')

  // Prev period
  const { count: prevTotalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', start.toISOString())

  const { count: prevNewUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', prevStart.toISOString())
    .lt('created_at', prevEnd.toISOString())

  const { count: prevProUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_tier', 'pro')
    .lt('created_at', start.toISOString())

  // Chart data — registrations grouped by day/week
  const { data: chartRaw } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: true })

  // Group by date bucket
  const buckets: Record<string, number> = {}
  ;(chartRaw ?? []).forEach((row) => {
    const d = new Date(row.created_at)
    let key: string
    if (range === 'day') {
      key = d.toISOString().slice(0, 13) + ':00' // hour buckets
    } else if (range === 'week' || range === 'month') {
      key = d.toISOString().slice(0, 10) // day buckets
    } else {
      // year — week buckets
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      key = weekStart.toISOString().slice(0, 10)
    }
    buckets[key] = (buckets[key] ?? 0) + 1
  })

  const chartData = Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Platforms
  const { data: platformRaw } = await supabase
    .from('profiles')
    .select('platform')

  const platformCounts: Record<string, number> = {}
  ;(platformRaw ?? []).forEach((row) => {
    const p = row.platform ?? 'web'
    platformCounts[p] = (platformCounts[p] ?? 0) + 1
  })
  const platforms = Object.entries(platformCounts).map(([name, count]) => ({
    name,
    count,
  }))

  // Countries
  const { data: countryRaw } = await supabase
    .from('profiles')
    .select('country_code')

  const countryCounts: Record<string, number> = {}
  ;(countryRaw ?? []).forEach((row) => {
    if (row.country_code) {
      countryCounts[row.country_code] =
        (countryCounts[row.country_code] ?? 0) + 1
    }
  })
  const countries = Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([code, count]) => ({ code, count }))

  // Languages
  const { data: langRaw } = await supabase.from('profiles').select('language')

  const langCounts: Record<string, number> = {}
  ;(langRaw ?? []).forEach((row) => {
    if (row.language) {
      langCounts[row.language] = (langCounts[row.language] ?? 0) + 1
    }
  })
  const languages = Object.entries(langCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([lang, count]) => ({ lang, count }))

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    newUsers: newUsers ?? 0,
    proUsers: proUsers ?? 0,
    conversion: totalUsers
      ? +(((proUsers ?? 0) / totalUsers) * 100).toFixed(1)
      : 0,
    prevTotalUsers: prevTotalUsers ?? 0,
    prevNewUsers: prevNewUsers ?? 0,
    prevProUsers: prevProUsers ?? 0,
    chartData,
    platforms,
    countries,
    languages,
  })
}
