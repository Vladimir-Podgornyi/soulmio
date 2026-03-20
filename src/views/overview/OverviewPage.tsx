'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ExternalLink, Star, MoreVertical, Pencil, ArrowRight } from 'lucide-react'
import { useCurrency, formatPrice } from '@/shared/lib/currency'
import type { ItemWithPerson } from '@/entities/item/api'
import type { Item } from '@/entities/item/model/types'
import { getGiftPinned, getGiftDate } from '@/features/add-gift'
import { AddGiftForm } from '@/features/add-gift'
import { getCuisineType, getFoodType } from '@/features/add-food'
import { AddFoodForm } from '@/features/add-food'
import { AddRestaurantForm } from '@/features/add-restaurant'

interface OverviewPageProps {
  category: string
  items: ItemWithPerson[]
  isPro: boolean
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽️',
  restaurants: '🍴',
  gifts: '🎁',
  movies: '🎬',
  travel: '✈️',
}

type ValidCategory = 'food' | 'restaurants' | 'gifts' | 'movies' | 'travel'

export function OverviewPage({ category, items: initialItems, isPro }: OverviewPageProps) {
  const t = useTranslations()
  const { currency } = useCurrency()

  const [items, setItems] = useState<ItemWithPerson[]>(initialItems)
  const [editingItem, setEditingItem] = useState<ItemWithPerson | null>(null)

  const icon = CATEGORY_ICONS[category] ?? '📁'
  const isValidCategory = ['food', 'restaurants', 'gifts', 'movies', 'travel'].includes(category)
  const categoryLabel = isValidCategory
    ? t(`categories.${category as ValidCategory}`)
    : category

  const isGifts = category === 'gifts'
  const isFood = category === 'food'

  // Для подарков: закреплённые сверху
  const sortedItems = isGifts
    ? [...items].sort((a, b) => {
        const aPin = getGiftPinned(a.tags ?? null) ? 0 : 1
        const bPin = getGiftPinned(b.tags ?? null) ? 0 : 1
        return aPin - bPin
      })
    : items

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
    if (isFood) return t('food.edit')
    if (isGifts) return t('gifts.edit')
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
          <span className="text-3xl">{icon}</span>
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
              t={t}
            />
          ))
        )}
      </div>

      {/* Модальное окно редактирования */}
      {editingItem && (
        <BottomSheet title={getEditTitle()} onClose={() => setEditingItem(null)}>
          {isFood ? (
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
    </div>
  )
}

/* ── Карточка элемента в обзоре ── */

interface OverviewItemCardProps {
  item: ItemWithPerson
  category: string
  currency: string
  onEdit: () => void
  t: ReturnType<typeof useTranslations>
}

function OverviewItemCard({ item, category, currency, onEdit, t }: OverviewItemCardProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isRestaurants = category === 'restaurants'
  const isGifts = category === 'gifts'
  const isFood = category === 'food'
  const isVisited = item.sentiment === 'visited'
  const isWants = item.sentiment === 'wants'
  const isLikes = item.sentiment === 'likes'

  const addressTag = item.tags?.find((tag) => tag.startsWith('📍'))
  const giftDate = isGifts ? getGiftDate(item.tags ?? null) : ''
  const isPinned = isGifts ? getGiftPinned(item.tags ?? null) : false
  const cuisineType = isFood ? getCuisineType(item.tags ?? null) : null
  const foodType = isFood ? getFoodType(item.tags ?? null) : null

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
        <div className="flex items-center gap-2">
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
        </div>

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
