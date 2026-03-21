'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Plus, Star, ExternalLink, MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/shared/api/supabase'
import type { Person } from '@/entities/person/model/types'
import type { Category } from '@/entities/category/model/types'
import { updateItem } from '@/entities/item/api'
import type { Item } from '@/entities/item/model/types'
import { createCustomCategory, updateCustomCategory, deleteCustomCategory } from '@/entities/category/api'
import { AddRestaurantForm } from '@/features/add-restaurant'
import { useAddRestaurant } from '@/features/add-restaurant/model/useAddRestaurant'
import { AddFoodForm } from '@/features/add-food'
import { useAddFood, getFoodType, getCuisineType, getLinkedRestaurant } from '@/features/add-food'
import { AddGiftForm } from '@/features/add-gift'
import { useAddGift, getGiftPinned, getGiftDate } from '@/features/add-gift'
import { AddMovieForm, AddActorForm, useAddMovie, getMovieGenres, getMovieReleaseDate, isActorItem, getActorFilms, getMoviePinned } from '@/features/add-movie'
import { AddTravelForm, useAddTravel, getTravelPinned, getTravelCity, getTravelCountry, getTravelDate, getTravelBudget, getFlagEmoji } from '@/features/add-travel'
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
  const searchParams = useSearchParams()

  // ?add=categoryName — переход из QuickAdd (открывает форму добавления)
  // ?section=categoryName — переход из Overview (открывает нужную вкладку)
  const addParam = searchParams.get('add')
  const sectionParam = searchParams.get('section')

  const targetCategoryId =
    (addParam && (categories.find((c) => c.name === addParam)?.id ?? null)) ||
    (sectionParam && (categories.find((c) => c.name === sectionParam)?.id ?? null)) ||
    null

  const [activeCategoryId, setActiveCategoryId] = useState(
    targetCategoryId ?? initialCategoryId
  )
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, Item[]>>({
    [initialCategoryId]: initialItems,
  })
  const [isAddOpen, setIsAddOpen] = useState(addParam !== null && targetCategoryId !== null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [filter, setFilter] = useState<'all' | 'visited' | 'wants' | 'likes' | 'dislikes'>('all')
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | 'dish' | 'food_type' | 'cuisine'>('all')
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [movieSubTab, setMovieSubTab] = useState<'movies' | 'actors'>('movies')
  const [movieGenreFilter, setMovieGenreFilter] = useState('all')

  // При переходе через ?section= — загружаем items для целевой категории если их нет
  useEffect(() => {
    if (!targetCategoryId || targetCategoryId === initialCategoryId) return
    if (targetCategoryId in itemsByCategory) return
    fetch(`/api/items?personId=${person.id}&categoryId=${targetCategoryId}`)
      .then((r) => r.json())
      .then((data: Item[]) => {
        setItemsByCategory((prev) => ({ ...prev, [targetCategoryId]: data }))
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeCategory = localCategories.find((c) => c.id === activeCategoryId)
  const allItems = itemsByCategory[activeCategoryId] ?? []

  const isRestaurants = activeCategory?.name === 'restaurants'
  const isFood = activeCategory?.name === 'food'
  const isGifts = activeCategory?.name === 'gifts'
  const isMovies = activeCategory?.name === 'movies'
  const isTravel = activeCategory?.name === 'travel'

  // Фильмы: разделяем фильмы и актёров
  const movieOnlyItems = isMovies ? allItems.filter((it) => !isActorItem(it.tags ?? null)) : allItems
  const actorOnlyItems = isMovies ? allItems.filter((it) => isActorItem(it.tags ?? null)) : []
  const availableMovieGenres = isMovies
    ? [...new Set(movieOnlyItems.flatMap((it) => getMovieGenres(it.tags ?? null)))]
    : []

  // Пул на основе суб-таба
  const baseItems = isMovies
    ? (movieSubTab === 'actors' ? actorOnlyItems : movieOnlyItems)
    : allItems

  const sentimentFiltered = (filter === 'all' || (isMovies && movieSubTab === 'actors'))
    ? baseItems
    : baseItems.filter((it) => it.sentiment === filter)
  const typeFiltered = isFood && foodTypeFilter !== 'all'
    ? sentimentFiltered.filter((it) => getFoodType(it.tags ?? null) === foodTypeFilter)
    : sentimentFiltered
  const genreFiltered = isMovies && movieSubTab === 'movies' && movieGenreFilter !== 'all'
    ? typeFiltered.filter((it) => getMovieGenres(it.tags ?? null).includes(movieGenreFilter))
    : typeFiltered
  // Закреплённые сверху для всех категорий
  const items = [...genreFiltered].sort((a, b) => {
    const aPin = getGiftPinned(a.tags ?? null) || getMoviePinned(a.tags ?? null) || getTravelPinned(a.tags ?? null) ? 0 : 1
    const bPin = getGiftPinned(b.tags ?? null) || getMoviePinned(b.tags ?? null) || getTravelPinned(b.tags ?? null) ? 0 : 1
    return aPin - bPin
  })

  const restaurantCategory = localCategories.find((c) => c.name === 'restaurants')
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
    setMovieSubTab('movies')
    setMovieGenreFilter('all')
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
            {person.avatar_url
              ? <img src={person.avatar_url} alt={person.name} className="h-full w-full object-cover" />
              : person.name.charAt(0)
            }
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
        {localCategories.map((cat) => {
          const icon = cat.icon ?? CATEGORY_ICONS[cat.name] ?? '📁'
          const isActive = cat.id === activeCategoryId
          const label = cat.name in { food: 1, restaurants: 1, gifts: 1, movies: 1, travel: 1 }
            ? t(`categories.${cat.name as 'food' | 'restaurants' | 'gifts' | 'movies' | 'travel'}`)
            : cat.name

          if (cat.is_custom) {
            return (
              <div key={cat.id} className={`flex flex-shrink-0 items-center rounded-[20px] text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'bg-bg-input text-text-secondary'}`}>
                <button
                  onClick={() => handleCategoryChange(cat.id)}
                  className="flex h-9 items-center gap-1.5 pl-4 pr-2"
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
                <button
                  onClick={() => setEditingCategory(cat)}
                  className={`flex h-9 w-7 items-center justify-center rounded-r-[20px] pr-1 transition-colors ${isActive ? 'text-white/60 hover:text-white' : 'text-text-muted hover:text-text-secondary'}`}
                >
                  <MoreVertical size={13} />
                </button>
              </div>
            )
          }

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex h-9 flex-shrink-0 items-center gap-1.5 rounded-[20px] px-4 text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-white' : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          )
        })}
        {/* Кнопка добавления кастомной категории */}
        <button
          onClick={() => setShowAddCategory(true)}
          className="flex h-9 flex-shrink-0 items-center gap-1 rounded-[20px] px-3 text-sm font-medium bg-bg-input text-text-muted hover:bg-bg-hover transition-colors"
        >
          <Plus size={14} />
          <span>{t('categories.addCustom')}</span>
        </button>
      </div>

      {/* Модал добавления кастомной категории */}
      {showAddCategory && (
        <AddCategoryModal
          personId={person.id}
          userId={person.user_id}
          personName={person.name}
          isPro={isPro}
          customCategoryCount={localCategories.filter((c) => c.is_custom).length}
          onClose={() => setShowAddCategory(false)}
          onCreated={(cat) => {
            setLocalCategories((prev) => [...prev, cat])
            setShowAddCategory(false)
            handleCategoryChange(cat.id)
          }}
        />
      )}

      {/* Модал редактирования кастомной категории */}
      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onUpdated={(updated) => {
            setLocalCategories((prev) => prev.map((c) => c.id === updated.id ? updated : c))
            setEditingCategory(null)
          }}
          onDeleted={(id) => {
            const remaining = localCategories.filter((c) => c.id !== id)
            setLocalCategories(remaining)
            setEditingCategory(null)
            if (activeCategoryId === id) {
              const next = remaining[0]
              if (next) handleCategoryChange(next.id)
            }
          }}
        />
      )}

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

      {/* Фильтр — путешествия */}
      {isTravel && allItems.length > 0 && (
        <div className="flex gap-2 px-4 pb-4">
          {([
            { key: 'all',     label: t('travel.filterAll') },
            { key: 'wants',   label: t('travel.filterWants') },
            { key: 'visited', label: t('travel.filterVisited') },
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

      {/* Фильтры — фильмы */}
      {isMovies && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* Суб-табы: Фильмы | Актёры */}
          <div className="flex rounded-[10px] bg-bg-input p-1 gap-1">
            <button
              onClick={() => { setMovieSubTab('movies'); setFilter('all'); setMovieGenreFilter('all') }}
              className={`flex-1 rounded-[8px] py-2 text-sm font-medium transition-colors ${
                movieSubTab === 'movies' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted'
              }`}
            >
              🎬 {t('movies.tab')}
            </button>
            <button
              onClick={() => { setMovieSubTab('actors'); setFilter('all') }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-[8px] py-2 text-sm font-medium transition-colors ${
                movieSubTab === 'actors' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted'
              }`}
            >
              👤 {t('movies.actorsTab')}
              {!isPro && (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Pro</span>
              )}
            </button>
          </div>

          {/* Фильтры статуса и жанра — только вкладка фильмов */}
          {movieSubTab === 'movies' && movieOnlyItems.length > 0 && (
            <div className="flex flex-col gap-2">
              {/* Статус */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {([
                  { key: 'all',      label: t('common.all') },
                  { key: 'wants',    label: t('movies.statusWants') },
                  { key: 'likes',    label: t('movies.statusLikes') },
                  { key: 'dislikes', label: t('movies.statusDislikes') },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`h-8 flex-shrink-0 rounded-[8px] px-3 text-xs font-medium transition-colors ${
                      filter === key ? 'bg-bg-input text-text-primary' : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {label}
                    {key !== 'all' && (
                      <span className="ml-1.5 text-text-muted">
                        {movieOnlyItems.filter((it) => it.sentiment === key).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {/* Жанры */}
              {availableMovieGenres.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setMovieGenreFilter('all')}
                    className={`h-8 flex-shrink-0 rounded-[8px] px-3 text-xs font-medium transition-colors ${
                      movieGenreFilter === 'all' ? 'bg-bg-input text-text-primary' : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {t('common.all')}
                  </button>
                  {availableMovieGenres.map((g) => (
                    <button
                      key={g}
                      onClick={() => setMovieGenreFilter(g)}
                      className={`h-8 flex-shrink-0 rounded-[8px] px-3 text-xs font-medium transition-colors ${
                        movieGenreFilter === g ? 'bg-bg-input text-text-primary' : 'text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      {t(`movies.genres.${g}` as Parameters<typeof t>[0])}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
          isMovies && movieSubTab === 'actors' && !isPro ? (
            <div className="rounded-[16px] border border-primary/20 bg-primary/5 px-5 py-8 text-center">
              <p className="text-3xl mb-3">🎭</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t('movies.actorsPro')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="mb-3 text-5xl">
                {activeCategory?.icon ?? CATEGORY_ICONS[activeCategory?.name ?? ''] ?? '📋'}
              </span>
              <p className="text-sm text-text-muted">{t('common.empty')}</p>
            </div>
          )
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
                  onUpdated={handleItemUpdated}
                />
              ) : isGifts ? (
                <GiftCard
                  key={item.id}
                  item={item}
                  personId={person.id}
                  categoryId={activeCategoryId}
                  onEdit={() => setEditingItem(item)}
                  onDeleted={() => handleItemDeleted(item.id)}
                  onUpdated={handleItemUpdated}
                />
              ) : isMovies ? (
                isActorItem(item.tags ?? null) ? (
                  <ActorCard
                    key={item.id}
                    item={item}
                    personId={person.id}
                    categoryId={activeCategoryId}
                    onEdit={() => setEditingItem(item)}
                    onDeleted={() => handleItemDeleted(item.id)}
                    onUpdated={handleItemUpdated}
                  />
                ) : (
                  <MovieCard
                    key={item.id}
                    item={item}
                    personId={person.id}
                    categoryId={activeCategoryId}
                    onEdit={() => setEditingItem(item)}
                    onDeleted={() => handleItemDeleted(item.id)}
                    onUpdated={handleItemUpdated}
                  />
                )
              ) : isTravel ? (
                <TravelCard
                  key={item.id}
                  item={item}
                  personId={person.id}
                  categoryId={activeCategoryId}
                  onEdit={() => setEditingItem(item)}
                  onDeleted={() => handleItemDeleted(item.id)}
                  onUpdated={handleItemUpdated}
                />
              ) : (
                <RestaurantCard
                  key={item.id}
                  item={item}
                  personId={person.id}
                  categoryId={activeCategoryId}
                  onEdit={() => setEditingItem(item)}
                  onDeleted={() => handleItemDeleted(item.id)}
                  onUpdated={handleItemUpdated}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* FAB — только на мобильных */}
      {!(isMovies && movieSubTab === 'actors' && !isPro) && (
        <button
          onClick={isFood ? handleOpenFoodAdd : () => setIsAddOpen(true)}
          className="md:hidden fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform active:scale-95"
        >
          <Plus size={24} className="text-white" />
        </button>
      )}

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

      {/* Нижний лист добавления — фильм */}
      {isAddOpen && isMovies && movieSubTab === 'movies' && (
        <BottomSheet title={t('movies.add')} onClose={() => setIsAddOpen(false)}>
          <AddMovieForm
            personId={person.id}
            categoryId={activeCategoryId}
            isPro={isPro}
            onSuccess={handleItemAdded}
            onCancel={() => setIsAddOpen(false)}
          />
        </BottomSheet>
      )}

      {/* Нижний лист добавления — актёр (Pro) */}
      {isAddOpen && isMovies && movieSubTab === 'actors' && isPro && (
        <BottomSheet title={t('movies.addActor')} onClose={() => setIsAddOpen(false)}>
          <AddActorForm
            personId={person.id}
            categoryId={activeCategoryId}
            onSuccess={handleItemAdded}
            onCancel={() => setIsAddOpen(false)}
          />
        </BottomSheet>
      )}

      {/* Нижний лист редактирования — фильм */}
      {editingItem && isMovies && !isActorItem(editingItem.tags ?? null) && (
        <BottomSheet title={t('movies.edit')} onClose={() => setEditingItem(null)}>
          <AddMovieForm
            personId={person.id}
            categoryId={activeCategoryId}
            item={editingItem}
            isPro={isPro}
            onSuccess={handleItemUpdated}
            onCancel={() => setEditingItem(null)}
          />
        </BottomSheet>
      )}

      {/* Нижний лист редактирования — актёр */}
      {editingItem && isMovies && isActorItem(editingItem.tags ?? null) && (
        <BottomSheet title={t('movies.editActor')} onClose={() => setEditingItem(null)}>
          <AddActorForm
            personId={person.id}
            categoryId={activeCategoryId}
            item={editingItem}
            onSuccess={handleItemUpdated}
            onCancel={() => setEditingItem(null)}
          />
        </BottomSheet>
      )}

      {/* Нижний лист добавления — путешествие */}
      {isAddOpen && isTravel && (
        <BottomSheet title={t('travel.add')} onClose={() => setIsAddOpen(false)}>
          <AddTravelForm
            personId={person.id}
            categoryId={activeCategoryId}
            isPro={isPro}
            onSuccess={handleItemAdded}
            onCancel={() => setIsAddOpen(false)}
          />
        </BottomSheet>
      )}

      {/* Нижний лист редактирования — путешествие */}
      {editingItem && isTravel && (
        <BottomSheet title={t('travel.edit')} onClose={() => setEditingItem(null)}>
          <AddTravelForm
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
  onUpdated: (item: Item) => void
}

function FoodCard({ item, personId, categoryId, onEdit, onDeleted, onUpdated }: FoodCardProps) {
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

  const isPinned = getGiftPinned(item.tags ?? null)

  async function handleTogglePin() {
    setMenuOpen(false)
    try {
      const supabase = createClient()
      const currentTags = (item.tags ?? []) as string[]
      const newTags = isPinned
        ? currentTags.filter((tag) => tag !== 'pinned:true')
        : [...currentTags, 'pinned:true']
      const updated = await updateItem(supabase, item.id, { tags: newTags })
      onUpdated(updated)
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
    <div className={`rounded-[14px] bg-bg-card border p-4 ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      {/* Верхняя строка */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
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
              <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); onEdit() }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
                >
                  <Pencil size={14} className="text-text-secondary" />
                  {t('common.edit')}
                </button>
                <div className="mx-3 h-px bg-border-card" />
                <button
                  onClick={handleTogglePin}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
                >
                  <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
                  {isPinned ? t('common.unpin') : t('common.pin')}
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
  onUpdated: (item: Item) => void
}

function RestaurantCard({ item, personId, categoryId, onEdit, onDeleted, onUpdated }: RestaurantCardProps) {
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

  const isPinned = getGiftPinned(item.tags ?? null)

  async function handleTogglePin() {
    setMenuOpen(false)
    try {
      const supabase = createClient()
      const currentTags = (item.tags ?? []) as string[]
      const newTags = isPinned
        ? currentTags.filter((tag) => tag !== 'pinned:true')
        : [...currentTags, 'pinned:true']
      const updated = await updateItem(supabase, item.id, { tags: newTags })
      onUpdated(updated)
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
          <div className="absolute right-0 bottom-8 z-20 min-w-[160px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
            <button
              onClick={() => { setMenuOpen(false); onEdit() }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
            >
              <Pencil size={14} className="text-text-secondary" />
              {t('common.edit')}
            </button>
            <div className="mx-3 h-px bg-border-card" />
            <button
              onClick={handleTogglePin}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
            >
              <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
              {isPinned ? t('common.unpin') : t('common.pin')}
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
    <div className={`rounded-[14px] bg-bg-card border p-4 ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      {/* Верхняя строка: название + адрес + значок отношения */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
            <span className="font-semibold text-text-primary leading-tight">{item.title}</span>
          </div>
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
  onUpdated: (item: Item) => void
}

function GiftCard({ item, personId, categoryId, onEdit, onDeleted, onUpdated }: GiftCardProps) {
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

  async function handleTogglePin() {
    setMenuOpen(false)
    try {
      const supabase = createClient()
      const currentTags = (item.tags ?? []) as string[]
      const newTags = isPinned
        ? currentTags.filter((tag) => tag !== 'pinned:true')
        : [...currentTags, 'pinned:true']
      const updated = await updateItem(supabase, item.id, { tags: newTags })
      onUpdated(updated)
    } catch {
      toast.error(t('common.error'))
    }
  }

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
    <div className={`absolute right-0 ${pos === 'bottom' ? 'bottom-8' : 'top-8'} z-30 min-w-[160px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden`}>
      <button
        onClick={() => { setMenuOpen(false); onEdit() }}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
      >
        <Pencil size={14} className="text-text-secondary" />
        {t('common.edit')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button
        onClick={handleTogglePin}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
      >
        <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
        {isPinned ? t('common.unpin') : t('common.pin')}
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
                      className="hidden md:flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
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

/* ── Карточка фильма ── */

interface MovieCardProps {
  item: Item
  personId: string
  categoryId: string
  onEdit: () => void
  onDeleted: () => void
  onUpdated: (item: Item) => void
}

function MovieCard({ item, personId, categoryId, onEdit, onDeleted, onUpdated }: MovieCardProps) {
  const t = useTranslations()
  const { isSaving, removeMovie } = useAddMovie(personId, categoryId, () => {})
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
      await removeMovie(item.id)
      onDeleted()
      toast.success(t('movies.deleted'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const genres = getMovieGenres(item.tags ?? null)
  const releaseDate = getMovieReleaseDate(item.tags ?? null)
  const isPinned = getMoviePinned(item.tags ?? null)
  const isWants = item.sentiment === 'wants'
  const isLikes = item.sentiment === 'likes'

  const sentimentCls = isWants
    ? 'bg-wants-bg text-wants'
    : isLikes
    ? 'bg-loves-bg text-loves'
    : 'bg-avoid-bg text-avoid'
  const sentimentLabel = isWants
    ? `🎬 ${t('movies.statusWants')}`
    : isLikes
    ? `✅ ${t('movies.statusLikes')}`
    : `❌ ${t('movies.statusDislikes')}`

  async function handleTogglePin() {
    setMenuOpen(false)
    try {
      const supabase = createClient()
      const currentTags = (item.tags ?? []) as string[]
      const newTags = isPinned
        ? currentTags.filter((tag) => tag !== 'pinned:true')
        : [...currentTags, 'pinned:true']
      const updated = await updateItem(supabase, item.id, { tags: newTags })
      onUpdated(updated)
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <div className={`rounded-[14px] bg-bg-card border p-4 ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-col gap-3 min-w-0">
          {/* Название + статус */}
          <div className="flex items-start gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
              <span className="font-semibold text-text-primary leading-tight">{item.title}</span>
            </div>
            <span className={`flex-shrink-0 rounded-[8px] px-2.5 py-1 text-[11px] font-medium ${sentimentCls}`}>
              {sentimentLabel}
            </span>
          </div>

          {/* Жанры */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <span key={g} className="rounded-[6px] bg-bg-input px-2 py-0.5 text-[11px] text-text-secondary">
                  {t(`movies.genres.${g}` as Parameters<typeof t>[0])}
                </span>
              ))}
            </div>
          )}

          {/* Рейтинги */}
          {(item.my_rating !== null || item.partner_rating !== null) && (
            <div className="flex gap-4">
              {item.my_rating !== null && (
                <RatingDisplay label={t('items.ratings.mine')} value={item.my_rating} />
              )}
              {item.partner_rating !== null && (
                <RatingDisplay label={t('items.ratings.partner')} value={item.partner_rating} />
              )}
            </div>
          )}

          {/* Дата выхода */}
          {releaseDate && (
            <span className="text-xs text-text-secondary">
              📅 {new Date(releaseDate).toLocaleDateString()}
            </span>
          )}

          {/* Комментарий */}
          {item.description && (
            <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Меню */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onEdit() }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
              >
                <Pencil size={14} className="text-text-secondary" />
                {t('common.edit')}
              </button>
              <div className="mx-3 h-px bg-border-card" />
              <button
                onClick={handleTogglePin}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
              >
                <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
                {isPinned ? t('common.unpin') : t('common.pin')}
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

      {/* Подтверждение удаления */}
      {confirmDelete && (
        <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
          <span className="text-sm text-red-500">{t('movies.deleteConfirm')}</span>
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

/* ── Карточка актёра ── */

interface ActorCardProps {
  item: Item
  personId: string
  categoryId: string
  onEdit: () => void
  onDeleted: () => void
  onUpdated: (item: Item) => void
}

function ActorCard({ item, personId, categoryId, onEdit, onDeleted, onUpdated }: ActorCardProps) {
  const t = useTranslations()
  const { isSaving, removeMovie } = useAddMovie(personId, categoryId, () => {})
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
      await removeMovie(item.id)
      onDeleted()
      toast.success(t('movies.actorDeleted'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const films = getActorFilms(item.tags ?? null)
  const isPinned = getMoviePinned(item.tags ?? null)

  async function handleTogglePin() {
    setMenuOpen(false)
    try {
      const supabase = createClient()
      const currentTags = (item.tags ?? []) as string[]
      const newTags = isPinned
        ? currentTags.filter((tag) => tag !== 'pinned:true')
        : [...currentTags, 'pinned:true']
      const updated = await updateItem(supabase, item.id, { tags: newTags })
      onUpdated(updated)
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <div className={`rounded-[14px] bg-bg-card border p-4 ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5">
            {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
            <span className="font-semibold text-text-primary leading-tight">👤 {item.title}</span>
          </div>
          {films.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {films.map((f, i) => (
                <span key={i} className="rounded-[6px] bg-bg-input px-2 py-0.5 text-[11px] text-text-secondary">
                  🎬 {f}
                </span>
              ))}
            </div>
          )}
          {item.description && (
            <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onEdit() }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
              >
                <Pencil size={14} className="text-text-secondary" />
                {t('common.edit')}
              </button>
              <div className="mx-3 h-px bg-border-card" />
              <button
                onClick={handleTogglePin}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
              >
                <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
                {isPinned ? t('common.unpin') : t('common.pin')}
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

      {confirmDelete && (
        <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
          <span className="text-sm text-red-500">{t('movies.deleteConfirm')}</span>
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

/* ── Emoji picker ── */

const EMOJI_DATA: Array<{ e: string; k: string }> = [
  // Популярные
  { e: '📚', k: 'книги учёба чтение books reading study' },
  { e: '🎵', k: 'музыка music song' },
  { e: '🏃', k: 'бег спорт run sport fitness' },
  { e: '💪', k: 'тренировка спорт fitness gym workout' },
  { e: '🎮', k: 'игры games gaming' },
  { e: '🌿', k: 'природа растения nature plants green' },
  { e: '🐾', k: 'животные питомцы pets animals' },
  { e: '✈️', k: 'путешествия travel fly flight' },
  { e: '🛍️', k: 'шоппинг покупки shopping' },
  { e: '🎨', k: 'искусство арт art creative рисование' },
  { e: '🧘', k: 'медитация йога yoga meditation wellness' },
  { e: '💅', k: 'красота beauty nails маникюр' },
  // Еда и напитки
  { e: '🍕', k: 'пицца pizza food еда' },
  { e: '🍣', k: 'суши sushi японская еда' },
  { e: '🍺', k: 'пиво beer drink напитки' },
  { e: '☕', k: 'кофе coffee чай tea' },
  { e: '🍷', k: 'вино wine drink' },
  { e: '🍔', k: 'бургер burger fast food' },
  { e: '🍜', k: 'рамен лапша ramen noodles' },
  { e: '🎂', k: 'торт cake birthday день рождения' },
  { e: '🍩', k: 'пончик donut sweet' },
  { e: '🥗', k: 'салат salad healthy здоровье' },
  { e: '🍰', k: 'пирожное dessert cake sweet' },
  { e: '🧃', k: 'сок juice drink' },
  { e: '🥤', k: 'коктейль cocktail drink smoothie' },
  { e: '🍫', k: 'шоколад chocolate sweet десерт' },
  { e: '🍿', k: 'попкорн popcorn cinema movies' },
  { e: '🍳', k: 'готовка cooking kitchen кухня яйца' },
  { e: '🥩', k: 'мясо meat стейк steak bbq' },
  // Развлечения и хобби
  { e: '🎬', k: 'кино фильмы cinema movies film' },
  { e: '🎭', k: 'театр theatre drama' },
  { e: '🎯', k: 'цель target goal дартс darts' },
  { e: '🎲', k: 'настолки board games dice кости' },
  { e: '🧩', k: 'пазл puzzle games головоломка' },
  { e: '♟️', k: 'шахматы chess strategy' },
  { e: '🎸', k: 'гитара guitar music музыка' },
  { e: '🎹', k: 'пианино piano keyboard music' },
  { e: '🎤', k: 'пение singing karaoke вокал' },
  { e: '🎻', k: 'скрипка violin music' },
  { e: '🥁', k: 'барабаны drums music' },
  { e: '📷', k: 'фото фотография photo photography camera' },
  { e: '✏️', k: 'рисование drawing writing письмо' },
  { e: '📖', k: 'чтение reading book книга' },
  { e: '🖌️', k: 'живопись painting art творчество' },
  { e: '🧵', k: 'шитьё knitting craft рукоделие' },
  { e: '🧶', k: 'вязание knitting craft хобби' },
  // Спорт
  { e: '⚽', k: 'футбол soccer football sport' },
  { e: '🏀', k: 'баскетбол basketball sport' },
  { e: '🎾', k: 'теннис tennis sport' },
  { e: '🏊', k: 'плавание swimming swim sport' },
  { e: '🚴', k: 'велосипед cycling bike sport' },
  { e: '🧗', k: 'скалолазание climbing sport' },
  { e: '⛷️', k: 'лыжи skiing ski sport winter' },
  { e: '🏄', k: 'сёрфинг surfing sport море' },
  { e: '🥊', k: 'бокс boxing sport martial arts' },
  { e: '🏋️', k: 'тренажёрный зал weightlifting gym sport' },
  { e: '🤸', k: 'гимнастика gymnastics sport' },
  { e: '🏇', k: 'верховая езда horse riding equestrian' },
  { e: '🏒', k: 'хоккей hockey sport ice' },
  { e: '🏈', k: 'американский футбол american football sport' },
  { e: '⛳', k: 'гольф golf sport' },
  { e: '🎿', k: 'лыжи ski winter sport' },
  // Природа и путешествия
  { e: '🏔️', k: 'горы mountains travel nature' },
  { e: '🏖️', k: 'пляж beach travel sea море' },
  { e: '🌊', k: 'море волны sea ocean waves' },
  { e: '🌅', k: 'закат рассвет sunset sunrise' },
  { e: '🌲', k: 'лес деревья forest trees nature' },
  { e: '🌸', k: 'цветы flowers spring весна' },
  { e: '🦋', k: 'бабочка butterfly nature' },
  { e: '🌍', k: 'мир world global earth путешествия travel' },
  { e: '🗺️', k: 'карта map travel путешествия' },
  { e: '⛺', k: 'кемпинг camping nature туризм' },
  { e: '🌄', k: 'горный пейзаж mountain landscape nature' },
  { e: '🏕️', k: 'кемпинг camp outdoor природа' },
  { e: '🌺', k: 'цветок flower tropical nature' },
  { e: '🍀', k: 'клевер clover luck природа' },
  { e: '🌻', k: 'подсолнух sunflower flower' },
  // Животные
  { e: '🐕', k: 'собака dog pet питомец' },
  { e: '🐈', k: 'кошка cat pet питомец' },
  { e: '🐇', k: 'кролик rabbit pet' },
  { e: '🐠', k: 'рыбка fish aquarium' },
  { e: '🐦', k: 'птица bird nature' },
  { e: '🐢', k: 'черепаха turtle reptile pet' },
  { e: '🦜', k: 'попугай parrot bird pet' },
  { e: '🐹', k: 'хомяк hamster rodent pet' },
  // Работа и учёба
  { e: '💻', k: 'компьютер computer work работа it' },
  { e: '📊', k: 'статистика charts work business аналитика' },
  { e: '🔬', k: 'наука science research лаборатория' },
  { e: '🏆', k: 'достижения awards trophy победа win' },
  { e: '💡', k: 'идеи ideas creative вдохновение' },
  { e: '🔧', k: 'инструменты tools DIY ремонт' },
  { e: '📝', k: 'заметки notes writing todo список' },
  { e: '🎓', k: 'образование education study graduation' },
  { e: '📐', k: 'математика math geometry design' },
  // Дом и быт
  { e: '🏠', k: 'дом home house' },
  { e: '🛋️', k: 'диван couch home relax отдых' },
  { e: '🌱', k: 'растения plants garden сад' },
  { e: '🧹', k: 'уборка cleaning home порядок' },
  { e: '🧁', k: 'выпечка baking sweet dessert' },
  { e: '🧺', k: 'стирка laundry home' },
  { e: '🪴', k: 'комнатные растения indoor plants' },
  // Красота и стиль
  { e: '💄', k: 'макияж makeup beauty красота' },
  { e: '👗', k: 'одежда fashion мода clothes' },
  { e: '👟', k: 'кроссовки shoes sneakers обувь' },
  { e: '💍', k: 'украшения jewelry accessories' },
  { e: '🛁', k: 'уход spa bath wellness релакс' },
  { e: '👒', k: 'шляпа hat fashion аксессуары' },
  { e: '👜', k: 'сумка bag fashion accessories' },
  // Разное
  { e: '❤️', k: 'любовь love heart сердце' },
  { e: '⭐', k: 'звезда star favorite избранное' },
  { e: '🔥', k: 'огонь fire hot популярное' },
  { e: '💰', k: 'деньги money finance финансы бюджет' },
  { e: '📱', k: 'телефон phone mobile смартфон' },
  { e: '🎁', k: 'подарок gift present' },
  { e: '🎉', k: 'праздник party celebration вечеринка' },
  { e: '🧠', k: 'мозг brain mind knowledge знания' },
  { e: '🌙', k: 'ночь night moon луна сон sleep' },
  { e: '☀️', k: 'солнце sun morning утро' },
  { e: '⚡', k: 'энергия energy lightning электричество' },
  { e: '🎪', k: 'цирк circus entertainment шоу' },
  { e: '🌈', k: 'радуга rainbow colorful яркий' },
  { e: '🏡', k: 'дом загородный house home дача' },
  { e: '🧳', k: 'чемодан suitcase travel поездка trip' },
  { e: '🚗', k: 'машина car auto drive поездка' },
  { e: '🚀', k: 'ракета rocket space космос' },
  { e: '🎠', k: 'карусель merry-go-round entertainment' },
  { e: '🎋', k: 'японская культура japan bamboo zen' },
  { e: '🕯️', k: 'свеча candle romantic уют cozy' },
  { e: '🧸', k: 'медведь teddy bear toy игрушка' },
  { e: '🎃', k: 'хэллоуин halloween autumn осень' },
  { e: '🎄', k: 'новый год christmas tree праздник' },
]

const EMOJI_COLS = 7
const EMOJI_ROWS_DEFAULT = 2

interface EmojiPickerProps {
  value: string
  onChange: (e: string) => void
}

function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const t = useTranslations()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)

  const filtered = search.trim()
    ? EMOJI_DATA.filter((item) =>
        item.k.toLowerCase().includes(search.toLowerCase()) || item.e === search.trim()
      )
    : EMOJI_DATA

  const defaultCount = EMOJI_COLS * EMOJI_ROWS_DEFAULT
  const visible = expanded || search.trim() ? filtered : filtered.slice(0, defaultCount)
  const hasMore = !search.trim() && EMOJI_DATA.length > defaultCount

  return (
    <div className="flex flex-col gap-2">
      {/* Поиск */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('categories.emojiSearch')}
          className="w-full rounded-[10px] bg-bg-input pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">🔍</span>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Сетка эмодзи */}
      <div className={`grid gap-1.5 ${expanded || search.trim() ? 'max-h-48 overflow-y-auto scrollbar-none' : ''}`}
        style={{ gridTemplateColumns: `repeat(${EMOJI_COLS}, minmax(0, 1fr))` }}
      >
        {visible.map((item) => (
          <button
            key={item.e}
            type="button"
            onClick={() => onChange(item.e)}
            className={`flex h-9 w-full items-center justify-center rounded-[10px] text-xl transition-colors ${
              value === item.e ? 'bg-primary/20 ring-1 ring-primary' : 'bg-bg-input hover:bg-bg-hover'
            }`}
          >
            {item.e}
          </button>
        ))}
        {visible.length === 0 && (
          <p className="col-span-7 py-4 text-center text-xs text-text-muted">{t('common.empty')}</p>
        )}
      </div>

      {/* Показать все / скрыть */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors text-center py-1"
        >
          {expanded
            ? t('categories.emojiShowLess')
            : t('categories.emojiShowMore', { count: EMOJI_DATA.length - defaultCount })}
        </button>
      )}

      {/* Своя иконка */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted whitespace-nowrap">{t('categories.emojiCustom')}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => { if (e.target.value.length <= 2) onChange(e.target.value) }}
          placeholder="📁"
          className="w-14 rounded-[10px] bg-bg-input px-2 py-2 text-center text-xl text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  )
}

/* ── Модал редактирования / удаления кастомной категории ── */

interface EditCategoryModalProps {
  category: Category
  onClose: () => void
  onUpdated: (cat: Category) => void
  onDeleted: (id: string) => void
}

function EditCategoryModal({ category, onClose, onUpdated, onDeleted }: EditCategoryModalProps) {
  const t = useTranslations()
  const [name, setName] = useState(category.name)
  const [icon, setIcon] = useState(category.icon ?? '📁')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    if (!name.trim() || isSaving) return
    setIsSaving(true)
    try {
      const supabase = createClient()
      const updated = await updateCustomCategory(supabase, category.id, name.trim(), icon)
      if (updated) onUpdated(updated)
      else toast.error(t('common.error'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsSaving(true)
    try {
      const supabase = createClient()
      await deleteCustomCategory(supabase, category.id)
      onDeleted(category.id)
      toast.success(t('categories.deleted'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary p-6 pb-safe">
        {/* Заголовок */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-[-0.5px] text-text-primary">
            {t('categories.edit')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Иконка */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-widest">
              {t('categories.icon')}
            </p>
            <EmojiPicker value={icon} onChange={setIcon} />
          </div>

          {/* Название */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-widest">
              {t('categories.name')}
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              maxLength={30}
              autoFocus
              className="w-full rounded-[12px] bg-bg-input px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Кнопка сохранить */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="w-full rounded-[12px] bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {isSaving ? '...' : t('common.save')}
          </button>

          {/* Удалить */}
          {confirmDelete ? (
            <div className="flex items-center justify-between rounded-[12px] bg-red-500/10 border border-red-500/20 px-4 py-3">
              <span className="text-sm text-red-500">{t('categories.deleteConfirm')}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-hover transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full rounded-[12px] border border-border py-3 text-sm font-medium text-red-500/80 hover:bg-red-500/5 transition-colors"
            >
              {t('categories.delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Модал добавления кастомной категории ── */

const FREE_CUSTOM_LIMIT = 1

interface AddCategoryModalProps {
  personId: string
  userId: string
  personName: string
  isPro: boolean
  customCategoryCount: number
  onClose: () => void
  onCreated: (cat: Category) => void
}

function AddCategoryModal({ personId, userId, personName, isPro, customCategoryCount, onClose, onCreated }: AddCategoryModalProps) {
  const t = useTranslations()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📁')
  const [scope, setScope] = useState<'one' | 'all'>('one')
  const [isSaving, setIsSaving] = useState(false)
  const isLimited = !isPro && customCategoryCount >= FREE_CUSTOM_LIMIT

  async function handleSave() {
    if (!name.trim() || isSaving) return
    setIsSaving(true)
    try {
      const supabase = createClient()

      if (scope === 'all') {
        // Создаём для всех людей пользователя
        const { data: people } = await supabase
          .from('people')
          .select('id')
          .eq('user_id', userId)

        if (people && people.length > 0) {
          // Создаём для текущего человека первым — он нам нужен для onCreated
          const current = await createCustomCategory(supabase, personId, name.trim(), icon)
          // Остальные — в фоне
          const others = people.filter((p) => p.id !== personId)
          await Promise.all(others.map((p) => createCustomCategory(supabase, p.id, name.trim(), icon)))
          if (current) onCreated(current)
          else toast.error(t('common.error'))
        }
      } else {
        const cat = await createCustomCategory(supabase, personId, name.trim(), icon)
        if (cat) onCreated(cat)
        else toast.error(t('common.error'))
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary p-6 pb-safe">
        {/* Заголовок */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-[-0.5px] text-text-primary">
            {t('categories.addCustom')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover"
          >
            <X size={16} />
          </button>
        </div>

        {isLimited ? (
          /* Paywall для Free */
          <div className="rounded-[16px] border border-primary/20 bg-primary/5 px-5 py-5 text-center">
            <p className="text-2xl mb-3">🔒</p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t('paywall.categoryLimit')}
            </p>
          </div>
        ) : (
          /* Форма */
          <div className="flex flex-col gap-4">
            {/* Выбор иконки */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-widest">
                {t('categories.icon')}
              </p>
              <EmojiPicker value={icon} onChange={setIcon} />
            </div>

            {/* Название */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-widest">
                {t('categories.name')}
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={t('categories.namePlaceholder')}
                maxLength={30}
                autoFocus
                className="w-full rounded-[12px] bg-bg-input px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Для кого */}
            <div className="flex rounded-[12px] bg-bg-input p-1 gap-1">
              <button
                type="button"
                onClick={() => setScope('one')}
                className={`flex-1 rounded-[8px] py-2.5 text-sm font-medium transition-colors ${
                  scope === 'one' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted'
                }`}
              >
                {t('categories.scopeOne', { name: personName })}
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`flex-1 rounded-[8px] py-2.5 text-sm font-medium transition-colors ${
                  scope === 'all' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted'
                }`}
              >
                {t('categories.scopeAll')}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="w-full rounded-[12px] bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {isSaving ? '...' : t('common.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Карточка путешествия ── */

interface TravelCardProps {
  item: Item
  personId: string
  categoryId: string
  onEdit: () => void
  onDeleted: () => void
  onUpdated: (item: Item) => void
}

function TravelCard({ item, personId, categoryId, onEdit, onDeleted, onUpdated }: TravelCardProps) {
  const t = useTranslations()
  const { isSaving, removeTravel } = useAddTravel(personId, categoryId, () => {})
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
      await removeTravel(item.id)
      onDeleted()
      toast.success(t('travel.deleted'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const isPinned = getTravelPinned(item.tags ?? null)

  async function handleTogglePin() {
    setMenuOpen(false)
    try {
      const supabase = createClient()
      const currentTags = (item.tags ?? []) as string[]
      const newTags = isPinned
        ? currentTags.filter((tag) => tag !== 'pinned:true')
        : [...currentTags, 'pinned:true']
      const updated = await updateItem(supabase, item.id, { tags: newTags })
      onUpdated(updated)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const travelCountry = getTravelCountry(item.tags ?? null)
  const travelCity = getTravelCity(item.tags ?? null)
  const travelDate = getTravelDate(item.tags ?? null)
  const budget = getTravelBudget(item.tags ?? null)

  const hasPlanBudget = [budget.plan.hotel, budget.plan.transport, budget.plan.onsite, budget.plan.other].some(v => v !== null)
  const hasActualBudget = [budget.actual.hotel, budget.actual.transport, budget.actual.onsite, budget.actual.other].some(v => v !== null)

  const planTotal = [budget.plan.hotel, budget.plan.transport, budget.plan.onsite, budget.plan.other]
    .filter((v): v is number => v !== null)
    .reduce((s, v) => s + v, 0)
  const actualTotal = [budget.actual.hotel, budget.actual.transport, budget.actual.onsite, budget.actual.other]
    .filter((v): v is number => v !== null)
    .reduce((s, v) => s + v, 0)

  const isVisited = item.sentiment === 'visited'
  const flagEmoji = travelCountry.code ? getFlagEmoji(travelCountry.code) : null

  return (
    <div className={`rounded-[14px] bg-bg-card border p-4 ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      {/* Верхняя строка */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
            {flagEmoji && <span className="text-xl">{flagEmoji}</span>}
            <span className="font-semibold text-text-primary leading-tight">{item.title}</span>
          </div>
          {travelCity && travelCountry.name && travelCity !== item.title && (
            <span className="text-xs text-text-secondary">{travelCity}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Бейдж статуса */}
          <span
            className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium flex-shrink-0 ${
              isVisited ? 'bg-loves-bg text-loves' : 'bg-wants-bg text-wants'
            }`}
          >
            {isVisited ? `✅ ${t('travel.statusVisited')}` : `✈️ ${t('travel.statusWants')}`}
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
              <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); onEdit() }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
                >
                  <Pencil size={14} className="text-text-secondary" />
                  {t('common.edit')}
                </button>
                <div className="mx-3 h-px bg-border-card" />
                <button
                  onClick={handleTogglePin}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors"
                >
                  <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
                  {isPinned ? t('common.unpin') : t('common.pin')}
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

      {/* Дата поездки */}
      {!isVisited && travelDate && (
        <p className="mt-2 text-xs text-text-secondary">
          📅 {new Date(travelDate).toLocaleDateString()}
        </p>
      )}

      {/* Бюджет */}
      {hasPlanBudget && (
        <p className="mt-1.5 text-xs text-text-secondary">
          💰 {t('travel.planBudget')}: {planTotal.toLocaleString()}
        </p>
      )}
      {hasActualBudget && (
        <p className="mt-1.5 text-xs text-text-secondary">
          💸 {t('travel.actualBudget')}: {actualTotal.toLocaleString()}
        </p>
      )}

      {/* Комментарий */}
      {item.description && (
        <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Подтверждение удаления */}
      {confirmDelete && (
        <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
          <span className="text-sm text-red-500">{t('travel.deleteConfirm')}</span>
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
