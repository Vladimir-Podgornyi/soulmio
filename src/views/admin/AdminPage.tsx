'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  TrendingUp,
  Users,
  UserPlus,
  Crown,
  BarChart2,
} from 'lucide-react'

type Range = 'day' | 'week' | 'month' | 'year'

interface StatsData {
  totalUsers: number
  newUsers: number
  proUsers: number
  conversion: number
  prevTotalUsers: number
  prevNewUsers: number
  prevProUsers: number
  chartData: { date: string; count: number }[]
  platforms: { name: string; count: number }[]
  countries: { code: string; count: number }[]
  languages: { lang: string; count: number }[]
}

interface PromoCode {
  id: string
  code: string
  discountLabel: string
  timesRedeemed: number
  active: boolean
  expiresAt: string | null
}

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('')
}

function langLabel(lang: string): string {
  const map: Record<string, string> = {
    en: 'English',
    de: 'Deutsch',
    ru: 'Русский',
    fr: 'Français',
    es: 'Español',
    pt: 'Português',
  }
  return map[lang] ?? lang.toUpperCase()
}

function platformLabel(name: string): string {
  const map: Record<string, string> = {
    web: '🌐 Web',
    ios: '🍎 iOS App Store',
    android: '🤖 Google Play',
  }
  return map[name] ?? name
}

function platformColor(name: string): string {
  if (name === 'ios') return '#4A90A4'
  if (name === 'android') return '#639922'
  return '#E8735A'
}

function formatDiff(
  current: number,
  prev: number
): { text: string; positive: boolean } {
  if (prev === 0)
    return { text: current > 0 ? '+∞%' : '0%', positive: current > 0 }
  const pct = (((current - prev) / prev) * 100).toFixed(1)
  const positive = current >= prev
  return { text: `${positive ? '+' : ''}${pct}%`, positive }
}

function BarChartSVG({
  data,
}: {
  data: { date: string; count: number }[]
}) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Нет данных
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.count), 1)
  const barWidth = Math.max(4, Math.floor(300 / data.length) - 2)
  const svgWidth = data.length * (barWidth + 3)
  const svgHeight = 120

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full"
      style={{ height: svgHeight }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8735A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E8735A" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const h = Math.max(3, (d.count / max) * (svgHeight - 10))
        const x = i * (barWidth + 3)
        const y = svgHeight - h
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={2}
            fill="url(#barGrad)"
          />
        )
      })}
    </svg>
  )
}

function MetricCard({
  label,
  value,
  diff,
  icon: Icon,
}: {
  label: string
  value: string
  diff?: { text: string; positive: boolean }
  icon: React.ElementType
}) {
  return (
    <div className="admin-metric-card bg-bg-card border border-border-card rounded-[16px] p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.08em] text-text-secondary font-medium">
          {label}
        </span>
        <Icon size={16} className="text-text-muted" />
      </div>
      <span className="text-[28px] font-semibold tracking-[-1px] text-text-primary leading-none">
        {value}
      </span>
      {diff && (
        <span
          className={`text-xs font-medium ${diff.positive ? 'text-green-500' : 'text-red-500'}`}
        >
          {diff.text} к прошлому периоду
        </span>
      )}
    </div>
  )
}

function HorizontalBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-sm text-text-secondary w-[120px] shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-2 bg-bg-input rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm text-text-primary font-medium w-10 text-right shrink-0">
        {value.toLocaleString()}
      </span>
    </div>
  )
}

export function AdminPage() {
  const [range, setRange] = useState<Range>('month')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async (r: Range) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/stats?range=${r}`)
      if (res.ok) {
        const data: StatsData = await res.json()
        setStats(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats(range)
  }, [range, fetchStats])

  useEffect(() => {
    fetch('/api/admin/promo')
      .then((r) => (r.ok ? r.json() : { promoCodes: [] }))
      .then((d) => setPromos(d.promoCodes ?? []))
      .catch(() => {})
  }, [])

  const ranges: { value: Range; label: string }[] = [
    { value: 'day', label: 'День' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'year', label: 'Год' },
  ]

  const maxPlatform = Math.max(
    ...(stats?.platforms.map((p) => p.count) ?? [1]),
    1
  )
  const maxCountry = Math.max(
    ...(stats?.countries.map((c) => c.count) ?? [1]),
    1
  )
  const maxLang = Math.max(
    ...(stats?.languages.map((l) => l.count) ?? [1]),
    1
  )

  return (
    <div className="admin-page max-w-[1100px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-[12px] bg-bg-input flex items-center justify-center">
          <ShieldCheck size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-[-0.5px]">
            Панель администратора
          </h1>
          <p className="text-sm text-text-secondary">Обзор платформы</p>
        </div>
      </div>

      {/* Time filter */}
      <div className="admin-range-filter flex gap-2 mb-6">
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-4 py-2 rounded-[8px] text-sm font-medium transition-colors ${
              range === r.value
                ? 'bg-primary text-white'
                : 'bg-bg-input text-text-secondary hover:text-text-primary'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-bg-card border border-border-card rounded-[16px] p-5 h-[110px] animate-pulse"
            />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MetricCard
              label="Всего пользователей"
              value={stats.totalUsers.toLocaleString()}
              diff={formatDiff(stats.totalUsers, stats.prevTotalUsers)}
              icon={Users}
            />
            <MetricCard
              label="Новые регистрации"
              value={stats.newUsers.toLocaleString()}
              diff={formatDiff(stats.newUsers, stats.prevNewUsers)}
              icon={UserPlus}
            />
            <MetricCard
              label="Pro подписчики"
              value={stats.proUsers.toLocaleString()}
              diff={formatDiff(stats.proUsers, stats.prevProUsers)}
              icon={Crown}
            />
            <MetricCard
              label="Конверсия Free→Pro"
              value={`${stats.conversion}%`}
              icon={BarChart2}
            />
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Registrations chart */}
            <div className="admin-chart-card bg-bg-card border border-border-card rounded-[16px] p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-primary" />
                <span className="text-sm font-medium text-text-primary">
                  Регистрации
                </span>
              </div>
              <div className="h-[130px] flex items-end">
                <BarChartSVG data={stats.chartData} />
              </div>
            </div>

            {/* Platforms */}
            <div className="admin-platforms-card bg-bg-card border border-border-card rounded-[16px] p-5">
              <p className="text-sm font-medium text-text-primary mb-4">
                Платформы
              </p>
              <div className="flex flex-col gap-2">
                {stats.platforms.length === 0 ? (
                  <p className="text-sm text-text-muted">Нет данных</p>
                ) : (
                  stats.platforms.map((p) => (
                    <HorizontalBar
                      key={p.name}
                      label={platformLabel(p.name)}
                      value={p.count}
                      max={maxPlatform}
                      color={platformColor(p.name)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Countries + Languages */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Countries */}
            <div className="admin-countries-card bg-bg-card border border-border-card rounded-[16px] p-5">
              <p className="text-sm font-medium text-text-primary mb-4">
                Топ стран
              </p>
              <div className="flex flex-col gap-2">
                {stats.countries.length === 0 ? (
                  <p className="text-sm text-text-muted">Пока нет данных</p>
                ) : (
                  stats.countries.map((c) => (
                    <HorizontalBar
                      key={c.code}
                      label={`${countryCodeToFlag(c.code)} ${c.code}`}
                      value={c.count}
                      max={maxCountry}
                      color="#E8735A"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Languages */}
            <div className="admin-languages-card bg-bg-card border border-border-card rounded-[16px] p-5">
              <p className="text-sm font-medium text-text-primary mb-4">
                Языки интерфейса
              </p>
              <div className="flex flex-col gap-2">
                {stats.languages.length === 0 ? (
                  <p className="text-sm text-text-muted">Пока нет данных</p>
                ) : (
                  stats.languages.map((l) => (
                    <HorizontalBar
                      key={l.lang}
                      label={langLabel(l.lang)}
                      value={l.count}
                      max={maxLang}
                      color="#4A90A4"
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Promo codes */}
      <div className="admin-promo-card bg-bg-card border border-border-card rounded-[16px] p-5">
        <p className="text-sm font-medium text-text-primary mb-4">
          Промокоды
        </p>
        {promos.length === 0 ? (
          <p className="text-sm text-text-muted">
            Промокоды не найдены (Stripe не настроен или коды отсутствуют)
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {promos.map((pc) => (
              <div
                key={pc.id}
                className="flex items-center gap-4 py-2 border-b border-border last:border-0"
              >
                <code className="admin-promo-code bg-bg-input px-3 py-1 rounded-full text-sm font-mono text-text-primary">
                  {pc.code}
                </code>
                <span className="text-sm text-text-secondary flex-1">
                  {pc.discountLabel}
                </span>
                <span className="text-sm text-text-muted">
                  {pc.timesRedeemed}&times; использован
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    pc.active
                      ? 'bg-[#E6F5ED] text-[#2E7A4A] dark:bg-[#1E3028] dark:text-[#5CBD8A]'
                      : 'bg-[#FEF4E0] text-[#9A6A00] dark:bg-[#2E2A18] dark:text-[#F0A830]'
                  }`}
                >
                  {pc.active ? 'Активен' : 'Истёк'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
