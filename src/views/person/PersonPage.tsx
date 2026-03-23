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
import { AddPersonForm } from '@/features/add-person'
import { AddRestaurantForm } from '@/features/add-restaurant'
import { useAddRestaurant } from '@/features/add-restaurant/model/useAddRestaurant'
import { AddFoodForm } from '@/features/add-food'
import { useAddFood, getFoodType, getCuisineType, getLinkedRestaurant } from '@/features/add-food'
import { AddGiftForm } from '@/features/add-gift'
import { useAddGift, getGiftPinned, getGiftDate } from '@/features/add-gift'
import { AddMovieForm, AddActorForm, useAddMovie, getMovieGenres, getMovieReleaseDate, isActorItem, getActorFilms, getMoviePinned } from '@/features/add-movie'
import { AddTravelForm, useAddTravel, getTravelPinned, getTravelCity, getTravelCountry, getTravelDate, getTravelBudget, getFlagEmoji } from '@/features/add-travel'
import { AddCustomItemForm, useAddCustomItem, getCustomItemPinned, getCustomItemDate, getCustomItemLikesLabel, getCustomItemDislikesLabel } from '@/features/add-custom-item'
import { useCurrency, formatPrice } from '@/shared/lib/currency'
import { CATEGORY_GRADIENTS, DEFAULT_CATEGORY_GRADIENT, parseCategoryIconField, buildCategoryIconField } from '@/entities/category/model/categoryIcon'
import { EmojiPicker } from '@/shared/ui/EmojiPicker'

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
  // ?section=categoryName|categoryId — переход из Overview или поиска
  // ?highlight=itemId — подсветить карточку (из поиска)
  const addParam = searchParams.get('add')
  const sectionParam = searchParams.get('section')
  const highlightParam = searchParams.get('highlight')

  const targetCategoryId =
    (addParam && (categories.find((c) => c.name === addParam)?.id ?? null)) ||
    (sectionParam && (
      // Сначала ищем по ID (из поиска), потом по name (из Overview)
      categories.find((c) => c.id === sectionParam)?.id ??
      categories.find((c) => c.name === sectionParam)?.id ??
      null
    )) ||
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
  const [showEditPerson, setShowEditPerson] = useState(false)
  const [localPerson, setLocalPerson] = useState(person)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [movieSubTab, setMovieSubTab] = useState<'movies' | 'actors'>('movies')
  const [movieGenreFilter, setMovieGenreFilter] = useState('all')
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(highlightParam)

  // При переходе через ?section= — загружаем items для целевой категории если их нет (начальная загрузка)
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

  // Реагируем на изменение ?section= (навигация из поиска когда уже открыта страница этого человека)
  const prevSectionParamRef = useRef(sectionParam)
  useEffect(() => {
    if (sectionParam === prevSectionParamRef.current) return
    prevSectionParamRef.current = sectionParam
    if (!sectionParam) return
    const cat = localCategories.find((c) => c.id === sectionParam) ?? localCategories.find((c) => c.name === sectionParam)
    if (cat && cat.id !== activeCategoryId) void handleCategoryChange(cat.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionParam])

  // Реагируем на изменение ?highlight= (навигация из поиска когда уже открыта страница)
  const prevHighlightParamRef = useRef(highlightParam)
  useEffect(() => {
    if (highlightParam === prevHighlightParamRef.current) return
    prevHighlightParamRef.current = highlightParam
    if (!highlightParam) return
    setHighlightedItemId(highlightParam)
    const tryScrollNew = (attempts = 0) => {
      const el = document.getElementById(`item-${highlightParam}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => setHighlightedItemId(null), 2500)
      } else if (attempts < 10) {
        setTimeout(() => tryScrollNew(attempts + 1), 150)
      }
    }
    tryScrollNew()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightParam])

  // Скролл к подсвеченной карточке + снятие подсветки через 2.5s (начальная загрузка)
  useEffect(() => {
    if (!highlightParam) return
    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(`item-${highlightParam}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => setHighlightedItemId(null), 2500)
      } else if (attempts < 10) {
        setTimeout(() => tryScroll(attempts + 1), 150)
      }
    }
    tryScroll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeCategory = localCategories.find((c) => c.id === activeCategoryId)
  const allItems = itemsByCategory[activeCategoryId] ?? []

  const isRestaurants = activeCategory?.name === 'restaurants'
  const isFood = activeCategory?.name === 'food'
  const isGifts = activeCategory?.name === 'gifts'
  const isMovies = activeCategory?.name === 'movies'
  const isTravel = activeCategory?.name === 'travel'
  const isCustom = activeCategory?.is_custom ?? false

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
    const aPin = getGiftPinned(a.tags ?? null) || getMoviePinned(a.tags ?? null) || getTravelPinned(a.tags ?? null) || getCustomItemPinned(a.tags ?? null) ? 0 : 1
    const bPin = getGiftPinned(b.tags ?? null) || getMoviePinned(b.tags ?? null) || getTravelPinned(b.tags ?? null) || getCustomItemPinned(b.tags ?? null) ? 0 : 1
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
          <button
            type="button"
            onClick={() => setShowEditPerson(true)}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8735A] to-[#C94F38] text-[18px] font-bold text-white uppercase leading-none overflow-hidden hover:opacity-85 transition-opacity"
          >
            {localPerson.avatar_url
              ? <img src={localPerson.avatar_url} alt={localPerson.name} className="h-full w-full object-cover" />
              : localPerson.name.charAt(0)
            }
          </button>
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.5px] text-text-primary leading-tight">
              {localPerson.name}
            </h1>
            {localPerson.relation && (
              <p className="text-sm text-text-secondary capitalize">
                {['partner', 'friend', 'family', 'other'].includes(localPerson.relation)
                  ? t(`people.relations.${localPerson.relation as 'partner' | 'friend' | 'family' | 'other'}`)
                  : localPerson.relation}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Вкладки категорий */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-5 scrollbar-none">
        {localCategories.map((cat) => {
          const rawIcon = cat.icon ?? CATEGORY_ICONS[cat.name] ?? '📁'
          const icon = cat.is_custom ? parseCategoryIconField(rawIcon).emoji : rawIcon
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

      {/* Модал редактирования человека */}
      {showEditPerson && (
        <BottomSheet title={t('people.editPerson')} onClose={() => setShowEditPerson(false)}>
          <AddPersonForm
            isPro={isPro}
            person={localPerson}
            onSuccess={(updated) => {
              setLocalPerson(updated)
              setShowEditPerson(false)
            }}
            onCancel={() => setShowEditPerson(false)}
          />
        </BottomSheet>
      )}

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

      {/* Фильтр — кастомные категории */}
      {isCustom && allItems.length > 0 && (() => {
        const { likesLabel, dislikesLabel } = parseCategoryIconField(activeCategory?.icon ?? null)
        const likesFilterLabel = likesLabel || t('items.sentiments.likes')
        const dislikesFilterLabel = dislikesLabel || t('items.sentiments.dislikes')
        return (
          <div className="flex gap-2 px-4 pb-4">
            {([
              { key: 'all',      label: t('common.all') },
              { key: 'likes',    label: `❤️ ${likesFilterLabel}` },
              { key: 'dislikes', label: `😕 ${dislikesFilterLabel}` },
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
        )
      })()}

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
            <Link href="/pro" className="block rounded-[16px] border border-primary/20 bg-primary/5 px-5 py-8 text-center hover:border-primary/40 transition-colors">
              <p className="text-3xl mb-3">🎭</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t('movies.actorsPro')}
              </p>
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="mb-3 text-5xl">
                {activeCategory?.is_custom
                  ? parseCategoryIconField(activeCategory.icon ?? null).emoji
                  : (activeCategory?.icon ?? CATEGORY_ICONS[activeCategory?.name ?? ''] ?? '📋')}
              </span>
              <p className="text-sm text-text-muted">{t('common.empty')}</p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const isHighlighted = highlightedItemId === item.id
              return (
                <div
                  key={item.id}
                  id={`item-${item.id}`}
                  className={`rounded-[14px] transition-all duration-300 ${
                    isHighlighted ? 'ring-2 ring-primary/70 ring-offset-2 ring-offset-bg-primary' : ''
                  }`}
                >
                  {isFood ? (
                    <FoodCard
                      item={item}
                      personId={person.id}
                      categoryId={activeCategoryId}
                      onEdit={() => setEditingItem(item)}
                      onDeleted={() => handleItemDeleted(item.id)}
                      onUpdated={handleItemUpdated}
                    />
                  ) : isGifts ? (
                    <GiftCard
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
                        item={item}
                        personId={person.id}
                        categoryId={activeCategoryId}
                        onEdit={() => setEditingItem(item)}
                        onDeleted={() => handleItemDeleted(item.id)}
                        onUpdated={handleItemUpdated}
                      />
                    ) : (
                      <MovieCard
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
                      item={item}
                      personId={person.id}
                      categoryId={activeCategoryId}
                      onEdit={() => setEditingItem(item)}
                      onDeleted={() => handleItemDeleted(item.id)}
                      onUpdated={handleItemUpdated}
                    />
                  ) : isCustom ? (
                    <CustomItemCard
                      item={item}
                      personId={person.id}
                      categoryId={activeCategoryId}
                      categoryIcon={parseCategoryIconField(activeCategory?.icon ?? null).emoji}
                      onEdit={() => setEditingItem(item)}
                      onDeleted={() => handleItemDeleted(item.id)}
                      onUpdated={handleItemUpdated}
                    />
                  ) : (
                    <RestaurantCard
                      item={item}
                      personId={person.id}
                      categoryId={activeCategoryId}
                      onEdit={() => setEditingItem(item)}
                      onDeleted={() => handleItemDeleted(item.id)}
                      onUpdated={handleItemUpdated}
                    />
                  )}
                </div>
              )
            })}
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

      {/* Нижний лист добавления — кастомная категория */}
      {isAddOpen && isCustom && (() => {
        const { likesLabel, dislikesLabel } = parseCategoryIconField(activeCategory?.icon ?? null)
        return (
          <BottomSheet title={t('customItem.add')} onClose={() => setIsAddOpen(false)}>
            <AddCustomItemForm
              personId={person.id}
              categoryId={activeCategoryId}
              isPro={isPro}
              defaultLikesLabel={likesLabel}
              defaultDislikesLabel={dislikesLabel}
              onSuccess={handleItemAdded}
              onCancel={() => setIsAddOpen(false)}
            />
          </BottomSheet>
        )
      })()}

      {/* Нижний лист редактирования — кастомная категория */}
      {editingItem && isCustom && (() => {
        const { likesLabel, dislikesLabel } = parseCategoryIconField(activeCategory?.icon ?? null)
        return (
          <BottomSheet title={t('customItem.edit')} onClose={() => setEditingItem(null)}>
            <AddCustomItemForm
              personId={person.id}
              categoryId={activeCategoryId}
              item={editingItem}
              isPro={isPro}
              defaultLikesLabel={likesLabel}
              defaultDislikesLabel={dislikesLabel}
              onSuccess={handleItemUpdated}
              onCancel={() => setEditingItem(null)}
            />
          </BottomSheet>
        )
      })()}
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
  const desktopMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (!desktopMenuRef.current?.contains(target) && !mobileMenuRef.current?.contains(target)) setMenuOpen(false)
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

  const foodStatusBadge = (
    <span className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${isLikes ? 'bg-loves-bg text-loves' : 'bg-avoid-bg text-avoid'}`}>
      {isLikes ? `❤️ ${t('items.sentiments.likes')}` : `😕 ${t('items.sentiments.dislikes')}`}
    </span>
  )

  const foodMenuDropdown = (pos: 'top' | 'bottom') => menuOpen && (
    <div className={`absolute right-0 ${pos === 'bottom' ? 'bottom-8' : 'top-8'} z-30 w-max min-w-[180px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden [&_button]:whitespace-nowrap`}>
      <button onClick={() => { setMenuOpen(false); onEdit() }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Pencil size={14} className="text-text-secondary" />{t('common.edit')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={handleTogglePin} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
        {isPinned ? t('common.unpin') : t('common.pin')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={() => { setMenuOpen(false); setConfirmDelete(true) }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
        <Trash2 size={14} />{t('common.delete')}
      </button>
    </div>
  )

  return (
    <div className={`rounded-[14px] bg-bg-card border ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      <div className="p-4 pb-3">
        <div className="flex items-start gap-2">
          <div className="flex flex-1 flex-col gap-1 min-w-0">
            {/* Название */}
            <div className="flex items-center gap-1.5 min-w-0">
              {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
              <span className="font-semibold text-text-primary leading-tight truncate">{item.title}</span>
            </div>
            {/* Типы — под названием */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded-[6px] bg-bg-input px-1.5 py-0.5 text-[10px] text-text-muted whitespace-nowrap">{typeLabel}</span>
              {cuisineType && (
                <span className="rounded-[6px] bg-bg-input px-1.5 py-0.5 text-[10px] text-text-secondary whitespace-nowrap">{cuisineType}</span>
              )}
            </div>
            {linkedRestaurant && (
              <span className="text-xs text-text-secondary truncate">🍴 {linkedRestaurant.name}</span>
            )}
          </div>
          {/* Десктоп: статус + меню */}
          <div className="hidden md:flex flex-shrink-0 items-start gap-1.5" ref={desktopMenuRef}>
            {foodStatusBadge}
            <div className="relative">
              <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary">
                <MoreVertical size={15} />
              </button>
              {foodMenuDropdown('top')}
            </div>
          </div>
        </div>

        {/* Комментарий */}
        {item.description && (
          <p className="mt-2 text-[13px] text-text-secondary leading-relaxed line-clamp-3">{item.description}</p>
        )}

        {/* Подтверждение удаления */}
        {confirmDelete && (
          <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
            <span className="text-sm text-red-500">{t('food.deleteConfirm')}</span>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors">{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={isSaving} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {isSaving ? '...' : t('common.delete')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Мобильная нижняя полоска */}
      <div className="md:hidden flex items-center border-t border-border-card">
        <div className="flex flex-1 items-center px-3 py-2.5">{foodStatusBadge}</div>
        <div className="w-px h-7 flex-shrink-0 bg-border-card" />
        <div className="relative flex items-center" ref={mobileMenuRef}>
          <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-10 w-11 items-center justify-center text-text-muted transition-colors hover:text-text-secondary">
            <MoreVertical size={15} />
          </button>
          {foodMenuDropdown('bottom')}
        </div>
      </div>
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
  const restDesktopRef = useRef<HTMLDivElement>(null)
  const restMobileRef = useRef<HTMLDivElement>(null)

  // Закрываем меню по клику снаружи
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      const t = e.target as Node
      if (!restDesktopRef.current?.contains(t) && !restMobileRef.current?.contains(t)) {
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

  const restStatusBadge = (
    <span className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${isVisited ? 'bg-loves-bg text-loves' : 'bg-wants-bg text-wants'}`}>
      {isVisited ? t('items.sentiments.visited') : t('items.sentiments.wants')}
    </span>
  )

  const restMenuDropdown = (pos: 'top' | 'bottom') => menuOpen && (
    <div className={`absolute right-0 ${pos === 'bottom' ? 'bottom-8' : 'top-8'} z-30 w-max min-w-[180px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden [&_button]:whitespace-nowrap`}>
      <button onClick={() => { setMenuOpen(false); onEdit() }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Pencil size={14} className="text-text-secondary" />{t('common.edit')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={handleTogglePin} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
        {isPinned ? t('common.unpin') : t('common.pin')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={() => { setMenuOpen(false); setConfirmDelete(true) }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
        <Trash2 size={14} />{t('common.delete')}
      </button>
    </div>
  )

  return (
    <div className={`rounded-[14px] bg-bg-card border ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      <div className="p-4 pb-3">
        {/* Верхняя строка */}
        <div className="flex items-start gap-2">
          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
              <span className="font-semibold text-text-primary leading-tight truncate">{item.title}</span>
            </div>
            {addressTag && (
              <span className="text-xs text-text-secondary truncate">{addressTag}</span>
            )}
          </div>
          {/* Десктоп: статус + меню */}
          <div className="hidden md:flex flex-shrink-0 items-start gap-1.5" ref={restDesktopRef}>
            {restStatusBadge}
            <div className="relative">
              <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary">
                <MoreVertical size={15} />
              </button>
              {restMenuDropdown('top')}
            </div>
          </div>
        </div>

        {/* Рейтинги */}
        {hasRatings && (
          <div className="mt-3 flex gap-4 border-t border-border-card pt-3">
            {item.my_rating !== null && <RatingDisplay label={t('items.ratings.mine')} value={item.my_rating} />}
            {item.partner_rating !== null && <RatingDisplay label={t('items.ratings.partner')} value={item.partner_rating} />}
          </div>
        )}

        {/* Комментарий */}
        {item.description && (
          <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">{item.description}</p>
        )}

        {/* Десктоп: ссылка */}
        {item.external_url && (
          <a href={item.external_url} target="_blank" rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 mt-2 text-xs text-text-muted hover:text-text-secondary transition-colors">
            <ExternalLink size={12} />
            {item.external_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
          </a>
        )}

        {/* Подтверждение удаления */}
        {confirmDelete && (
          <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
            <span className="text-sm text-red-500">{t('restaurants.deleteConfirm')}</span>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors">{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={isSaving} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {isSaving ? '...' : t('common.delete')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Мобильная нижняя полоска */}
      <div className="md:hidden flex items-center border-t border-border-card">
        <div className="flex flex-1 items-center px-3 py-2.5">{restStatusBadge}</div>
        {item.external_url && (
          <>
            <div className="w-px h-7 flex-shrink-0 bg-border-card" />
            <a href={item.external_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap">
              <ExternalLink size={13} />{t('items.link')}
            </a>
          </>
        )}
        <div className="w-px h-7 flex-shrink-0 bg-border-card" />
        <div className="relative flex items-center" ref={restMobileRef}>
          <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-10 w-11 items-center justify-center text-text-muted transition-colors hover:text-text-secondary">
            <MoreVertical size={15} />
          </button>
          {restMenuDropdown('bottom')}
        </div>
      </div>
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
    <div className={`absolute right-0 ${pos === 'bottom' ? 'bottom-8' : 'top-8'} z-30 w-max min-w-[180px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden [&_button]:whitespace-nowrap`}>
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
        <div className="flex flex-1 items-center px-3 py-2.5">
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

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (!movieDesktopRef.current?.contains(target) && !movieMobileRef.current?.contains(target)) setMenuOpen(false)
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

  const movieDesktopRef = useRef<HTMLDivElement>(null)
  const movieMobileRef = useRef<HTMLDivElement>(null)

  const movieStatusBadge = (
    <span className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${sentimentCls}`}>
      {sentimentLabel}
    </span>
  )

  const movieMenuDropdown = (pos: 'top' | 'bottom') => menuOpen && (
    <div className={`absolute right-0 ${pos === 'bottom' ? 'bottom-8' : 'top-8'} z-30 w-max min-w-[180px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden [&_button]:whitespace-nowrap`}>
      <button onClick={() => { setMenuOpen(false); onEdit() }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Pencil size={14} className="text-text-secondary" />{t('common.edit')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={handleTogglePin} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
        {isPinned ? t('common.unpin') : t('common.pin')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={() => { setMenuOpen(false); setConfirmDelete(true) }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
        <Trash2 size={14} />{t('common.delete')}
      </button>
    </div>
  )

  return (
    <div className={`rounded-[14px] bg-bg-card border ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      <div className="p-4 pb-3">
        <div className="flex items-start gap-2">
          <div className="flex flex-1 flex-col gap-3 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
              <span className="font-semibold text-text-primary leading-tight truncate">{item.title}</span>
            </div>
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => (
                  <span key={g} className="rounded-[6px] bg-bg-input px-2 py-0.5 text-[11px] text-text-secondary whitespace-nowrap">
                    {t(`movies.genres.${g}` as Parameters<typeof t>[0])}
                  </span>
                ))}
              </div>
            )}
            {(item.my_rating !== null || item.partner_rating !== null) && (
              <div className="flex gap-4">
                {item.my_rating !== null && <RatingDisplay label={t('items.ratings.mine')} value={item.my_rating} />}
                {item.partner_rating !== null && <RatingDisplay label={t('items.ratings.partner')} value={item.partner_rating} />}
              </div>
            )}
            {releaseDate && (
              <span className="text-xs text-text-secondary">📅 {new Date(releaseDate).toLocaleDateString()}</span>
            )}
            {item.description && (
              <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">{item.description}</p>
            )}
          </div>
          {/* Десктоп: статус + меню */}
          <div className="hidden md:flex flex-shrink-0 items-start gap-1.5" ref={movieDesktopRef}>
            {movieStatusBadge}
            <div className="relative">
              <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary">
                <MoreVertical size={15} />
              </button>
              {movieMenuDropdown('top')}
            </div>
          </div>
        </div>

        {confirmDelete && (
          <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
            <span className="text-sm text-red-500">{t('movies.deleteConfirm')}</span>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors">{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={isSaving} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {isSaving ? '...' : t('common.delete')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Мобильная нижняя полоска */}
      <div className="md:hidden flex items-center border-t border-border-card">
        <div className="flex flex-1 items-center px-3 py-2.5">{movieStatusBadge}</div>
        <div className="w-px h-7 flex-shrink-0 bg-border-card" />
        <div className="relative flex items-center" ref={movieMobileRef}>
          <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-10 w-11 items-center justify-center text-text-muted transition-colors hover:text-text-secondary">
            <MoreVertical size={15} />
          </button>
          {movieMenuDropdown('bottom')}
        </div>
      </div>
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
  const actorDesktopRef = useRef<HTMLDivElement>(null)
  const actorMobileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (!actorDesktopRef.current?.contains(target) && !actorMobileRef.current?.contains(target)) setMenuOpen(false)
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
  const isLikes = item.sentiment === 'likes'
  const isDislikes = item.sentiment === 'dislikes'

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

  const actorSentimentBadge = (isLikes || isDislikes) ? (
    <span className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${isLikes ? 'bg-loves-bg text-loves' : 'bg-avoid-bg text-avoid'}`}>
      {isLikes ? `❤️ ${t('items.sentiments.likes')}` : `😕 ${t('items.sentiments.dislikes')}`}
    </span>
  ) : null

  const actorMenuDropdown = (pos: 'top' | 'bottom') => menuOpen && (
    <div className={`absolute right-0 ${pos === 'bottom' ? 'bottom-8' : 'top-8'} z-30 w-max min-w-[180px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden [&_button]:whitespace-nowrap`}>
      <button onClick={() => { setMenuOpen(false); onEdit() }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Pencil size={14} className="text-text-secondary" />{t('common.edit')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={handleTogglePin} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
        {isPinned ? t('common.unpin') : t('common.pin')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={() => { setMenuOpen(false); setConfirmDelete(true) }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
        <Trash2 size={14} />{t('common.delete')}
      </button>
    </div>
  )

  return (
    <div className={`rounded-[14px] bg-bg-card border ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      <div className="p-4 pb-3">
        <div className="flex items-start gap-2">
          <div className="flex flex-1 flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
              <span className="font-semibold text-text-primary leading-tight truncate">👤 {item.title}</span>
            </div>
            {films.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {films.map((f, i) => (
                  <span key={i} className="rounded-[6px] bg-bg-input px-2 py-0.5 text-[11px] text-text-secondary whitespace-nowrap">
                    🎬 {f}
                  </span>
                ))}
              </div>
            )}
            {item.description && (
              <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">{item.description}</p>
            )}
          </div>
          {/* Десктоп: статус + меню */}
          <div className="hidden md:flex flex-shrink-0 items-start gap-1.5" ref={actorDesktopRef}>
            {actorSentimentBadge}
            <div className="relative">
              <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary">
                <MoreVertical size={15} />
              </button>
              {actorMenuDropdown('top')}
            </div>
          </div>
        </div>

        {confirmDelete && (
          <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
            <span className="text-sm text-red-500">{t('movies.deleteConfirm')}</span>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors">{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={isSaving} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {isSaving ? '...' : t('common.delete')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Мобильная нижняя полоска */}
      <div className="md:hidden flex items-center border-t border-border-card">
        <div className="flex flex-1 items-center px-3 py-2.5">
          {actorSentimentBadge ?? <span className="text-[11px] text-text-muted">👤</span>}
        </div>
        <div className="w-px h-7 flex-shrink-0 bg-border-card" />
        <div className="relative flex items-center" ref={actorMobileRef}>
          <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-10 w-11 items-center justify-center text-text-muted transition-colors hover:text-text-secondary">
            <MoreVertical size={15} />
          </button>
          {actorMenuDropdown('bottom')}
        </div>
      </div>
    </div>
  )
}

/* ── Карточка кастомного элемента ── */

interface CustomItemCardProps {
  item: Item
  personId: string
  categoryId: string
  categoryIcon: string
  onEdit: () => void
  onDeleted: () => void
  onUpdated: (item: Item) => void
}

function CustomItemCard({ item, personId, categoryId, categoryIcon, onEdit, onDeleted, onUpdated }: CustomItemCardProps) {
  const t = useTranslations()
  const { isSaving, removeCustomItem } = useAddCustomItem(personId, categoryId, () => {})
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const customDesktopRef = useRef<HTMLDivElement>(null)
  const customMobileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (!customDesktopRef.current?.contains(target) && !customMobileRef.current?.contains(target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleDelete() {
    try {
      await removeCustomItem(item.id)
      onDeleted()
      toast.success(t('customItem.deleted'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const isPinned = getCustomItemPinned(item.tags ?? null)
  const customDate = getCustomItemDate(item.tags ?? null)
  const likesLabel = getCustomItemLikesLabel(item.tags ?? null)
  const dislikesLabel = getCustomItemDislikesLabel(item.tags ?? null)
  const isLikes = item.sentiment === 'likes'
  const hasRatings = item.my_rating !== null || item.partner_rating !== null

  const sentimentText = isLikes
    ? (likesLabel || t('items.sentiments.likes'))
    : (dislikesLabel || t('items.sentiments.dislikes'))

  const sentimentCls = isLikes ? 'bg-loves-bg text-loves' : 'bg-avoid-bg text-avoid'

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

  const customStatusBadge = (
    <span className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${sentimentCls}`}>
      {isLikes ? '❤️' : '😕'} {sentimentText}
    </span>
  )

  const customMenuDropdown = (pos: 'top' | 'bottom') => menuOpen && (
    <div className={`absolute right-0 ${pos === 'bottom' ? 'bottom-8' : 'top-8'} z-30 w-max min-w-[180px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden [&_button]:whitespace-nowrap`}>
      <button onClick={() => { setMenuOpen(false); onEdit() }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Pencil size={14} className="text-text-secondary" />{t('common.edit')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={handleTogglePin} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
        {isPinned ? t('common.unpin') : t('common.pin')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={() => { setMenuOpen(false); setConfirmDelete(true) }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
        <Trash2 size={14} />{t('common.delete')}
      </button>
    </div>
  )

  return (
    <div className={`rounded-[14px] bg-bg-card border ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      <div className="p-4 pb-3">
        <div className="flex items-start gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-bg-input text-lg">
              {categoryIcon}
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
                <span className="font-semibold text-text-primary leading-tight truncate">{item.title}</span>
              </div>
              {customDate && (
                <span className="text-xs text-text-muted">📅 {customDate}</span>
              )}
            </div>
          </div>
          {/* Десктоп: статус + меню */}
          <div className="hidden md:flex flex-shrink-0 items-start gap-1.5" ref={customDesktopRef}>
            {customStatusBadge}
            <div className="relative">
              <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary">
                <MoreVertical size={15} />
              </button>
              {customMenuDropdown('top')}
            </div>
          </div>
        </div>

        {item.description && (
          <p className="mt-2 text-[13px] text-text-secondary leading-relaxed line-clamp-3">{item.description}</p>
        )}
        {hasRatings && (
          <div className="mt-3 flex gap-4 border-t border-border-card pt-3">
            {item.my_rating !== null && <RatingDisplay label={t('items.ratings.mine')} value={item.my_rating} />}
            {item.partner_rating !== null && <RatingDisplay label={t('items.ratings.partner')} value={item.partner_rating} />}
          </div>
        )}
        {confirmDelete && (
          <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
            <span className="text-sm text-red-500">{t('customItem.deleteConfirm')}</span>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors">{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={isSaving} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {isSaving ? '...' : t('common.delete')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Мобильная нижняя полоска */}
      <div className="md:hidden flex items-center border-t border-border-card">
        <div className="flex flex-1 items-center px-3 py-2.5">{customStatusBadge}</div>
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
        <div className="w-px h-7 flex-shrink-0 bg-border-card" />
        <div className="relative flex items-center" ref={customMobileRef}>
          <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-10 w-11 items-center justify-center text-text-muted transition-colors hover:text-text-secondary">
            <MoreVertical size={15} />
          </button>
          {customMenuDropdown('bottom')}
        </div>
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
  const parsed = parseCategoryIconField(category.icon ?? null)
  const [colorKey, setColorKey] = useState(() => {
    const raw = category.icon ?? ''
    // Strip labels part before parsing color key
    const pipeIdx = raw.indexOf('|')
    const iconPart = pipeIdx > 0 ? raw.slice(0, pipeIdx) : raw
    const colonIdx = iconPart.indexOf(':')
    if (colonIdx > 0 && colonIdx <= 8) {
      const key = iconPart.slice(0, colonIdx)
      if (CATEGORY_GRADIENTS.some((g) => g.key === key)) return key
    }
    return 'gray'
  })
  const [icon, setIcon] = useState(parsed.emoji === '📋' ? '📁' : parsed.emoji)
  const [likesLabel, setLikesLabel] = useState(parsed.likesLabel)
  const [dislikesLabel, setDislikesLabel] = useState(parsed.dislikesLabel)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    if (!name.trim() || isSaving) return
    setIsSaving(true)
    try {
      const supabase = createClient()
      const updated = await updateCustomCategory(supabase, category.id, name.trim(), buildCategoryIconField(colorKey, icon, likesLabel, dislikesLabel))
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
      <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary p-6 pb-safe max-h-[90vh] overflow-y-auto">
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
          {/* Цвет карточки */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-widest">
              {t('categories.color')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_GRADIENTS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setColorKey(g.key)}
                  className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 active:scale-95"
                  style={{ background: g.gradient }}
                >
                  {colorKey === g.key && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

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

          {/* Статусы */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-widest">
              {t('categories.customStatuses')}
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-[12px] bg-bg-input px-3 py-2.5">
                <span className="text-sm flex-shrink-0">❤️</span>
                <input
                  type="text"
                  value={likesLabel}
                  onChange={(e) => setLikesLabel(e.target.value)}
                  placeholder={t('categories.likesLabelPlaceholder')}
                  maxLength={20}
                  className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-[12px] bg-bg-input px-3 py-2.5">
                <span className="text-sm flex-shrink-0">😕</span>
                <input
                  type="text"
                  value={dislikesLabel}
                  onChange={(e) => setDislikesLabel(e.target.value)}
                  placeholder={t('categories.dislikesLabelPlaceholder')}
                  maxLength={20}
                  className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
              </div>
            </div>
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
  const [colorKey, setColorKey] = useState('gray')
  const [likesLabel, setLikesLabel] = useState('')
  const [dislikesLabel, setDislikesLabel] = useState('')
  const [scope, setScope] = useState<'one' | 'all'>('one')
  const [isSaving, setIsSaving] = useState(false)
  const isLimited = !isPro && customCategoryCount >= FREE_CUSTOM_LIMIT

  async function handleSave() {
    if (!name.trim() || isSaving) return
    setIsSaving(true)
    const iconField = buildCategoryIconField(colorKey, icon, likesLabel, dislikesLabel)
    try {
      const supabase = createClient()

      if (scope === 'all') {
        const { data: people } = await supabase
          .from('people')
          .select('id')
          .eq('user_id', userId)

        if (people && people.length > 0) {
          const current = await createCustomCategory(supabase, personId, name.trim(), iconField)
          const others = people.filter((p) => p.id !== personId)
          await Promise.all(others.map((p) => createCustomCategory(supabase, p.id, name.trim(), iconField)))
          if (current) onCreated(current)
          else toast.error(t('common.error'))
        }
      } else {
        const cat = await createCustomCategory(supabase, personId, name.trim(), iconField)
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
      <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary p-6 pb-safe max-h-[90vh] overflow-y-auto">
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
          <Link href="/pro" className="block rounded-[16px] border border-primary/20 bg-primary/5 px-5 py-5 text-center hover:border-primary/40 transition-colors">
            <p className="text-2xl mb-3">🔒</p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t('paywall.categoryLimit')}
            </p>
          </Link>
        ) : (
          /* Форма */
          <div className="flex flex-col gap-4">
            {/* Цвет карточки */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-widest">
                {t('categories.color')}
              </p>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_GRADIENTS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setColorKey(g.key)}
                    className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 active:scale-95"
                    style={{ background: g.gradient }}
                  >
                    {colorKey === g.key && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

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

            {/* Статусы */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-widest">
                {t('categories.customStatuses')}
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-[12px] bg-bg-input px-3 py-2.5">
                  <span className="text-sm flex-shrink-0">❤️</span>
                  <input
                    type="text"
                    value={likesLabel}
                    onChange={(e) => setLikesLabel(e.target.value)}
                    placeholder={t('categories.likesLabelPlaceholder')}
                    maxLength={20}
                    className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-[12px] bg-bg-input px-3 py-2.5">
                  <span className="text-sm flex-shrink-0">😕</span>
                  <input
                    type="text"
                    value={dislikesLabel}
                    onChange={(e) => setDislikesLabel(e.target.value)}
                    placeholder={t('categories.dislikesLabelPlaceholder')}
                    maxLength={20}
                    className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                  />
                </div>
              </div>
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
  const travelDesktopRef = useRef<HTMLDivElement>(null)
  const travelMobileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (!travelDesktopRef.current?.contains(target) && !travelMobileRef.current?.contains(target)) setMenuOpen(false)
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

  const planValues = [budget.plan.hotel, budget.plan.transport, budget.plan.onsite, budget.plan.other, ...budget.plan.customItems.map(i => i.amount)]
  const actualValues = [budget.actual.hotel, budget.actual.transport, budget.actual.onsite, budget.actual.other, ...budget.actual.customItems.map(i => i.amount)]

  const hasPlanBudget = planValues.some(v => v !== null)
  const hasActualBudget = actualValues.some(v => v !== null)

  const planTotal = planValues.filter((v): v is number => v !== null).reduce((s, v) => s + v, 0)
  const actualTotal = actualValues.filter((v): v is number => v !== null).reduce((s, v) => s + v, 0)

  const isVisited = item.sentiment === 'visited'
  const isBooked = !isVisited && (item.tags ?? []).includes('trip_booked:true')
  const flagEmoji = travelCountry.code ? getFlagEmoji(travelCountry.code) : null

  const travelStatusBadge = (
    <span
      className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${isVisited ? 'bg-loves-bg text-loves' : isBooked ? 'bg-wants-bg text-wants' : ''}`}
      style={!isVisited && !isBooked ? { background: 'var(--travel-wants-bg)', color: 'var(--travel-wants-text)' } : undefined}
    >
      {isVisited ? `✅ ${t('travel.statusVisited')}` : isBooked ? `🎟️ ${t('travel.statusBooked')}` : `✈️ ${t('travel.statusWants')}`}
    </span>
  )

  const travelMenuDropdown = (pos: 'top' | 'bottom') => menuOpen && (
    <div className={`absolute right-0 ${pos === 'bottom' ? 'bottom-8' : 'top-8'} z-30 w-max min-w-[180px] rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden [&_button]:whitespace-nowrap`}>
      <button onClick={() => { setMenuOpen(false); onEdit() }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Pencil size={14} className="text-text-secondary" />{t('common.edit')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={handleTogglePin} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors">
        <Star size={14} className={isPinned ? 'fill-primary text-primary' : 'text-text-secondary'} />
        {isPinned ? t('common.unpin') : t('common.pin')}
      </button>
      <div className="mx-3 h-px bg-border-card" />
      <button onClick={() => { setMenuOpen(false); setConfirmDelete(true) }} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
        <Trash2 size={14} />{t('common.delete')}
      </button>
    </div>
  )

  return (
    <div className={`rounded-[14px] bg-bg-card border ${isPinned ? 'border-primary/30' : 'border-border-card'}`}>
      <div className="p-4 pb-3">
        <div className="flex items-start gap-2">
          <div className="flex flex-1 flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {isPinned && <Star size={12} className="flex-shrink-0 fill-primary text-primary" />}
              {flagEmoji && <span className="text-xl flex-shrink-0">{flagEmoji}</span>}
              <span className="font-semibold text-text-primary leading-tight truncate">{item.title}</span>
            </div>
            {travelCity && travelCountry.name && travelCity !== item.title && (
              <span className="text-xs text-text-secondary truncate">{travelCity}</span>
            )}
          </div>
          {/* Десктоп: статус + меню */}
          <div className="hidden md:flex flex-shrink-0 items-start gap-1.5" ref={travelDesktopRef}>
            {travelStatusBadge}
            <div className="relative">
              <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary">
                <MoreVertical size={15} />
              </button>
              {travelMenuDropdown('top')}
            </div>
          </div>
        </div>

        {!isVisited && travelDate && (
          <p className="mt-2 text-xs text-text-secondary">📅 {new Date(travelDate).toLocaleDateString()}</p>
        )}
        {hasPlanBudget && (
          <p className="mt-1.5 text-xs text-text-secondary">💰 {t('travel.planBudget')}: {planTotal.toLocaleString()}</p>
        )}
        {hasActualBudget && (
          <p className="mt-1.5 text-xs text-text-secondary">💸 {t('travel.actualBudget')}: {actualTotal.toLocaleString()}</p>
        )}
        {item.description && (
          <p className="mt-2 text-[13px] text-text-secondary leading-relaxed line-clamp-3">{item.description}</p>
        )}

        {confirmDelete && (
          <div className="mt-3 flex items-center justify-between rounded-[10px] bg-red-500/10 px-3 py-2.5 border border-red-500/20">
            <span className="text-sm text-red-500">{t('travel.deleteConfirm')}</span>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors">{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={isSaving} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {isSaving ? '...' : t('common.delete')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Мобильная нижняя полоска */}
      <div className="md:hidden flex items-center border-t border-border-card">
        <div className="flex flex-1 items-center px-3 py-2.5">{travelStatusBadge}</div>
        <div className="w-px h-7 flex-shrink-0 bg-border-card" />
        <div className="relative flex items-center" ref={travelMobileRef}>
          <button onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }} className="flex h-10 w-11 items-center justify-center text-text-muted transition-colors hover:text-text-secondary">
            <MoreVertical size={15} />
          </button>
          {travelMenuDropdown('bottom')}
        </div>
      </div>
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
