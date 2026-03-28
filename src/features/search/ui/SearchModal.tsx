'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X, User, Folder, Loader2, Lock } from 'lucide-react'
import { parseCategoryIconField } from '@/entities/category/model/categoryIcon'
import { PaywallModal } from '@/shared/ui/PaywallModal'
import type { PaywallFeature } from '@/shared/ui/PaywallModal'
import { useSearch } from '../model/useSearch'
import type { SearchResult } from '../api'

const DEFAULT_CATEGORY_EMOJIS: Record<string, string> = {
  restaurants: '🍽️',
  gifts: '🎁',
  movies: '🎬',
  food: '🥗',
  travel: '✈️',
}

interface SearchModalProps {
  userId: string
  onClose: () => void
}

export function SearchModal({ userId, onClose }: SearchModalProps) {
  const t = useTranslations()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery, results, loading, reset } = useSearch(userId)

  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallFeature, setPaywallFeature] = useState<PaywallFeature>('movies')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Блокируем скролл страницы когда поиск открыт
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSelect(r: SearchResult) {
    if (r.isLocked) {
      setPaywallFeature((r.lockedFeature as PaywallFeature) ?? 'movies')
      setPaywallOpen(true)
      return
    }
    reset()
    onClose()
    router.push(r.href)
  }

  function getCategoryDisplayTitle(name: string): string {
    const keys = { restaurants: 1, food: 1, gifts: 1, movies: 1, travel: 1 } as const
    if (name in keys) {
      return t(`categories.${name as keyof typeof keys}`)
    }
    return name
  }

  function getItemIcon(icon: string | null, categoryName?: string): string {
    if (icon && !icon.includes(':')) return icon
    if (icon) {
      const { emoji } = parseCategoryIconField(icon)
      return emoji
    }
    if (categoryName) {
      return DEFAULT_CATEGORY_EMOJIS[categoryName] ?? '📋'
    }
    return '📋'
  }

  const people = results.filter((r) => r.type === 'person')
  const categories = results.filter((r) => r.type === 'category')
  const items = results.filter((r) => r.type === 'item')

  function ResultRow({
    r,
    icon,
    displayTitle,
    displaySubtitle,
  }: {
    r: SearchResult
    icon: React.ReactNode
    displayTitle?: string
    displaySubtitle?: string
  }) {
    const title = displayTitle ?? r.title
    const subtitle = displaySubtitle ?? r.subtitle
    return (
      <button
        key={r.id}
        onClick={() => handleSelect(r)}
        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left ${r.isLocked ? 'opacity-60' : ''}`}
      >
        <div className="relative flex-shrink-0">
          {icon}
          {r.isLocked && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-bg-secondary flex items-center justify-center">
              <Lock size={9} className="text-text-muted" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary truncate">{title}</p>
          {subtitle && (
            <p className="text-xs text-text-muted truncate">{subtitle}</p>
          )}
        </div>
        {r.isLocked && (
          <Lock size={12} className="text-text-muted flex-shrink-0" />
        )}
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-0 z-50 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-6 md:w-full md:max-w-lg px-0 md:px-4">
        <div className="bg-bg-secondary border-b border-border md:border md:rounded-[20px] shadow-2xl md:overflow-hidden">
          {/* Input row */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search size={18} className="text-text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="flex-1 bg-transparent text-[15px] text-text-primary placeholder:text-text-muted outline-none"
            />
            {loading && (
              <Loader2 size={16} className="text-text-muted animate-spin flex-shrink-0" />
            )}
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto pb-safe">
            {!query.trim() && (
              <p className="px-4 py-6 text-center text-sm text-text-muted">
                {t('search.hint')}
              </p>
            )}

            {query.trim() && !loading && results.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-text-muted">
                {t('search.noResults')}
              </p>
            )}

            {people.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-widest text-text-muted font-medium">
                  {t('search.sectionPeople')}
                </p>
                {people.map((r) => (
                  <ResultRow
                    key={r.id}
                    r={r}
                    icon={
                      <div className="w-9 h-9 rounded-full bg-bg-input flex items-center justify-center">
                        <User size={16} className="text-text-secondary" />
                      </div>
                    }
                  />
                ))}
              </div>
            )}

            {categories.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-widest text-text-muted font-medium">
                  {t('search.sectionCategories')}
                </p>
                {categories.map((r) => {
                  const emoji = r.icon ? getItemIcon(r.icon) : null
                  return (
                    <ResultRow
                      key={r.id}
                      r={r}
                      displayTitle={getCategoryDisplayTitle(r.title)}
                      icon={
                        <div className="w-9 h-9 rounded-[10px] bg-bg-input flex items-center justify-center text-base">
                          {emoji ?? <Folder size={16} className="text-text-secondary" />}
                        </div>
                      }
                    />
                  )
                })}
              </div>
            )}

            {items.length > 0 && (
              <div className="pb-2">
                <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-widest text-text-muted font-medium">
                  {t('search.sectionItems')}
                </p>
                {items.map((r) => {
                  const emoji = getItemIcon(r.icon, r.categoryName)
                  // Пересобираем subtitle с переведённым именем категории
                  const personPart = r.subtitle.split(' · ')[0]
                  const translatedSubtitle = r.categoryName
                    ? `${personPart} · ${getCategoryDisplayTitle(r.categoryName)}`
                    : r.subtitle
                  return (
                    <ResultRow
                      key={r.id}
                      r={r}
                      displaySubtitle={translatedSubtitle}
                      icon={
                        <div className="w-9 h-9 rounded-[10px] bg-bg-input flex items-center justify-center text-base">
                          {emoji}
                        </div>
                      }
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <PaywallModal
        open={paywallOpen}
        feature={paywallFeature}
        onClose={() => setPaywallOpen(false)}
      />
    </>
  )
}
