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
import { getVisitTime } from '@/features/add-restaurant'
import { AddGiftForm } from '@/features/add-gift'
import { BottomSheet } from '@/shared/ui/BottomSheet'
import { getCuisineType, getFoodType, getLinkedRestaurant } from '@/features/add-food'
import { AddFoodForm } from '@/features/add-food'
import { AddRestaurantForm } from '@/features/add-restaurant'
import { AddMovieForm, AddActorForm, getMovieGenres, getMovieReleaseDate, isActorItem, getActorFilms } from '@/features/add-movie'
import { AddTravelForm, getTravelPinned, getTravelCity, getTravelCountry, getTravelDate, getTravelBudget, getFlagEmoji, type TravelBudget } from '@/features/add-travel'
import { AddCustomItemForm, getCustomItemLikesLabel, getCustomItemDislikesLabel, getCustomItemDate } from '@/features/add-custom-item'
import { parseCategoryIconField } from '@/entities/category/model/categoryIcon'

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

type ValidCategory = 'food' | 'restaurants' | 'gifts' | 'movies' | 'travel'

export function OverviewPage({ category, items: initialItems, isPro, people = [], isCustom, categoryIcon }: OverviewPageProps) {
  const t = useTranslations()
  const { currency } = useCurrency()
  const router = useRouter()

  const [items, setItems] = useState<ItemWithPerson[]>(initialItems)
  const [editingItem, setEditingItem] = useState<ItemWithPerson | null>(null)
  const [previewItem, setPreviewItem] = useState<ItemWithPerson | null>(null)
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
      <div className="stagger-list px-4 flex flex-col gap-2">
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
              onPreview={() => setPreviewItem(item)}
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

      {/* Превью элемента */}
      {previewItem && (
        <OverviewItemPreviewSheet
          item={previewItem}
          category={category}
          isCustom={isCustom ?? false}
          customLikesLabel={customLikesLabel}
          customDislikesLabel={customDislikesLabel}
          onClose={() => setPreviewItem(null)}
          onEdit={() => { const it = previewItem; setPreviewItem(null); setEditingItem(it) }}
          t={t}
        />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-[28px] bg-bg-secondary pb-safe">
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

/* ── Секция бюджета путешествия (overview) ── */

function OverviewBudgetSection({
  label, budget, total, currency, t,
}: {
  label: string
  budget: TravelBudget
  total: number
  currency: string
  t: ReturnType<typeof useTranslations>
}) {
  const rows = [
    { key: t('travel.budgetHotel'),     amount: budget.hotel },
    { key: t('travel.budgetTransport'), amount: budget.transport },
    { key: t('travel.budgetOnsite'),    amount: budget.onsite },
    { key: t('travel.budgetOther'),     amount: budget.other },
    ...budget.customItems.map((ci) => ({ key: ci.label, amount: ci.amount })),
  ].filter((r) => r.amount != null && r.amount > 0)

  return (
    <div className="rounded-xl p-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-card)' }}>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">{label}</p>
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-2">
          <span className="text-xs text-text-secondary">{r.key}</span>
          <span className="text-xs font-medium text-text-primary">{formatPrice(r.amount!, currency as Parameters<typeof formatPrice>[1])}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-2 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs font-semibold text-text-primary">{t('travel.budgetTotal')}</span>
        <span className="text-sm font-bold text-text-primary">{formatPrice(total, currency as Parameters<typeof formatPrice>[1])}</span>
      </div>
    </div>
  )
}

/* ── Превью элемента в обзоре ── */

function OverviewItemPreviewSheet({
  item,
  category,
  isCustom,
  customLikesLabel,
  customDislikesLabel,
  onClose,
  onEdit,
  t,
}: {
  item: ItemWithPerson
  category: string
  isCustom: boolean
  customLikesLabel: string
  customDislikesLabel: string
  onClose: () => void
  onEdit: () => void
  t: ReturnType<typeof useTranslations>
}) {
  const { currency } = useCurrency()

  const isRestaurants = category === 'restaurants'
  const isGifts       = category === 'gifts'
  const isFood        = category === 'food'
  const isMovies      = category === 'movies'
  const isTravel      = category === 'travel'
  const isActor       = isMovies && isActorItem(item.tags ?? null)

  const sStyle =
    item.sentiment === 'likes' || item.sentiment === 'visited'
      ? { backgroundColor: 'var(--loves-bg)', color: 'var(--loves-text)' }
      : item.sentiment === 'dislikes'
      ? { backgroundColor: 'var(--avoid-bg)', color: 'var(--avoid-text)' }
      : item.sentiment === 'wants' && isTravel
      ? { backgroundColor: 'var(--travel-wants-bg)', color: 'var(--travel-wants-text)' }
      : item.sentiment === 'wants'
      ? { backgroundColor: 'var(--wants-bg)', color: 'var(--wants-text)' }
      : null

  const sentimentLabel = (() => {
    if (isCustom) {
      if (item.sentiment === 'likes') return customLikesLabel || t('items.sentiments.likes')
      if (item.sentiment === 'dislikes') return customDislikesLabel || t('items.sentiments.dislikes')
    }
    if (item.sentiment === 'likes') return isGifts ? t('gifts.filterGifted') : t('items.sentiments.likes')
    if (item.sentiment === 'dislikes') return t('items.sentiments.dislikes')
    if (item.sentiment === 'wants') return isTravel ? `✈️ ${t('travel.statusWants')}` : t('items.sentiments.wants')
    if (item.sentiment === 'visited') return isTravel ? `✅ ${t('travel.statusVisited')}` : t('items.sentiments.visited')
    return ''
  })()

  const tags = item.tags ?? []
  const restaurantAddress = tags.find(tg => tg.startsWith('📍'))?.slice(2).trim() ?? null
  const visitDate = tags.find(tg => tg.startsWith('visit_date:'))?.replace('visit_date:', '') ?? null
  const visitTime = isRestaurants ? getVisitTime(item.tags ?? null) : ''
  const visitBooked = tags.includes('visit_booked:true')

  const movieGenreKeys = isMovies && !isActor ? getMovieGenres(item.tags ?? null) : []
  const releaseDate = isMovies && !isActor ? getMovieReleaseDate(item.tags ?? null) : null
  const actorFilms  = isActor ? getActorFilms(item.tags ?? null) : []

  const travelCountryObj = isTravel ? getTravelCountry(item.tags ?? null) : null
  const travelCity    = isTravel ? getTravelCity(item.tags ?? null) : ''
  const travelCountry = travelCountryObj?.name ?? ''
  const countryCode   = travelCountryObj?.code ?? ''
  const tripDate      = isTravel ? getTravelDate(item.tags ?? null) : null
  const tripBooked    = tags.includes('trip_booked:true')
  const travelBudgetData = isTravel ? getTravelBudget(item.tags ?? null) : null

  function budgetTotal(b: TravelBudget): number {
    return [b.hotel, b.transport, b.onsite, b.other]
      .reduce<number>((s, v) => s + (v ?? 0), 0)
      + b.customItems.reduce<number>((s, ci) => s + (ci.amount ?? 0), 0)
  }
  const hasPlan   = isTravel && travelBudgetData != null && budgetTotal(travelBudgetData.plan)   > 0
  const hasActual = isTravel && travelBudgetData != null && budgetTotal(travelBudgetData.actual) > 0

  const giftDate   = isGifts  ? getGiftDate(item.tags ?? null) : null
  const customDate = isCustom ? getCustomItemDate(item.tags ?? null) : null
  const linkedRestaurant = isFood ? getLinkedRestaurant(item.tags ?? null) : null
  const foodType   = isFood ? getFoodType(item.tags ?? null) : null
  const cuisineType = isFood ? getCuisineType(item.tags ?? null) : null

  return (
    <BottomSheet title={item.title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Человек */}
        <Link
          href={`/people/${item.person_id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {item.personAvatar ? (
            <img src={item.personAvatar} alt={item.personName} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-white text-[10px] font-bold">
              {item.personName[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-text-secondary">{item.personName}</span>
          <ArrowRight size={12} className="text-text-muted" />
        </Link>

        {/* Sentiment badge */}
        {sStyle && sentimentLabel && (
          <div>
            <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={sStyle}>
              {sentimentLabel}
            </span>
          </div>
        )}

        {/* Image */}
        {item.image_url && (
          <div className="w-full overflow-hidden rounded-[14px]" style={{ backgroundColor: 'var(--bg-card)' }}>
            <img src={item.image_url} alt={item.title} className="w-full object-contain" style={{ maxHeight: '260px' }} />
          </div>
        )}

        {/* Description */}
        {item.description && (
          <p className="text-sm leading-relaxed text-text-secondary">{item.description}</p>
        )}

        {/* Ratings */}
        {(item.my_rating != null || item.partner_rating != null) && (
          <div className="flex gap-6">
            {item.my_rating != null && (
              <div>
                <p className="mb-1 text-xs text-text-muted">{t('movies.myRating')}</p>
                <span className="text-amber-400">{'★'.repeat(item.my_rating)}</span>
                <span className="text-text-muted">{'★'.repeat(5 - item.my_rating)}</span>
              </div>
            )}
            {item.partner_rating != null && (
              <div>
                <p className="mb-1 text-xs text-text-muted">{t('movies.partnerRating')}</p>
                <span className="text-amber-400">{'★'.repeat(item.partner_rating)}</span>
                <span className="text-text-muted">{'★'.repeat(5 - item.partner_rating)}</span>
              </div>
            )}
          </div>
        )}

        {/* Price */}
        {item.price != null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{t('gifts.price')}:</span>
            <span className="text-sm font-medium text-text-primary">{formatPrice(item.price, currency)}</span>
          </div>
        )}

        {/* Restaurant */}
        {isRestaurants && restaurantAddress && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5">📍</span>
            <span className="text-sm text-text-secondary">{restaurantAddress}</span>
          </div>
        )}
        {isRestaurants && visitDate && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              {t('restaurants.visitDate')}
            </span>
            <span className={`font-medium ${visitTime ? 'text-base text-text-primary' : 'text-sm text-text-secondary'}`}>
              {new Date(visitDate + 'T00:00').toLocaleDateString()}
              {visitTime && <span className="ml-2">⏰ {visitTime}</span>}
            </span>
            {visitBooked && <span className="text-xs font-medium" style={{ color: 'var(--loves-text)' }}>✓ {t('restaurants.alreadyBooked')}</span>}
          </div>
        )}

        {/* Food */}
        {isFood && (foodType || cuisineType) && (
          <p className="text-sm text-text-secondary">
            {[foodType
              ? (foodType === 'dish' ? `🍽️ ${t('food.types.dish')}` : foodType === 'cuisine' ? `🍜 ${t('food.types.cuisine')}` : `🥗 ${t('food.types.food_type')}`)
              : null, cuisineType].filter(Boolean).join(' · ')}
          </p>
        )}
        {isFood && linkedRestaurant && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">🍴</span>
            <span className="text-sm text-text-secondary">{linkedRestaurant.name}</span>
          </div>
        )}

        {/* Gift date */}
        {isGifts && giftDate && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{t('gifts.date')}:</span>
            <span className="text-sm text-text-secondary">{giftDate}</span>
          </div>
        )}

        {/* Movies */}
        {isMovies && !isActor && movieGenreKeys.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {movieGenreKeys.map(g => (
              <span key={g} className="rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                {t(`movies.genres.${g}` as Parameters<typeof t>[0])}
              </span>
            ))}
          </div>
        )}
        {isMovies && !isActor && releaseDate && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{t('movies.releaseDate')}:</span>
            <span className="text-sm text-text-secondary">{releaseDate}</span>
          </div>
        )}
        {isActor && actorFilms.length > 0 && (
          <div className="space-y-1.5">
            {actorFilms.map((film, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-text-muted">🎬</span>
                <span className="text-sm text-text-secondary">{film}</span>
              </div>
            ))}
          </div>
        )}

        {/* Travel */}
        {isTravel && (travelCity || travelCountry) && (
          <div className="flex items-center gap-3">
            {countryCode && <span className="text-3xl">{getFlagEmoji(countryCode)}</span>}
            <div>
              {travelCity    && <p className="text-sm font-medium text-text-primary">{travelCity}</p>}
              {travelCountry && <p className="text-xs text-text-muted">{travelCountry}</p>}
            </div>
          </div>
        )}
        {isTravel && tripDate && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">{t('travel.tripDate')}:</span>
            <span className="text-sm text-text-secondary">{tripDate}</span>
            {tripBooked && <span className="text-xs font-medium" style={{ color: 'var(--loves-text)' }}>✓ {t('travel.statusBooked')}</span>}
          </div>
        )}

        {/* Travel: budget */}
        {hasPlan && travelBudgetData && (
          <OverviewBudgetSection label={t('travel.planBudget')} budget={travelBudgetData.plan} total={budgetTotal(travelBudgetData.plan)} currency={currency} t={t} />
        )}
        {hasActual && travelBudgetData && (
          <OverviewBudgetSection label={t('travel.actualBudget')} budget={travelBudgetData.actual} total={budgetTotal(travelBudgetData.actual)} currency={currency} t={t} />
        )}

        {/* Custom date */}
        {isCustom && customDate && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">📅</span>
            <span className="text-sm text-text-secondary">{customDate}</span>
          </div>
        )}

        {/* External link */}
        {item.external_url && (
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          >
            <ExternalLink size={14} />
            <span className="truncate">{item.external_url.replace(/^https?:\/\//, '').split('/')[0]}</span>
          </a>
        )}

        {/* Edit button */}
        <button
          onClick={onEdit}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {t('common.edit')}
        </button>
      </div>
    </BottomSheet>
  )
}

/* ── Карточка элемента в обзоре ── */

interface OverviewItemCardProps {
  item: ItemWithPerson
  category: string
  currency: string
  onEdit: () => void
  onPreview: () => void
  isCustom?: boolean
  customLikesLabel?: string
  customDislikesLabel?: string
  t: ReturnType<typeof useTranslations>
}

function OverviewItemCard({ item, category, currency, onEdit, onPreview, isCustom, customLikesLabel, customDislikesLabel, t }: OverviewItemCardProps) {
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
  const restVisitDate = !isGifts && !isFood && !isMovies && !isTravel && !isCustom
    ? item.tags?.find((tg) => tg.startsWith('visit_date:'))?.replace('visit_date:', '') ?? null
    : null
  const restVisitTime = category === 'restaurants' ? getVisitTime(item.tags ?? null) : ''
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
      if ((item.tags ?? []).includes('trip_booked:true')) return { text: `🎟️ ${t('travel.statusBooked')}`, cls: 'bg-wants-bg text-wants' }
      return { text: `✈️ ${t('travel.statusWants')}`, cls: 'bg-[var(--travel-wants-bg)] text-[var(--travel-wants-text)]' }
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
    <div
      className={`item-card rounded-[14px] bg-bg-card border border-border-card p-4 cursor-pointer${menuOpen ? ' relative z-[60]' : ''}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        const interactive = (e.target as Element).closest('button, a, input, [role="button"]')
        if (interactive && interactive !== e.currentTarget) return
        onPreview()
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') onPreview() }}
    >
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
              {restVisitDate && (
                <p className="text-xs text-text-muted mt-0.5">
                  📅 {restVisitDate}{restVisitTime && ` · ⏰ ${restVisitTime}`}
                </p>
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
                    const total = [b.hotel, b.transport, b.onsite, b.other, ...b.customItems.map(i => i.amount)]
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
                <div className="absolute right-0 top-8 z-50 min-w-[200px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
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

