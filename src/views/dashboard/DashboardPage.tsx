'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Gift, UtensilsCrossed, ExternalLink, X, Star, MapPin, Bell } from 'lucide-react'
import { createClient } from '@/shared/api/supabase'
import { updateItem } from '@/entities/item/api'
import { useCurrency, formatPrice } from '@/shared/lib/currency'
import type { Profile } from '@/entities/user/model/types'
import type { Person } from '@/entities/person/model/types'
import type { ItemCategorySummary, UpcomingGift, UpcomingRestaurant } from '@/entities/item/api'
import { QuickAddWidget } from '@/widgets/quick-add'

interface DashboardPageProps {
  profile: Profile
  people: Person[]
  summary: ItemCategorySummary[]
  upcomingGifts: UpcomingGift[]
  upcomingRestaurants: UpcomingRestaurant[]
}

type StatCard = {
  categoryName: string
  icon: string
  labelKey: string
  gradient: string
}

const STAT_CARDS: StatCard[] = [
  {
    categoryName: 'food',
    icon: '🍽️',
    labelKey: 'categories.food',
    gradient: 'linear-gradient(145deg, #7A3020, #B04228)',
  },
  {
    categoryName: 'restaurants',
    icon: '🍴',
    labelKey: 'categories.restaurants',
    gradient: 'linear-gradient(145deg, #22382A, #345A40)',
  },
  {
    categoryName: 'gifts',
    icon: '🎁',
    labelKey: 'categories.gifts',
    gradient: 'linear-gradient(145deg, #5C2240, #904060)',
  },
  {
    categoryName: 'movies',
    icon: '🎬',
    labelKey: 'categories.movies',
    gradient: 'linear-gradient(145deg, #182E48, #285078)',
  },
  {
    categoryName: 'travel',
    icon: '✈️',
    labelKey: 'categories.travel',
    gradient: 'linear-gradient(145deg, #2A2230, #483060)',
  },
]

export function DashboardPage({ profile, people, summary, upcomingGifts: initialGifts, upcomingRestaurants: initialRestaurants }: DashboardPageProps) {
  const t = useTranslations()
  const isPro = profile.subscription_tier === 'pro'
  const displayName = profile.full_name?.split(' ')[0] ?? profile.email ?? 'there'

  const [gifts, setGifts] = useState<UpcomingGift[]>(initialGifts)
  const [selectedGift, setSelectedGift] = useState<UpcomingGift | null>(null)
  const [restaurants, setRestaurants] = useState<UpcomingRestaurant[]>(initialRestaurants)
  const [selectedRestaurant, setSelectedRestaurant] = useState<UpcomingRestaurant | null>(null)

  const summaryMap = new Map(summary.map((s) => [s.categoryName, s.count]))
  const totalItems = summary.reduce((acc, s) => acc + s.count, 0)

  // Избранные сверху
  const sortedPeople = [...people].sort((a, b) => {
    if (a.is_favorite === b.is_favorite) return 0
    return a.is_favorite ? -1 : 1
  })

  function handleGiftBought(giftId: string) {
    setGifts((prev) => prev.filter((g) => g.itemId !== giftId))
    setSelectedGift(null)
  }

  function handleRestaurantDismiss(restaurantId: string) {
    setRestaurants((prev) => prev.filter((r) => r.itemId !== restaurantId))
    setSelectedRestaurant(null)
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-28">
      {/* Шапка с приветствием */}
      <div className="px-4 pt-14 pb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-text-muted mb-1">
          Soulmio
        </p>
        <h1 className="text-[30px] font-bold tracking-[-0.5px] text-text-primary">
          {t('dashboard.greeting', { name: displayName })}
        </h1>
        {totalItems > 0 && (
          <p className="mt-1 text-sm text-text-secondary">
            {t('dashboard.itemCount', { count: totalItems })}
          </p>
        )}
      </div>

      {/* Напоминания — только для Pro */}
      {isPro ? (
        <>
          {gifts.length > 0 && (
            <section className="px-4 mb-5">
              {gifts.map((gift) => (
                <button
                  key={gift.itemId}
                  type="button"
                  onClick={() => setSelectedGift(gift)}
                  className="w-full flex items-center gap-3 rounded-[16px] bg-[#2A1A10] border border-primary/20 px-4 py-3.5 mb-2 hover:border-primary/40 transition-colors text-left"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20" suppressHydrationWarning>
                    <Gift size={18} className="text-primary" suppressHydrationWarning />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-0.5">
                      {t('dashboard.giftReminder')}
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">{gift.title}</p>
                    <p className="text-xs text-text-secondary">
                      {t('dashboard.giftReminderFor', { name: gift.personName })}
                      {' · '}
                      {t('dashboard.giftReminderDays', { days: gift.daysLeft })}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          )}

          {restaurants.length > 0 && (
            <section className="px-4 mb-5">
              {restaurants.map((restaurant) => (
                <button
                  key={restaurant.itemId}
                  type="button"
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className="w-full flex items-center gap-3 rounded-[16px] bg-[#1A2818] border border-[#345A40]/40 px-4 py-3.5 mb-2 hover:border-[#345A40]/70 transition-colors text-left"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#345A40]/30" suppressHydrationWarning>
                    <UtensilsCrossed size={18} className="text-[#5CBD8A]" suppressHydrationWarning />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#5CBD8A] mb-0.5">
                      {t('restaurants.reminder')}
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">{restaurant.title}</p>
                    <p className="text-xs text-text-secondary">
                      {t('dashboard.giftReminderFor', { name: restaurant.personName })}
                      {' · '}
                      {t('dashboard.giftReminderDays', { days: restaurant.daysLeft })}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          )}
        </>
      ) : (
        <section className="px-4 mb-5">
          <div className="flex items-center gap-3 rounded-[16px] border border-dashed border-border px-4 py-3">
            <Bell size={15} className="text-text-muted flex-shrink-0" suppressHydrationWarning />
            <p className="text-xs text-text-muted leading-snug">
              {t('dashboard.remindersProHint')}
            </p>
          </div>
        </section>
      )}

      {/* Обзор — stat cards */}
      <section className="px-4 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-3">
          {t('dashboard.overview')}
        </h2>

        {totalItems === 0 ? (
          <div className="rounded-[20px] bg-bg-card border border-border-card px-6 py-8 text-center">
            <p className="text-2xl mb-2">✨</p>
            <p className="text-sm text-text-secondary">{t('dashboard.noStats')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {STAT_CARDS.filter((card) => summaryMap.has(card.categoryName)).map((card) => {
              const count = summaryMap.get(card.categoryName) ?? 0
              return (
                <Link
                  key={card.categoryName}
                  href={`/overview/${card.categoryName}`}
                  className="relative overflow-hidden rounded-[20px] p-4 min-h-[120px] flex flex-col justify-between active:scale-[0.97] transition-transform"
                  style={{ background: card.gradient }}
                  suppressHydrationWarning
                >
                  <span className="absolute -right-2 -bottom-2 text-[56px] opacity-20 select-none pointer-events-none">
                    {card.icon}
                  </span>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    suppressHydrationWarning
                  >
                    {t(card.labelKey as Parameters<typeof t>[0])}
                  </p>
                  <div>
                    <p
                      className="text-[30px] font-bold leading-none tracking-[-1px]"
                      style={{ color: '#fff' }}
                      suppressHydrationWarning
                    >
                      {count}
                    </p>
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                      suppressHydrationWarning
                    >
                      {t('dashboard.itemCount', { count })}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Ваши люди — избранные первыми */}
      {sortedPeople.length > 0 && (
        <section className="px-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-3">
            {t('dashboard.yourPeople')}
          </h2>
          <div className="flex flex-col gap-2">
            {sortedPeople.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="flex items-center gap-3 rounded-[14px] bg-bg-card border border-border-card px-4 py-3 transition-all hover:border-primary/30"
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-text-primary leading-tight">{person.name}</p>
                    {person.is_favorite && (
                      <Star size={12} className="fill-primary text-primary flex-shrink-0" />
                    )}
                  </div>
                  {person.relation && (
                    <p className="text-xs text-text-secondary capitalize">
                      {['partner', 'friend', 'family', 'other'].includes(person.relation)
                        ? t(`people.relations.${person.relation}` as Parameters<typeof t>[0])
                        : person.relation}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAB — быстрое добавление */}
      <QuickAddWidget people={people} isPro={isPro} />

      {/* Модальное окно подарка */}
      {selectedGift && (
        <GiftDetailModal
          gift={selectedGift}
          onClose={() => setSelectedGift(null)}
          onBought={handleGiftBought}
        />
      )}

      {/* Модальное окно ресторана */}
      {selectedRestaurant && (
        <RestaurantReminderModal
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          onDismiss={handleRestaurantDismiss}
        />
      )}
    </div>
  )
}

/* ── Модальное окно с деталями подарка ── */

interface GiftDetailModalProps {
  gift: UpcomingGift
  onClose: () => void
  onBought: (giftId: string) => void
}

function GiftDetailModal({ gift, onClose, onBought }: GiftDetailModalProps) {
  const t = useTranslations()
  const { currency } = useCurrency()
  const [isMarking, setIsMarking] = useState(false)

  async function handleAlreadyBought() {
    setIsMarking(true)
    try {
      const supabase = createClient()
      await updateItem(supabase, gift.itemId, { sentiment: 'likes' })
      onBought(gift.itemId)
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary pb-safe overflow-hidden">
        {/* Фото подарка */}
        {gift.imageUrl && (
          <div className="w-full h-48 bg-bg-card overflow-hidden">
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}

        {/* Контент */}
        <div className="px-6 pt-5 pb-6">
          {/* Хэдер */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                {t('dashboard.giftReminder')} · {t('dashboard.giftReminderFor', { name: gift.personName })}
              </p>
              <h2 className="text-lg font-bold tracking-[-0.3px] text-text-primary leading-tight">
                {gift.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover"
            >
              <X size={16} />
            </button>
          </div>

          {/* Срок */}
          <div className="flex items-center gap-2 mb-4">
            <Gift size={14} className="text-primary flex-shrink-0" />
            <p className="text-sm text-text-secondary">
              {t('dashboard.giftReminderDays', { days: gift.daysLeft })}
              {gift.giftDate && (
                <span className="ml-1 text-text-muted">
                  ({new Date(gift.giftDate).toLocaleDateString()})
                </span>
              )}
            </p>
          </div>

          {/* Цена */}
          {gift.price !== null && (
            <p className="text-base font-semibold text-text-primary mb-3">
              {formatPrice(gift.price, currency)}
            </p>
          )}

          {/* Описание */}
          {gift.description && (
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {gift.description}
            </p>
          )}

          {/* Ссылка на товар */}
          {gift.externalUrl && (
            <a
              href={gift.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-[12px] border border-border-card bg-bg-card px-4 py-3 text-sm text-text-secondary hover:border-primary/30 transition-colors mb-4"
            >
              <ExternalLink size={15} className="text-text-muted flex-shrink-0" />
              <span className="flex-1 truncate">{gift.externalUrl}</span>
            </a>
          )}

          {/* Кнопка "Уже купил" */}
          <button
            type="button"
            onClick={handleAlreadyBought}
            disabled={isMarking}
            className="w-full rounded-[12px] bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
          >
            {isMarking ? t('dashboard.giftMarkingBought') : t('dashboard.giftAlreadyBought')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Модальное окно напоминания о ресторане ── */

interface RestaurantReminderModalProps {
  restaurant: UpcomingRestaurant
  onClose: () => void
  onDismiss: (restaurantId: string) => void
}

function RestaurantReminderModal({ restaurant, onClose, onDismiss }: RestaurantReminderModalProps) {
  const t = useTranslations()
  const [isActing, setIsActing] = useState(false)
  const [action, setAction] = useState<'booked' | 'mind' | null>(null)

  async function handleAlreadyBooked() {
    setIsActing(true)
    setAction('booked')
    try {
      const supabase = createClient()
      const newTags = [
        ...restaurant.tags.filter((tag) => !tag.startsWith('visit_booked')),
        'visit_booked:true',
      ]
      await updateItem(supabase, restaurant.itemId, { tags: newTags })
      onDismiss(restaurant.itemId)
    } finally {
      setIsActing(false)
      setAction(null)
    }
  }

  async function handleChangedMind() {
    setIsActing(true)
    setAction('mind')
    try {
      const supabase = createClient()
      const newTags = restaurant.tags.filter((tag) => !tag.startsWith('visit_date:'))
      await updateItem(supabase, restaurant.itemId, { tags: newTags })
      onDismiss(restaurant.itemId)
    } finally {
      setIsActing(false)
      setAction(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary pb-safe overflow-hidden">
        <div className="px-6 pt-5 pb-6">
          {/* Хэдер */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5CBD8A] mb-1">
                {t('restaurants.reminder')} · {t('dashboard.giftReminderFor', { name: restaurant.personName })}
              </p>
              <h2 className="text-lg font-bold tracking-[-0.3px] text-text-primary leading-tight">
                {restaurant.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover"
            >
              <X size={16} />
            </button>
          </div>

          {/* Срок */}
          <div className="flex items-center gap-2 mb-3">
            <UtensilsCrossed size={14} className="text-[#5CBD8A] flex-shrink-0" />
            <p className="text-sm text-text-secondary">
              {t('dashboard.giftReminderDays', { days: restaurant.daysLeft })}
              {restaurant.visitDate && (
                <span className="ml-1 text-text-muted">
                  ({new Date(restaurant.visitDate).toLocaleDateString()})
                </span>
              )}
            </p>
          </div>

          {/* Адрес */}
          {restaurant.address && (
            <div className="flex items-start gap-2 mb-3">
              <MapPin size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">{restaurant.address}</p>
            </div>
          )}

          {/* Комментарий */}
          {restaurant.comment && (
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {restaurant.comment}
            </p>
          )}

          {/* Кнопки */}
          <div className="flex flex-col gap-2 mt-4">
            {/* Забронировать — открывает Google Maps */}
            {restaurant.externalUrl ? (
              <a
                href={restaurant.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-[12px] bg-bg-card border border-border-card py-3.5 text-sm font-semibold text-text-primary hover:border-primary/30 transition-colors"
              >
                <ExternalLink size={15} />
                {t('restaurants.bookTable')}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full rounded-[12px] bg-bg-card border border-border-card py-3.5 text-sm font-semibold text-text-muted opacity-40 cursor-not-allowed"
              >
                {t('restaurants.bookTable')}
              </button>
            )}

            {/* Уже забронировал */}
            <button
              type="button"
              onClick={handleAlreadyBooked}
              disabled={isActing}
              className="w-full rounded-[12px] bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
            >
              {isActing && action === 'booked' ? t('restaurants.markingBooked') : t('restaurants.alreadyBooked')}
            </button>

            {/* Передумал идти */}
            <button
              type="button"
              onClick={handleChangedMind}
              disabled={isActing}
              className="w-full rounded-[12px] border border-border py-3.5 text-sm font-medium text-text-secondary hover:bg-bg-hover disabled:opacity-60 transition-colors"
            >
              {isActing && action === 'mind' ? t('restaurants.markingMind') : t('restaurants.changedMind')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
