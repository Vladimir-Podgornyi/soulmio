'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Plus, Star, ExternalLink, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Person } from '@/entities/person/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Item } from '@/entities/item/model/types'
import { AddRestaurantForm } from '@/features/add-restaurant'
import { useAddRestaurant } from '@/features/add-restaurant/model/useAddRestaurant'
import { AddFoodForm } from '@/features/add-food'
import { useAddFood, getFoodType, getCuisineType, getLinkedRestaurant } from '@/features/add-food'
import { AddGiftForm } from '@/features/add-gift'
import { useAddGift, getGiftPinned, getGiftDate } from '@/features/add-gift'
import { useCurrency, formatPrice } from '@/shared/lib/currency'

interface PersonPageProps {
  person: Person
  categories: Category[]
  initialItems: Item[]
  initialCategoryId: string
  isPro: boolean
}

const CATEGORY_ICONS: Record<string, string> = {
  food:        '🍽️',
  restaurants: '🍴',
  gifts:       '🎁',
  movies:      '🎬',
  travel:      '✈️',
}

export function PersonPage({
  person,
  categories,
  initialItems,
  initialCategoryId,
  isPro,
}: PersonPageProps) {
  const t = useTranslations()

  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId)
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, Item[]>>({
    [initialCategoryId]: initialItems,
  })
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [filter, setFilter] = useState<'all' | 'visited' | 'wants' | 'likes' | 'dislikes'>('all')
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | 'dish' | 'food_type' | 'cuisine'>('all')

  const activeCategory = categories.find((c) => c.id === activeCategoryId)
  const allItems = itemsByCategory[activeCategoryId] ?? []

  const isRestaurants = activeCategory?.name === 'restaurants'
  const isFood = activeCategory?.name === 'food'
  const isGifts = activeCategory?.name === 'gifts'

  const sentimentFiltered = filter === 'all' ? allItems : allItems.filter((it) => it.sentiment === filter)
  const typeFiltered = foodTypeFilter === 'all'
    ? sentimentFiltered
    : sentimentFiltered.filter((it) => getFoodType(it.tags ?? null) === foodTypeFilter)
  // Подарки: закреплённые сверху
  const items = isGifts
    ? [...typeFiltered].sort((a, b) => {
        const aPin = getGiftPinned(a.tags ?? null) ? 0 : 1
        const bPin = getGiftPinned(b.tags ?? null) ? 0 : 1
        return aPin - bPin
      })
    : typeFiltered

  const restaurantCategory = categories.find((c) => c.name === 'restaurants')
  const availableRestaurants = restaurantCategory
    ? (itemsByCategory[restaurantCategory.id] ?? [])
    : []

  function handleItemAdded(item: Item) {
    setItemsByCategory((prev) => ({
      ...prev,
      [activeCategoryId]: [item, ...(prev[activeCategoryId] ?? [])],
    }))
    setIsAddOpen(false)
  }

  function handleItemUpdated(updated: Item) {
    setItemsByCategory((prev) => ({
      ...prev,
      [activeCategoryId]: (prev[activeCategoryId] ?? []).map((it) =>
        it.id === updated.id ? updated : it
      ),
    }))
    setEditingItem(null)
  }

  function handleItemDeleted(id: string) {
    setItemsByCategory((prev) => ({
      ...prev,
      [activeCategoryId]: (prev[activeCategoryId] ?? []).filter((it) => it.id !== id),
    }))
  }

  async function handleCategoryChange(categoryId: string) {
    setActiveCategoryId(categoryId)
    setFilter('all')
    setFoodTypeFilter('all')
    if (!(categoryId in itemsByCategory)) {
      const res = await fetch(`/api/items?personId=${person.id}&categoryId=${categoryId}`)
      const data = (await res.json()) as Item[]
      setItemsByCategory((prev) => ({ ...prev, [categoryId]: data }))
    }
  }

  async function handleOpenFoodAdd() {
    setIsAddOpen(true)
    // Ленивая загрузка ресторанов, чтобы они были доступны при привязке блюда
    if (restaurantCategory && !(restaurantCategory.id in itemsByCategory)) {
      const res = await fetch(`/api/items?personId=${person.id}&categoryId=${restaurantCategory.id}`)
      const data = (await res.json()) as Item[]
      setItemsByCategory((prev) => ({ ...prev, [restaurantCategory.id]: data }))
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Шапка */}
      <div className="px-4 pt-14 pb-4">
        <Link href="/people" className="mb-4 flex items-center gap-1 text-sm text-text-secondary">
          <ChevronLeft size={16} />
          {t('common.back')}
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8735A] to-[#C94F38] text-[18px] font-bold text-white uppercase leading-none overflow-hidden">
            {person.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.5px] text-text-primary leading-tight">
              {person.name}
            </h1>
            {person.relation && (
              <p className="text-sm text-text-secondary capitalize">
                {['partner', 'friend', 'family', 'other'].includes(person.relation)
                  ? t(`people.relations.${person.relation as 'partner' | 'friend' | 'family' | 'other'}`)
                  : person.relation}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Вкладки категорий */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-5 scrollbar-none">
        {categories.map((cat) => {
          const icon = cat.icon ?? CATEGORY_ICONS[cat.name] ?? '📁'
          const isActive = cat.id === activeCategoryId
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex h-9 flex-shrink-0 items-center gap-1.5 rounded-[20px] px-4 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
              }`}
            >
              <span>{icon}</span>
              <span>
                {cat.name in { food: 1, restaurants: 1, gifts: 1, movies: 1, travel: 1 }
                  ? t(`categories.${cat.name as 'food' | 'restaurants' | 'gifts' | 'movies' | 'travel'}`)
                  : cat.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Фильтры — еда */}
      {isFood && allItems.length > 0 && (
        <div className="px-4 pb-4">
          {/* Мобильный: две строки друг под другом. Десктоп: одна прокручиваемая строка */}
          <div className="flex flex-col gap-1 md:flex-row md:gap-0 md:overflow-x-auto md:scrollbar-none md:items-center">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {([
                { key: 'all',      label: t('common.all') },
                { key: 'likes',    label: t('items.sentiments.likes') },
                { key: 'dislikes', label: t('items.sentiments.dislikes') },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`h-8 flex-shrink-0 rounded-[8px] px-3 text-xs font-medium transition-colors ${
                    filter === key
                      ? 'bg-bg-input text-text-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {label}
                  {key !== 'all' && (
                    <span className="ml-1.5 text-text-muted">
                      {allItems.filter((it) => it.sentiment === key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <span className="hidden md:block flex-shrink-0 w-px h-4 bg-border mx-2" />
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {([
                { key: 'all',       label: t('food.filterAll') },
                { key: 'dish',      label: `🍽️ ${t('food.types.dish')}` },
                { key: 'food_type', label: `🥗 ${t('food.types.food_type')}` },
                { key: 'cuisine',   label: `🍜 ${t('food.cuisineTitle')}` },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFoodTypeFilter(key)}
                  className={`h-8 flex-shrink-0 rounded-[8px] px-3 text-xs font-medium transition-colors ${
                    foodTypeFilter === key
                      ? 'bg-bg-input text-text-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Фильтр по отношению — рестораны */}
      {isRestaurants && allItems.length > 0 && (
        <div className="flex gap-2 px-4 pb-4">
          {([
            { key: 'all',     label: t('common.all') },
            { key: 'visited', label: t('items.sentiments.visited') },
            { key: 'wants',   label: t('items.sentiments.wants') },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`h-8 flex-shrink-0 rounded-[8px] px-3 text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-bg-input text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1.5 text-text-muted">
                  {allItems.filter((it) => it.sentiment === key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Фильтр — подарки */}
      {isGifts && allItems.length > 0 && (
        <div className="flex gap-2 px-4 pb-4">
          {([
            { key: 'all',   label: t('gifts.filterAll') },
            { key: 'wants', label: t('gifts.filterWants') },
            { key: 'likes', label: t('gifts.filterGifted') },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`h-8 flex-shrink-0 rounded-[8px] px-3 text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-bg-input text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1.5 text-text-muted">
                  {allItems.filter((it) => it.sentiment === key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Список элементов */}
      <div className="px-4 pb-32 pt-1">
        {/* Десктоп: пунктирная карточка "Добавить" вверху списка */}
        <button
          onClick={isFood ? handleOpenFoodAdd : () => setIsAddOpen(true)}
          className="hidden md:flex mb-2 w-full items-center gap-3 rounded-[14px] border border-dashed border-border bg-transparent p-4 text-left transition-colors hover:bg-bg-hover"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-bg-input text-text-muted">
            <Plus size={16} />
          </div>
          <span className="text-sm text-text-muted">{t('common.add')}</span>
        </button>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-3 text-5xl">
              {activeCategory?.icon ?? CATEGORY_ICONS[activeCategory?.name ?? ''] ?? '📋'}
            </span>
            <p className="text-sm text-text-muted">{t('common.empty')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) =>
              isFood ? (
                <FoodCard
                  key={item.id}
                  item={item}
                  personId={person.id}
                  categoryId={activeCategoryId}
                  onEdit={() => setEditingItem(item)}
                  onDeleted={() => handleItemDeleted(item.id)}
                />
              ) : isGifts ? (
                <GiftCard
                  key={item.id}
                  item={item}
                  personId={person.id}
                  categoryId={activeCategoryId}
                  onEdit={() => setEditingItem(item)}
                  onDeleted={() => handleItemDeleted(item.id)}
                />
              ) : (
                <RestaurantCard
                  key={item.id}
                  item={item}
                  personId={person.id}
                  categoryId={activeCategoryId}
                  onEdit={() => setEditingItem(item)}
                  onDeleted={() => handleItemDeleted(item.id)}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* FAB — только на мобильных */}
      <button
        onClick={isFood ? handleOpenFoodAdd : () => setIsAddOpen(true)}
        className="md:hidden fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform active:scale-95"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Нижний лист добавления — еда */}
      {isAddOpen && isFood && (
        <BottomSheet title={t('food.add')} onClose={() => setIsAddOpen(false)}>
          <AddFoodForm
            personId={person.id}
            categoryId={activeCategoryId}
            availableRestaurants={availableRestaurants}
            onSuccess={handleItemAdded}
            onCancel={() => setIsAddOpen(false)}
          />
        </BottomSheet>
      )}

      {/* Нижний лист добавления — рестораны */}
      {isAddOpen && isRestaurants && (
        <BottomSheet title={t('restaurants.add')} onClose={() => setIsAddOpen(false)}>
          <AddRestaurantForm
            personId={person.id}
            categoryId={activeCategoryId}
            existingItems={allItems}
            onSuccess={handleItemAdded}
            onCancel={() => setIsAddOpen(false)}
          />
        </BottomSheet>
      )}

      {/* Нижний лист редактирования — еда */}
      {editingItem && isFood && (
        <BottomSheet title={t('food.edit')} onClose={() => setEditingItem(null)}>
          <AddFoodForm
            personId={person.id}
            categoryId={activeCategoryId}
            availableRestaurants={availableRestaurants}
            item={editingItem}
            onSuccess={handleItemUpdated}
            onCancel={() => setEditingItem(null)}
          />
        </BottomSheet>
      )}

      {/* Нижний лист редактирования — рестораны */}
      {editingItem && isRestaurants && (
        <BottomSheet title={t('common.edit')} onClose={() => setEditingItem(null)}>
          <AddRestaurantForm
            personId={person.id}
            categoryId={activeCategoryId}
            existingItems={allItems}
            item={editingItem}
            onSuccess={handleItemUpdated}
            onCancel={() => setEditingItem(null)}
          />
        </BottomSheet>
      )}

      {/* Нижний лист добавления — подарки */}
      {isAddOpen && isGifts && (
        <BottomSheet title={t('gifts.add')} onClose={() => setIsAddOpen(false)}>
          <AddGiftForm
            personId={person.id}
            categoryId={activeCategoryId}
            isPro={isPro}
            onSuccess={handleItemAdded}
            onCancel={() => setIsAddOpen(false)}
          />
        </BottomSheet>
      )}

      {/* Нижний лист редактирования — подарки */}
      {editingItem && isGifts && (
        <BottomSheet title={t('gifts.edit')} onClose={() => setEditingItem(null)}>
          <AddGiftForm
            personId={person.id}
            categoryId={activeCategoryId}
            item={editingItem}
            isPro={isPro}
            onSuccess={handleItemUpdated}
            onCancel={() => setEditingItem(null)}
          />
        </BottomSheet>
      )}
    </div>
  )
}

/* ── Карточка еды ── */

interface FoodCardProps {
  item: Item
  personId: string
  categoryId: string
  onEdit: () => void
  onDeleted: () => void
}

function FoodCard({ item, personId, categoryId, onEdit, onDeleted }: FoodCardProps) {
  const t = useTranslations()
  const { isSaving, removeFood } = useAddFood(personId, categoryId, () => {})
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleDelete() {
    try {
      await removeFood(item.id)
      onDeleted()
      toast.success(t('food.deleted'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const isLikes = item.sentiment === 'likes'
  const foodType = getFoodType(item.tags ?? null)
  const cuisineType = getCuisineType(item.tags ?? null)
  const linkedRestaurant = getLinkedRestaurant(item.tags ?? null)

  const typeLabel =
    foodType === 'dish' ? `🍽️ ${t('food.types.dish')}` :
    foodType === 'cuisine' ? `🍜 ${t('food.types.cuisine')}` :
    `🥗 ${t('food.types.food_type')}`

  return (
    <div className="rounded-[14px] bg-bg-card border border-border-card p-4">
      {/* Верхняя строка */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary leading-tight">{item.title}</span>
            <span className="rounded-[6px] bg-bg-input px-1.5 py-0.5 text-[10px] text-text-muted">
              {typeLabel}
            </span>
            {cuisineType && (
              <span className="rounded-[6px] bg-bg-input px-1.5 py-0.5 text-[10px] text-text-secondary">
                {cuisineType}
              </span>
            )}
          </div>
          {linkedRestaurant && (
            <span className="text-xs text-text-secondary mt-0.5">🍴 {linkedRestaurant.name}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Значок отношения */}
          <span
            className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium ${
              isLikes ? 'bg-loves-bg text-loves' : 'bg-avoid-bg text-avoid'
            }`}
          >
            {isLikes ? `❤️ ${t('items.sentiments.likes')}` : `😕 ${t('items.sentiments.dislikes')}`}
          </span>

          {/* Меню из трёх точек */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); onEdit() }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
                >
                  <Pencil size={14} className="text-text-secondary" />
                  {t('common.edit')}
                </button>
                <div className="mx-3 h-px bg-border-card" />
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                  {t('common.delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Комментарий */}
      {item.description && (
        <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Подтверждение удаления */}
      {confirmDelete && (
        <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
          <span className="text-sm text-red-500">{t('food.deleteConfirm')}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {isSaving ? '...' : t('common.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Карточка ресторана ── */

interface RestaurantCardProps {
  item: Item
  personId: string
  categoryId: string
  onEdit: () => void
  onDeleted: () => void
}

function RestaurantCard({ item, personId, categoryId, onEdit, onDeleted }: RestaurantCardProps) {
  const t = useTranslations()
  const { isSaving, removeRestaurant } = useAddRestaurant(personId, categoryId, () => {})
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Закрываем меню по клику снаружи
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleDelete() {
    try {
      await removeRestaurant(item.id)
      onDeleted()
      toast.success(t('restaurants.deleted'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const addressTag = item.tags?.find((tag) => tag.startsWith('📍'))
  const isVisited = item.sentiment === 'visited'
  const hasRatings = isVisited && (item.my_rating !== null || item.partner_rating !== null)

  // Иконки, общие для размещения в последней строке
  const icons = (
    <div className="flex flex-shrink-0 items-center gap-0.5">
      {item.external_url && (
        <a
          href={item.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
        >
          <ExternalLink size={15} />
        </a>
      )}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
        >
          <MoreVertical size={15} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 bottom-8 z-20 min-w-[130px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
            <button
              onClick={() => { setMenuOpen(false); onEdit() }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
            >
              <Pencil size={14} className="text-text-secondary" />
              {t('common.edit')}
            </button>
            <div className="mx-3 h-px bg-border-card" />
            <button
              onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
              {t('common.delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="rounded-[14px] bg-bg-card border border-border-card p-4">
      {/* Верхняя строка: название + адрес + значок отношения */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-text-primary leading-tight">{item.title}</span>
          {addressTag && (
            <span className="text-xs text-text-secondary">{addressTag}</span>
          )}
        </div>
        <span
          className={`flex-shrink-0 rounded-[8px] px-2.5 py-1 text-[11px] font-medium ${
            isVisited ? 'bg-loves-bg text-loves' : 'bg-wants-bg text-wants'
          }`}
        >
          {isVisited ? t('items.sentiments.visited') : t('items.sentiments.wants')}
        </span>
      </div>

      {/* Рейтинги — иконки справа, если нет комментария */}
      {hasRatings && (
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-border-card pt-3">
          <div className="flex gap-4">
            {item.my_rating !== null && (
              <RatingDisplay label={t('items.ratings.mine')} value={item.my_rating} />
            )}
            {item.partner_rating !== null && (
              <RatingDisplay label={t('items.ratings.partner')} value={item.partner_rating} />
            )}
          </div>
          {!item.description && icons}
        </div>
      )}

      {/* Комментарий — иконки справа в этой последней строке */}
      {item.description && (
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="flex-1 text-[13px] text-text-secondary leading-relaxed">{item.description}</p>
          {icons}
        </div>
      )}

      {/* Только иконки — когда нет рейтингов и комментария */}
      {!hasRatings && !item.description && (
        <div className="mt-2 flex justify-end">{icons}</div>
      )}

      {/* Подтверждение удаления */}
      {confirmDelete && (
        <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
          <span className="text-sm text-red-500">{t('restaurants.deleteConfirm')}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {isSaving ? '...' : t('common.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Отображение рейтинга ── */

function RatingDisplay({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-[0.08em] text-text-muted">{label}</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={12}
            className={s <= value ? 'fill-primary text-primary' : 'text-border-card'}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Карточка подарка ── */

interface GiftCardProps {
  item: Item
  personId: string
  categoryId: string
  onEdit: () => void
  onDeleted: () => void
}

function GiftCard({ item, personId, categoryId, onEdit, onDeleted }: GiftCardProps) {
  const t = useTranslations()
  const { currency } = useCurrency()
  const { isSaving, removeGift } = useAddGift(personId, categoryId, () => {})
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const desktopMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const inDesktop = desktopMenuRef.current?.contains(target)
      const inMobile = mobileMenuRef.current?.contains(target)
      if (!inDesktop && !inMobile) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleDelete() {
    try {
      await removeGift(item.id)
      onDeleted()
      toast.success(t('gifts.deleted'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const isPinned = getGiftPinned(item.tags ?? null)
  const giftDate = getGiftDate(item.tags ?? null)
  const isWants = item.sentiment === 'wants'

  const statusBadge = (
    <span
      className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
        isWants ? 'bg-wants-bg text-wants' : 'bg-loves-bg text-loves'
      }`}
    >
      {isWants ? `🎁 ${t('items.sentiments.wants')}` : `✅ ${t('gifts.filterGifted')}`}
    </span>
  )

  const menuDropdown = (pos: 'top' | 'bottom') => menuOpen && (
    <div className={`absolute right-0 ${pos === 'bottom' ? 'bottom-8' : 'top-8'} z-30 min-w-[150px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden`}>
      <button
        onClick={() => { setMenuOpen(false); onEdit() }}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
      >
        <Pencil size={14} className="text-text-secondary" />
        {t('common.edit')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button
        onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 size={14} />
        {t('common.delete')}
      </button>
    </div>
  )

  return (
    <div className="rounded-[14px] bg-bg-card border border-border-card">

      {/* ── Верхняя часть: фото + текст ── */}
      <div className="flex gap-3 p-4 pb-3">
        {/* Миниатюра */}
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-16 w-16 flex-shrink-0 rounded-[10px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        {/* Текст + десктопные контролы */}
        <div className="flex flex-1 gap-2 min-w-0">

          {/* Колонка: звёздочка + (название / цена / описание) */}
          <div className="flex flex-1 items-start gap-1.5 min-w-0">
            {isPinned && (
              <Star size={13} className="flex-shrink-0 mt-[3px] fill-primary text-primary" />
            )}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="font-semibold text-text-primary leading-snug">{item.title}</span>

              {/* Цена + ссылка + дата */}
              {(item.price != null || item.external_url || giftDate) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {item.price != null && (
                    <span className="text-sm font-semibold text-text-primary">
                      {formatPrice(item.price, currency)}
                    </span>
                  )}
                  {item.external_url && (
                    <a
                      href={item.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
                    >
                      <ExternalLink size={12} />
                      {t('items.link')}
                    </a>
                  )}
                  {giftDate && (
                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                      📅 {new Date(giftDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {/* Описание */}
              {item.description && (
                <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          {/* Десктоп: статус + меню (скрыто на мобильных) */}
          <div className="hidden md:flex flex-shrink-0 items-start gap-1.5" ref={desktopMenuRef}>
            {statusBadge}
            <div className="relative">
              <button
                onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
              >
                <MoreVertical size={15} />
              </button>
              {menuDropdown('top')}
            </div>
          </div>
        </div>
      </div>

      {/* ── Нижняя полоска: статус | ссылка | меню — только мобильные ── */}
      <div className="md:hidden flex items-center border-t border-border-card">

        {/* Статус */}
        <div className="flex flex-1 items-center justify-center px-3 py-2.5">
          {statusBadge}
        </div>

        {/* Ссылка на товар */}
        {item.external_url && (
          <>
            <div className="w-px h-7 flex-shrink-0 bg-border-card" />
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
            >
              <ExternalLink size={13} />
              {t('items.link')}
            </a>
          </>
        )}

        {/* Меню (три точки) — мобильные */}
        <div className="w-px h-7 flex-shrink-0 bg-border-card" />
        <div className="relative flex items-center" ref={mobileMenuRef}>
          <button
            onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }}
            className="flex h-10 w-11 items-center justify-center text-text-muted transition-colors hover:text-text-secondary"
          >
            <MoreVertical size={15} />
          </button>
          {menuDropdown('bottom')}
        </div>
      </div>

      {/* Подтверждение удаления */}
      {confirmDelete && (
        <div className="mx-4 mb-4 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
          <span className="text-sm text-red-500">{t('gifts.deleteConfirm')}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {isSaving ? '...' : t('common.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Нижний лист ── */

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
