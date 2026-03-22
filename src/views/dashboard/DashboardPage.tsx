'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Gift, UtensilsCrossed, ExternalLink, X, Star, MapPin, Bell, ChevronRight } from 'lucide-react'
import { createClient } from '@/shared/api/supabase'
import { updateItem } from '@/entities/item/api'
import { useCurrency, formatPrice } from '@/shared/lib/currency'
import type { Profile } from '@/entities/user/model/types'
import type { Person } from '@/entities/person/model/types'
import type { ItemCategorySummary, UpcomingGift, UpcomingRestaurant, UpcomingMovie, UpcomingTrip, UpcomingCustomItem } from '@/entities/item/api'
import { QuickAddWidget } from '@/widgets/quick-add'
import { parseCategoryIconField } from '@/views/person/PersonPage'

interface DashboardPageProps {
  profile: Profile
  people: Person[]
  summary: ItemCategorySummary[]
  upcomingGifts: UpcomingGift[]
  upcomingRestaurants: UpcomingRestaurant[]
  upcomingMovies: UpcomingMovie[]
  upcomingTrips: UpcomingTrip[]
  upcomingCustomItems: UpcomingCustomItem[]
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

export function DashboardPage({ profile, people, summary, upcomingGifts: initialGifts, upcomingRestaurants: initialRestaurants, upcomingMovies: initialMovies, upcomingTrips: initialTrips, upcomingCustomItems: initialCustomItems }: DashboardPageProps) {
  const t = useTranslations()
  const isPro = profile.subscription_tier === 'pro'
  const displayName = profile.full_name?.split(' ')[0] ?? profile.email ?? 'there'

  const [gifts, setGifts] = useState<UpcomingGift[]>(initialGifts)
  const [selectedGift, setSelectedGift] = useState<UpcomingGift | null>(null)
  const [restaurants, setRestaurants] = useState<UpcomingRestaurant[]>(initialRestaurants)
  const [selectedRestaurant, setSelectedRestaurant] = useState<UpcomingRestaurant | null>(null)
  const [movies, setMovies] = useState<UpcomingMovie[]>(initialMovies)
  const [selectedMovie, setSelectedMovie] = useState<UpcomingMovie | null>(null)
  const [trips, setTrips] = useState<UpcomingTrip[]>(initialTrips)
  const [selectedTrip, setSelectedTrip] = useState<UpcomingTrip | null>(null)
  const [customItems, setCustomItems] = useState<UpcomingCustomItem[]>(initialCustomItems)
  const [selectedCustomItem, setSelectedCustomItem] = useState<UpcomingCustomItem | null>(null)

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

  function handleMovieDismiss(movieId: string) {
    setMovies((prev) => prev.filter((m) => m.itemId !== movieId))
    setSelectedMovie(null)
  }

  function handleTripDismiss(tripId: string) {
    setTrips((prev) => prev.filter((tr) => tr.itemId !== tripId))
    setSelectedTrip(null)
  }

  function handleRestaurantDismiss(restaurantId: string) {
    setRestaurants((prev) => prev.filter((r) => r.itemId !== restaurantId))
    setSelectedRestaurant(null)
  }

  function handleCustomItemDismiss(itemId: string) {
    setCustomItems((prev) => prev.filter((ci) => ci.itemId !== itemId))
    setSelectedCustomItem(null)
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

          {movies.length > 0 && (
            <section className="px-4 mb-5">
              {movies.map((movie) => (
                <button
                  key={movie.itemId}
                  type="button"
                  onClick={() => setSelectedMovie(movie)}
                  className="w-full flex items-center gap-3 rounded-[16px] bg-[#182E48] border border-[#285078]/40 px-4 py-3.5 mb-2 hover:border-[#285078]/70 transition-colors text-left"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#285078]/30 text-lg">
                    🎬
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#4A90A4] mb-0.5">
                      {t('movies.releaseReminder')}
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">{movie.title}</p>
                    <p className="text-xs text-text-secondary">
                      {t('dashboard.giftReminderFor', { name: movie.personName })}
                      {' · '}
                      {t('dashboard.giftReminderDays', { days: movie.daysLeft })}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          )}

          {trips.length > 0 && (
            <section className="px-4 mb-5">
              {trips.map((trip) => (
                <button
                  key={trip.itemId}
                  type="button"
                  onClick={() => setSelectedTrip(trip)}
                  className="w-full flex items-center gap-3 rounded-[16px] bg-[#2A2030] border border-[#483060]/40 px-4 py-3.5 mb-2 hover:border-[#483060]/70 transition-colors text-left"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#483060]/30 text-xl">
                    {trip.flagEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9B70D0] mb-0.5">
                      {t('travel.reminder')}
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">{trip.title}</p>
                    <p className="text-xs text-text-secondary">
                      {t('dashboard.giftReminderFor', { name: trip.personName })}
                      {' · '}
                      {t('dashboard.giftReminderDays', { days: trip.daysLeft })}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          )}

          {customItems.length > 0 && (
            <section className="px-4 mb-5">
              {customItems.map((ci) => {
                const { gradient, emoji } = parseCategoryIconField(ci.categoryIcon)
                return (
                  <button
                    key={ci.itemId}
                    type="button"
                    onClick={() => setSelectedCustomItem(ci)}
                    className="w-full relative overflow-hidden flex items-center gap-3 rounded-[16px] border border-border-card px-4 py-3.5 mb-2 transition-colors text-left"
                    suppressHydrationWarning
                  >
                    {/* Тинт фона из цвета категории */}
                    <div className="absolute inset-0 opacity-[0.18] pointer-events-none" style={{ background: gradient }} suppressHydrationWarning />
                    {/* Контент */}
                    <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xl" style={{ background: gradient }} suppressHydrationWarning>
                      {emoji}
                    </div>
                    <div className="relative z-10 flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-0.5 truncate">
                        {ci.categoryName}
                      </p>
                      <p className="text-sm font-medium text-text-primary truncate">{ci.title}</p>
                      <p className="text-xs text-text-secondary">
                        {t('dashboard.giftReminderFor', { name: ci.personName })}
                        {' · '}
                        {t('dashboard.giftReminderDays', { days: ci.daysLeft })}
                      </p>
                    </div>
                  </button>
                )
              })}
            </section>
          )}
        </>
      ) : (
        <section className="px-4 mb-5">
          <Link
            href="/pro"
            className="flex items-center gap-3 rounded-[16px] border border-dashed border-border px-4 py-3 hover:border-primary/30 transition-colors"
          >
            <Bell size={15} className="text-text-muted flex-shrink-0" suppressHydrationWarning />
            <p className="flex-1 text-xs text-text-muted leading-snug">
              {t('dashboard.remindersProHint')}
            </p>
            <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
          </Link>
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

            {summary.filter((s) => s.isCustom && s.count > 0).map((s) => {
              const { gradient, emoji } = parseCategoryIconField(s.icon ?? null)
              return (
              <Link
                key={s.categoryName}
                href={`/overview/custom/${encodeURIComponent(s.categoryName)}`}
                className="relative overflow-hidden rounded-[20px] p-4 min-h-[120px] flex flex-col justify-between active:scale-[0.97] transition-transform"
                style={{ background: gradient }}
                suppressHydrationWarning
              >
                <span className="absolute -right-2 -bottom-2 text-[56px] opacity-20 select-none pointer-events-none">
                  {emoji}
                </span>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] truncate pr-6"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                  suppressHydrationWarning
                >
                  {s.categoryName}
                </p>
                <div>
                  <p
                    className="text-[30px] font-bold leading-none tracking-[-1px]"
                    style={{ color: '#fff' }}
                    suppressHydrationWarning
                  >
                    {s.count}
                  </p>
                  <p
                    className="text-[11px] mt-1"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                    suppressHydrationWarning
                  >
                    {t('dashboard.itemCount', { count: s.count })}
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

      {/* Модальное окно фильма */}
      {selectedMovie && (
        <MovieReminderModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onDismiss={handleMovieDismiss}
        />
      )}

      {/* Модальное окно поездки */}
      {selectedTrip && (
        <TripReminderModal
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onDismiss={handleTripDismiss}
        />
      )}

      {/* Модальное окно кастомного напоминания */}
      {selectedCustomItem && (
        <CustomItemReminderModal
          item={selectedCustomItem}
          onClose={() => setSelectedCustomItem(null)}
          onDismiss={handleCustomItemDismiss}
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

/* ── Модальное окно напоминания о фильме ── */

interface MovieReminderModalProps {
  movie: UpcomingMovie
  onClose: () => void
  onDismiss: (movieId: string) => void
}

function MovieReminderModal({ movie, onClose, onDismiss }: MovieReminderModalProps) {
  const t = useTranslations()
  const [isActing, setIsActing] = useState(false)

  function handleBuyTickets() {
    const query = encodeURIComponent(`купить билет в кино ${movie.title}`)
    const isRu = typeof navigator !== 'undefined' && navigator.language.startsWith('ru')
    const url = isRu
      ? `https://yandex.ru/search/?text=${query}`
      : `https://www.google.com/search?q=${encodeURIComponent(`buy cinema ticket ${movie.title}`)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleNotGoing() {
    setIsActing(true)
    try {
      const supabase = createClient()
      const newTags = movie.tags.filter((tag) => !tag.startsWith('release_date:'))
      await updateItem(supabase, movie.itemId, { tags: newTags })
      onDismiss(movie.itemId)
    } finally {
      setIsActing(false)
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
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A90A4] mb-1">
                {t('movies.releaseReminder')} · {t('dashboard.giftReminderFor', { name: movie.personName })}
              </p>
              <h2 className="text-lg font-bold tracking-[-0.3px] text-text-primary leading-tight">
                {movie.title}
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

          {/* Дата */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base">🎬</span>
            <p className="text-sm text-text-secondary">
              {t('dashboard.giftReminderDays', { days: movie.daysLeft })}
              <span className="ml-1 text-text-muted">
                ({new Date(movie.releaseDate).toLocaleDateString()})
              </span>
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col gap-2">
            {/* Купить билеты */}
            <button
              type="button"
              onClick={handleBuyTickets}
              className="flex items-center justify-center gap-2 w-full rounded-[12px] bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              <ExternalLink size={15} />
              {t('movies.buyTickets')}
            </button>

            {/* Не пойдем */}
            <button
              type="button"
              onClick={handleNotGoing}
              disabled={isActing}
              className="w-full rounded-[12px] border border-border py-3.5 text-sm font-medium text-text-secondary hover:bg-bg-hover disabled:opacity-60 transition-colors"
            >
              {isActing ? '...' : t('movies.notGoing')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Модальное окно напоминания о поездке ── */

interface TripReminderModalProps {
  trip: UpcomingTrip
  onClose: () => void
  onDismiss: (tripId: string) => void
}

function TripReminderModal({ trip, onClose, onDismiss }: TripReminderModalProps) {
  const t = useTranslations()
  const [isActing, setIsActing] = useState(false)
  const [action, setAction] = useState<'booked' | 'cancelled' | null>(null)

  async function handleBooked() {
    setIsActing(true)
    setAction('booked')
    try {
      const supabase = createClient()
      const newTags = [...trip.tags.filter((tag) => tag !== 'trip_booked:true'), 'trip_booked:true']
      await updateItem(supabase, trip.itemId, { tags: newTags })
      onDismiss(trip.itemId)
    } finally {
      setIsActing(false)
      setAction(null)
    }
  }

  async function handleCancelled() {
    setIsActing(true)
    setAction('cancelled')
    try {
      const supabase = createClient()
      const newTags = trip.tags.filter((tag) => !tag.startsWith('trip_date:'))
      await updateItem(supabase, trip.itemId, { tags: newTags })
      onDismiss(trip.itemId)
    } finally {
      setIsActing(false)
      setAction(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary pb-safe overflow-hidden">
        <div className="px-6 pt-5 pb-6">
          {/* Хэдер */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9B70D0] mb-1">
                {t('travel.reminder')} · {t('dashboard.giftReminderFor', { name: trip.personName })}
              </p>
              <h2 className="text-lg font-bold tracking-[-0.3px] text-text-primary leading-tight flex items-center gap-2">
                <span className="text-2xl">{trip.flagEmoji}</span>
                {trip.title}
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

          {/* Дата */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base">✈️</span>
            <p className="text-sm text-text-secondary">
              {t('dashboard.giftReminderDays', { days: trip.daysLeft })}
              <span className="ml-1 text-text-muted">
                ({new Date(trip.tripDate).toLocaleDateString()})
              </span>
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleBooked}
              disabled={isActing}
              className="w-full rounded-[12px] bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
            >
              {isActing && action === 'booked' ? t('travel.markingBooked') : t('travel.reminderBooked')}
            </button>

            <button
              type="button"
              onClick={handleCancelled}
              disabled={isActing}
              className="w-full rounded-[12px] border border-border py-3.5 text-sm font-medium text-text-secondary hover:bg-bg-hover disabled:opacity-60 transition-colors"
            >
              {isActing && action === 'cancelled' ? '...' : t('travel.reminderCancelled')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Модальное окно кастомного напоминания ── */

interface CustomItemReminderModalProps {
  item: UpcomingCustomItem
  onClose: () => void
  onDismiss: (itemId: string) => void
}

function CustomItemReminderModal({ item, onClose, onDismiss }: CustomItemReminderModalProps) {
  const t = useTranslations()
  const [isActing, setIsActing] = useState(false)
  const { gradient, emoji } = parseCategoryIconField(item.categoryIcon)

  async function handleDone() {
    setIsActing(true)
    try {
      const supabase = createClient()
      const newTags = item.tags.filter((tag) => !tag.startsWith('custom_date:'))
      await updateItem(supabase, item.itemId, { tags: newTags })
      onDismiss(item.itemId)
    } finally {
      setIsActing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary pb-safe overflow-hidden">
        <div className="px-6 pt-5 pb-6">
          {/* Хэдер */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-2xl"
                style={{ background: gradient }}
              >
                {emoji}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-0.5 truncate">
                  {item.categoryName} · {t('dashboard.giftReminderFor', { name: item.personName })}
                </p>
                <h2 className="text-lg font-bold tracking-[-0.3px] text-text-primary leading-tight truncate">
                  {item.title}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover"
            >
              <X size={16} />
            </button>
          </div>

          {/* Дата */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base">📅</span>
            <p className="text-sm text-text-secondary">
              {t('dashboard.giftReminderDays', { days: item.daysLeft })}
              <span className="ml-1 text-text-muted">
                ({new Date(item.customDate).toLocaleDateString()})
              </span>
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDone}
              disabled={isActing}
              className="w-full rounded-[12px] bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
            >
              {isActing ? '...' : t('dashboard.customItemDone')}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-[12px] border border-border py-3.5 text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors"
            >
              {t('dashboard.customItemHide')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
