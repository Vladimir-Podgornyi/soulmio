'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ExternalLink, Star, MoreVertical, Pencil, ArrowRight, Plus, X } from 'lucide-react'
import { useCurrency, formatPrice } from '@/shared/lib/currency'
import type { ItemWithPerson } from '@/entities/item/api'
import type { Item } from '@/entities/item/model/types'
import type { Person } from '@/entities/person/model/types'
import { getGiftPinned, getGiftDate } from '@/features/add-gift'
import { AddGiftForm } from '@/features/add-gift'
import { getCuisineType, getFoodType } from '@/features/add-food'
import { AddFoodForm } from '@/features/add-food'
import { AddRestaurantForm } from '@/features/add-restaurant'
import { AddMovieForm, AddActorForm, getMovieGenres, getMovieReleaseDate, isActorItem } from '@/features/add-movie'
import { AddTravelForm, getTravelPinned, getTravelCity, getTravelCountry, getTravelDate, getTravelBudget } from '@/features/add-travel'
import { getFlagEmoji } from '@/features/add-travel'
import { AddCustomItemForm, getCustomItemLikesLabel, getCustomItemDislikesLabel } from '@/features/add-custom-item'

interface OverviewPageProps {
  category: string
  items: ItemWithPerson[]
  isPro: boolean
  people?: Person[]
  isCustom?: boolean
  categoryIcon?: string | null
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽️',
  restaurants: '🍴',
  gifts: '🎁',
  movies: '🎬',
  travel: '✈️',
}

const CATEGORY_GRADIENTS = [
  { key: 'gray',    gradient: 'linear-gradient(145deg, #2A2826, #3A3630)' },
  { key: 'coral',   gradient: 'linear-gradient(145deg, #7A3020, #B04228)' },
  { key: 'rose',    gradient: 'linear-gradient(145deg, #5C2240, #904060)' },
  { key: 'ocean',   gradient: 'linear-gradient(145deg, #182E48, #285078)' },
  { key: 'sage',    gradient: 'linear-gradient(145deg, #22382A, #345A40)' },
  { key: 'purple',  gradient: 'linear-gradient(145deg, #2A2230, #483060)' },
  { key: 'amber',   gradient: 'linear-gradient(145deg, #3A2A10, #5A4010)' },
  { key: 'teal',    gradient: 'linear-gradient(145deg, #1A3038, #205048)' },
  { key: 'crimson', gradient: 'linear-gradient(145deg, #5A1020, #8A2030)' },
  { key: 'indigo',  gradient: 'linear-gradient(145deg, #1A1A48, #283080)' },
  { key: 'olive',   gradient: 'linear-gradient(145deg, #2A3010, #405018)' },
  { key: 'brown',   gradient: 'linear-gradient(145deg, #3A2010, #5A3018)' },
  { key: 'pink',    gradient: 'linear-gradient(145deg, #4A1A3A, #703060)' },
  { key: 'mint',    gradient: 'linear-gradient(145deg, #183028, #285840)' },
  { key: 'slate',   gradient: 'linear-gradient(145deg, #1A2030, #283848)' },
  { key: 'gold',    gradient: 'linear-gradient(145deg, #3A3010, #605010)' },
]

function parseCategoryIconField(raw: string | null): { gradient: string; emoji: string } {
  const defaultGradient = CATEGORY_GRADIENTS[0].gradient
  if (!raw) return { gradient: defaultGradient, emoji: '📋' }
  const colonIdx = raw.indexOf(':')
  if (colonIdx > 0 && colonIdx <= 8) {
    const key = raw.slice(0, colonIdx)
    const found = CATEGORY_GRADIENTS.find((g) => g.key === key)
    if (found) return { gradient: found.gradient, emoji: raw.slice(colonIdx + 1) }
  }
  return { gradient: defaultGradient, emoji: raw }
}

type ValidCategory = 'food' | 'restaurants' | 'gifts' | 'movies' | 'travel'

export function OverviewPage({ category, items: initialItems, isPro, people = [], isCustom, categoryIcon }: OverviewPageProps) {
  const t = useTranslations()
  const { currency } = useCurrency()
  const router = useRouter()

  const [items, setItems] = useState<ItemWithPerson[]>(initialItems)
  const [editingItem, setEditingItem] = useState<ItemWithPerson | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const customParsed = isCustom ? parseCategoryIconField(categoryIcon ?? null) : null
  const icon = isCustom ? (customParsed?.emoji ?? '📋') : (CATEGORY_ICONS[category] ?? '📁')
  const isValidCategory = ['food', 'restaurants', 'gifts', 'movies', 'travel'].includes(category)
  const categoryLabel = isValidCategory
    ? t(`categories.${category as ValidCategory}`)
    : category

  const isGifts = category === 'gifts'
  const isFood = category === 'food'
  const isMovies = category === 'movies'
  const isTravel = category === 'travel'

  // Фильтр для кастомных категорий
  const [customFilter, setCustomFilter] = useState<'all' | 'likes' | 'dislikes'>('all')

  // Лейблы для кастомного фильтра: Pro — из тегов, Free — дефолт
  const customLikesLabel = (() => {
    if (!isCustom) return ''
    if (isPro) {
      const found = items.find((it) => getCustomItemLikesLabel(it.tags ?? null))
      const label = found ? getCustomItemLikesLabel(found.tags ?? null) : ''
      if (label) return label
    }
    return t('items.sentiments.likes')
  })()

  const customDislikesLabel = (() => {
    if (!isCustom) return ''
    if (isPro) {
      const found = items.find((it) => getCustomItemDislikesLabel(it.tags ?? null))
      const label = found ? getCustomItemDislikesLabel(found.tags ?? null) : ''
      if (label) return label
    }
    return t('items.sentiments.dislikes')
  })()

  // Закреплённые сверху для всех категорий
  const baseSorted = [...items].sort((a, b) => {
    const aPin = getGiftPinned(a.tags ?? null) || getTravelPinned(a.tags ?? null) ? 0 : 1
    const bPin = getGiftPinned(b.tags ?? null) || getTravelPinned(b.tags ?? null) ? 0 : 1
    return aPin - bPin
  })
  const sortedItems = isCustom && customFilter !== 'all'
    ? baseSorted.filter((it) => it.sentiment === customFilter)
    : baseSorted

  function handleItemUpdated(updated: Item) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === updated.id
          ? { ...it, ...updated }
          : it
      )
    )
    setEditingItem(null)
  }

  function getEditTitle() {
    if (isCustom) return t('common.edit')
    if (isFood) return t('food.edit')
    if (isGifts) return t('gifts.edit')
    if (isMovies) {
      if (editingItem && isActorItem(editingItem.tags ?? null)) return t('movies.editActor')
      return t('movies.edit')
    }
    if (isTravel) return t('travel.edit')
    return t('common.edit')
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-28">
      {/* Шапка */}
      <div className="px-4 pt-14 pb-5">
        <Link
          href="/dashboard"
          className="mb-4 flex items-center gap-1 text-sm text-text-secondary"
        >
          <ChevronLeft size={16} />
          {t('common.back')}
        </Link>

        <div className="flex items-center gap-3">
          {isCustom && customParsed ? (
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] text-2xl"
              style={{ background: customParsed.gradient }}
            >
              {icon}
            </div>
          ) : (
            <span className="text-3xl">{icon}</span>
          )}
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.5px] text-text-primary leading-tight">
              {categoryLabel}
            </h1>
            <p className="text-sm text-text-secondary">
              {t('dashboard.itemCount', { count: items.length })}
            </p>
          </div>
        </div>
      </div>

      {/* Фильтр — кастомные категории */}
      {isCustom && items.length > 0 && (
        <div className="flex gap-2 px-4 pb-4">
          {([
            { key: 'all' as const, label: t('gifts.filterAll') },
            { key: 'likes' as const, label: customLikesLabel },
            { key: 'dislikes' as const, label: customDislikesLabel },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCustomFilter(key)}
              className={`h-8 flex-shrink-0 rounded-[8px] px-3 text-xs font-medium transition-colors ${
                customFilter === key
                  ? 'bg-bg-input text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1.5 text-text-muted">
                  {items.filter((it) => it.sentiment === key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Список */}
      <div className="px-4 flex flex-col gap-2">
        {sortedItems.length === 0 ? (
          <div className="rounded-[20px] bg-bg-card border border-border-card px-6 py-10 text-center">
            <p className="text-2xl mb-2">{icon}</p>
            <p className="text-sm text-text-secondary">{t('dashboard.overviewEmpty')}</p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <OverviewItemCard
              key={item.id}
              item={item}
              category={category}
              currency={currency}
              onEdit={() => setEditingItem(item)}
              isCustom={isCustom}
              customLikesLabel={customLikesLabel}
              customDislikesLabel={customDislikesLabel}
              t={t}
            />
          ))
        )}
      </div>

      {/* Модальное окно редактирования */}
      {editingItem && (
        <BottomSheet title={getEditTitle()} onClose={() => setEditingItem(null)}>
          {isCustom ? (
            <AddCustomItemForm
              personId={editingItem.person_id}
              categoryId={editingItem.category_id}
              item={editingItem}
              isPro={isPro}
              onSuccess={handleItemUpdated}
              onCancel={() => setEditingItem(null)}
            />
          ) : isFood ? (
            <AddFoodForm
              personId={editingItem.person_id}
              categoryId={editingItem.category_id}
              item={editingItem}
              onSuccess={handleItemUpdated}
              onCancel={() => setEditingItem(null)}
            />
          ) : isGifts ? (
            <AddGiftForm
              personId={editingItem.person_id}
              categoryId={editingItem.category_id}
              item={editingItem}
              isPro={isPro}
              onSuccess={handleItemUpdated}
              onCancel={() => setEditingItem(null)}
            />
          ) : isMovies ? (
            isActorItem(editingItem.tags ?? null) ? (
              <AddActorForm
                personId={editingItem.person_id}
                categoryId={editingItem.category_id}
                item={editingItem}
                onSuccess={handleItemUpdated}
                onCancel={() => setEditingItem(null)}
              />
            ) : (
              <AddMovieForm
                personId={editingItem.person_id}
                categoryId={editingItem.category_id}
                item={editingItem}
                isPro={isPro}
                onSuccess={handleItemUpdated}
                onCancel={() => setEditingItem(null)}
              />
            )
          ) : isTravel ? (
            <AddTravelForm
              personId={editingItem.person_id}
              categoryId={editingItem.category_id}
              item={editingItem}
              isPro={isPro}
              onSuccess={handleItemUpdated}
              onCancel={() => setEditingItem(null)}
            />
          ) : (
            <AddRestaurantForm
              personId={editingItem.person_id}
              categoryId={editingItem.category_id}
              item={editingItem}
              onSuccess={handleItemUpdated}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </BottomSheet>
      )}

      {/* FAB — добавить запись */}
      {people.length > 0 && (
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg hover:bg-primary-dark active:scale-95 transition-all"
        >
          <Plus size={26} strokeWidth={2.5} className="text-white" />
        </button>
      )}

      {/* Модал выбора человека для добавления */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary pb-safe">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <span />
              <h2 className="text-base font-semibold tracking-[-0.3px] text-text-primary">
                {t('dashboard.selectPerson')}
              </h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2 px-6 pb-6">
              {people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    setAddOpen(false)
                    router.push(`/people/${person.id}?add=${encodeURIComponent(category)}`)
                  }}
                  className="flex items-center gap-3 rounded-[14px] bg-bg-card border border-border-card px-4 py-3 text-left transition-all hover:border-primary/40 active:scale-[0.98]"
                >
                  {person.avatar_url ? (
                    <img
                      src={person.avatar_url}
                      alt={person.name}
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/60 to-primary flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm">
                      {person.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold text-text-primary leading-tight">
                      {person.name}
                    </span>
                    {person.relation && (
                      <span className="text-xs text-text-secondary capitalize">
                        {(['partner', 'friend', 'family', 'other'] as string[]).includes(person.relation)
                          ? t(`people.relations.${person.relation}` as Parameters<typeof t>[0])
                          : person.relation}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Карточка элемента в обзоре ── */

interface OverviewItemCardProps {
  item: ItemWithPerson
  category: string
  currency: string
  onEdit: () => void
  isCustom?: boolean
  customLikesLabel?: string
  customDislikesLabel?: string
  t: ReturnType<typeof useTranslations>
}

function OverviewItemCard({ item, category, currency, onEdit, isCustom, customLikesLabel, customDislikesLabel, t }: OverviewItemCardProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isRestaurants = category === 'restaurants'
  const isGifts = category === 'gifts'
  const isFood = category === 'food'
  const isMovies = category === 'movies'
  const isTravel = category === 'travel'
  const isVisited = item.sentiment === 'visited'
  const isWants = item.sentiment === 'wants'
  const isLikes = item.sentiment === 'likes'

  const addressTag = item.tags?.find((tag) => tag.startsWith('📍'))
  const giftDate = isGifts ? getGiftDate(item.tags ?? null) : ''
  const isPinned = isGifts
    ? getGiftPinned(item.tags ?? null)
    : isTravel
    ? getTravelPinned(item.tags ?? null)
    : false
  const cuisineType = isFood ? getCuisineType(item.tags ?? null) : null
  const foodType = isFood ? getFoodType(item.tags ?? null) : null
  const movieGenres = isMovies ? getMovieGenres(item.tags ?? null) : []
  const movieReleaseDate = isMovies ? getMovieReleaseDate(item.tags ?? null) : ''
  const isActor = isMovies ? isActorItem(item.tags ?? null) : false
  const travelCity = isTravel ? getTravelCity(item.tags ?? null) : ''
  const travelCountry = isTravel ? getTravelCountry(item.tags ?? null) : { name: '', code: '' }
  const travelDate = isTravel ? getTravelDate(item.tags ?? null) : ''
  const travelBudget = isTravel ? getTravelBudget(item.tags ?? null) : null
  const flagEmoji = travelCountry.code ? getFlagEmoji(travelCountry.code) : ''

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  function goToList() {
    setMenuOpen(false)
    router.push(`/people/${item.person_id}?section=${category}`)
  }

  function handleEdit() {
    setMenuOpen(false)
    onEdit()
  }

  function sentimentLabel(): { text: string; cls: string } | null {
    if (!item.sentiment) return null
    if (isCustom) {
      if (item.sentiment === 'likes') {
        const label = customLikesLabel || t('items.sentiments.likes')
        return { text: `✅ ${label}`, cls: 'bg-loves-bg text-loves' }
      }
      if (item.sentiment === 'dislikes') {
        const label = customDislikesLabel || t('items.sentiments.dislikes')
        return { text: `❌ ${label}`, cls: 'bg-avoid-bg text-avoid' }
      }
      return null
    }
    if (isMovies) {
      const map: Record<string, { text: string; cls: string }> = {
        wants:    { text: `🎬 ${t('movies.statusWants')}`,    cls: 'bg-wants-bg text-wants' },
        likes:    { text: `✅ ${t('movies.statusLikes')}`,    cls: 'bg-loves-bg text-loves' },
        dislikes: { text: `❌ ${t('movies.statusDislikes')}`, cls: 'bg-avoid-bg text-avoid' },
      }
      return map[item.sentiment] ?? null
    }
    if (isTravel) {
      if (item.sentiment === 'visited') return { text: `✅ ${t('travel.statusVisited')}`, cls: 'bg-loves-bg text-loves' }
      if ((item.tags ?? []).includes('trip_booked:true')) return { text: `🎟️ ${t('travel.statusBooked')}`, cls: 'bg-[#2A2A1A] text-[#F0A500]' }
      return { text: `✈️ ${t('travel.statusWants')}`, cls: 'bg-wants-bg text-wants' }
    }
    const map: Record<string, { text: string; cls: string }> = {
      likes: {
        text: isGifts ? `✅ ${t('gifts.filterGifted')}` : t('items.sentiments.likes'),
        cls: 'bg-loves-bg text-loves',
      },
      dislikes: { text: t('items.sentiments.dislikes'), cls: 'bg-avoid-bg text-avoid' },
      wants: {
        text: isGifts ? `🎁 ${t('items.sentiments.wants')}` : t('items.sentiments.wants'),
        cls: 'bg-wants-bg text-wants',
      },
      visited: { text: t('items.sentiments.visited'), cls: 'bg-loves-bg text-loves' },
    }
    return map[item.sentiment] ?? null
  }

  const sentiment = sentimentLabel()

  function safeHostname(url: string): string {
    try { return new URL(url).hostname.replace('www.', '') }
    catch { return url }
  }

  return (
    <div className="rounded-[14px] bg-bg-card border border-border-card p-4">
      {/* Верхняя строка: изображение + контент + kebab */}
      <div className="flex gap-3">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-14 w-14 flex-shrink-0 rounded-[10px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5">
                {isPinned && <Star size={12} className="fill-primary text-primary flex-shrink-0 mt-[3px]" />}
                <span className="font-semibold text-text-primary leading-tight">
                  {item.title}
                </span>
              </div>

              {addressTag && (
                <p className="text-xs text-text-secondary mt-0.5">{addressTag}</p>
              )}
              {isFood && (foodType || cuisineType) && (
                <p className="text-xs text-text-secondary mt-0.5">{cuisineType ?? foodType}</p>
              )}
              {giftDate && (
                <p className="text-xs text-text-muted mt-0.5">
                  {new Date(giftDate).toLocaleDateString()}
                </p>
              )}
              {isMovies && isActor && (
                <p className="text-xs text-text-muted mt-1">👤 {t('movies.actorsTab')}</p>
              )}
              {isTravel && (travelCity || travelCountry.name || travelDate || travelBudget) && (
                <div className="flex flex-col gap-1 mt-1.5">
                  {(travelCity || travelCountry.name) && (
                    <p className="text-xs text-text-secondary">
                      {flagEmoji && <span className="mr-1">{flagEmoji}</span>}
                      {[travelCity, travelCountry.name].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {travelDate && (
                    <p className="text-xs text-text-muted">📅 {new Date(travelDate).toLocaleDateString()}</p>
                  )}
                  {travelBudget && (() => {
                    const b = item.sentiment === 'visited' ? travelBudget.actual : travelBudget.plan
                    const total = [b.hotel, b.transport, b.onsite, b.other]
                      .filter((v): v is number => v !== null)
                      .reduce((a, c) => a + c, 0)
                    return total > 0 ? (
                      <p className="text-xs text-text-muted">
                        {item.sentiment === 'visited' ? t('travel.actualBudget') : t('travel.planBudget')}: {total.toLocaleString()}
                      </p>
                    ) : null
                  })()}
                </div>
              )}
              {isMovies && !isActor && (movieGenres.length > 0 || item.my_rating !== null || item.partner_rating !== null || movieReleaseDate) && (
                <div className="flex flex-col gap-2 mt-2">
                  {movieGenres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {movieGenres.map((g) => (
                        <span key={g} className="rounded-[5px] bg-bg-input px-1.5 py-0.5 text-[10px] text-text-muted">
                          {t(`movies.genres.${g}` as Parameters<typeof t>[0])}
                        </span>
                      ))}
                    </div>
                  )}
                  {(item.my_rating !== null || item.partner_rating !== null) && (
                    <div className="flex gap-3">
                      {item.my_rating !== null && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase tracking-[0.08em] text-text-muted">{t('items.ratings.mine')}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={10} className={s <= (item.my_rating ?? 0) ? 'fill-primary text-primary' : 'text-border-card'} />
                            ))}
                          </div>
                        </div>
                      )}
                      {item.partner_rating !== null && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase tracking-[0.08em] text-text-muted">{t('items.ratings.partner')}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={10} className={s <= (item.partner_rating ?? 0) ? 'fill-primary text-primary' : 'text-border-card'} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {movieReleaseDate && (
                    <p className="text-xs text-text-muted">📅 {new Date(movieReleaseDate).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </div>

            {/* Kebab-меню */}
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-bg-hover transition-colors"
              >
                <MoreVertical size={15} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 min-w-[200px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
                  >
                    <Pencil size={14} className="text-text-secondary" />
                    {t('common.edit')}
                  </button>
                  <div className="mx-3 h-px bg-border-card" />
                  <button
                    type="button"
                    onClick={goToList}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
                  >
                    <ArrowRight size={14} className="text-text-secondary" />
                    {t('dashboard.goToList')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Описание */}
          {item.description && (
            <p className="mt-1.5 text-[13px] text-text-secondary leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Ресторан: рейтинги */}
          {isRestaurants && isVisited && (item.my_rating !== null || item.partner_rating !== null) && (
            <div className="flex gap-4 mt-2 pt-2 border-t border-border-card">
              {item.my_rating !== null && (
                <MiniRating label={t('items.ratings.mine')} value={item.my_rating} />
              )}
              {item.partner_rating !== null && (
                <MiniRating label={t('items.ratings.partner')} value={item.partner_rating} />
              )}
            </div>
          )}

        </div>
      </div>

      {/* Цена подарка — на уровне карточки, выровнена с остальным контентом */}
      {isGifts && item.price !== null && (
        <p className="mt-2 text-sm font-semibold text-text-primary">
          {formatPrice(item.price, currency)}
        </p>
      )}

      {/* Ссылка на товар (для подарков/ресторанов) */}
      {item.external_url && (
        <a
          href={item.external_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 mt-3 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <ExternalLink size={11} />
          {safeHostname(item.external_url)}
        </a>
      )}

      {/* Нижняя строка: персона + статус */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border-card">
        <Link
          href={`/people/${item.person_id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {item.personAvatar ? (
            <img
              src={item.personAvatar}
              alt={item.personName}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-white text-[9px] font-bold">
              {item.personName[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-xs text-text-muted">{item.personName}</span>
        </Link>

        {sentiment && (
          <span className={`flex-shrink-0 rounded-[8px] px-2.5 py-1 text-[11px] font-medium ${sentiment.cls}`}>
            {sentiment.text}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Мини рейтинг ── */

function MiniRating({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-[0.08em] text-text-muted">{label}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={10}
            className={s <= value ? 'fill-primary text-primary' : 'text-border-card'}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Bottom Sheet ── */

function BottomSheet({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary p-6 pb-safe max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-[-0.5px] text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
