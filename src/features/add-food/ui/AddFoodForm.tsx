'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Item } from '@/entities/item/model/types'
import { useAddFood, getFoodType, getCuisineType, getLinkedRestaurant } from '../model/useAddFood'
import type { FoodFormValues, FoodItemType } from '../model/useAddFood'

interface AddFoodFormProps {
  personId: string
  categoryId: string
  availableRestaurants?: Item[]
  item?: Item
  onSuccess: (item: Item) => void
  onCancel: () => void
}

export function AddFoodForm({
  personId,
  categoryId,
  availableRestaurants = [],
  item,
  onSuccess,
  onCancel,
}: AddFoodFormProps) {
  const t = useTranslations()
  const isEdit = !!item
  const { isSaving, saveFood, editFood } = useAddFood(personId, categoryId, onSuccess)

  const existingLinked = item ? getLinkedRestaurant(item.tags ?? null) : null

  const [type, setType] = useState<FoodItemType>(
    item ? getFoodType(item.tags ?? null) : 'dish'
  )
  const [title, setTitle] = useState(item?.title ?? '')
  const [sentiment, setSentiment] = useState<'likes' | 'dislikes'>(
    item?.sentiment === 'dislikes' ? 'dislikes' : 'likes'
  )
  const [comment, setComment] = useState(item?.description ?? '')
  const [cuisineType, setCuisineType] = useState(getCuisineType(item?.tags ?? null))

  // Выбор ресторана — храним и id, и название в состоянии, чтобы не искать при сабмите
  const [linkedRestaurantId, setLinkedRestaurantId] = useState<string | null>(existingLinked?.id ?? null)
  const [linkedRestaurantName, setLinkedRestaurantName] = useState<string | null>(existingLinked?.name ?? null)

  // Состояние раскрывающегося выбора ресторана
  const [restaurantOpen, setRestaurantOpen] = useState(false)
  const [restaurantSearch, setRestaurantSearch] = useState('')

  // Состояние выбора кухни
  const [cuisineOpen, setCuisineOpen] = useState(false)
  const [cuisineSearch, setCuisineSearch] = useState('')

  const filteredRestaurants = availableRestaurants.filter((r) =>
    r.title.toLowerCase().includes(restaurantSearch.toLowerCase())
  )

  function selectRestaurant(id: string | null, name: string | null) {
    setLinkedRestaurantId(id)
    setLinkedRestaurantName(name)
    setRestaurantOpen(false)
    setRestaurantSearch('')
  }

  function handleTypeChange(newType: FoodItemType) {
    setType(newType)
    if (newType !== 'dish') {
      setLinkedRestaurantId(null)
      setLinkedRestaurantName(null)
      setCuisineType('')
    }
    // При переключении на/с типа "кухня" сбрасываем название, чтобы избежать несоответствия
    if (newType === 'cuisine' || type === 'cuisine') {
      setTitle('')
      setCuisineSearch('')
      setCuisineOpen(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error(t('food.nameRequired')); return }

    const values: FoodFormValues = {
      title,
      type,
      sentiment,
      comment,
      cuisineType,
      linkedRestaurantId,
      linkedRestaurantName,
    }

    try {
      if (isEdit) {
        await editFood(item.id, values)
        toast.success(t('food.updated'))
      } else {
        await saveFood(values)
        toast.success(t('food.added'))
      }
    } catch {
      toast.error(t('common.error'))
    }
  }

  const typeOptions: { value: FoodItemType; emoji: string; label: string }[] = [
    { value: 'dish',      emoji: '🍽️', label: t('food.types.dish') },
    { value: 'food_type', emoji: '🥗', label: t('food.types.food_type') },
    { value: 'cuisine',   emoji: '🍜', label: t('food.types.cuisine') },
  ]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Выбор типа */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('food.type')}
        </label>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map(({ value, emoji, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={`h-9 flex-shrink-0 whitespace-nowrap rounded-[20px] px-4 text-[13px] font-medium transition-colors ${
                type === value
                  ? 'bg-primary text-white'
                  : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Название — свободный ввод для блюда/типа еды, выбор из списка для кухни */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {type === 'cuisine' ? t('food.cuisineTitle') : t('items.title')} *
        </label>

        {type === 'cuisine' ? (
          <>
            {/* Выбранная кухня — пилюля */}
            {title ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-bg-input px-4 h-11">
                  <span className="text-sm">🍜</span>
                  <span className="flex-1 text-sm text-text-primary">{title}</span>
                  <button
                    type="button"
                    onClick={() => { setTitle(''); setCuisineSearch(''); setCuisineOpen(false) }}
                    className="text-text-muted hover:text-text-secondary"
                  >
                    <X size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCuisineOpen((v) => !v)}
                  className="flex h-11 items-center rounded-xl bg-bg-input px-3 text-text-secondary hover:bg-bg-hover"
                >
                  {cuisineOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCuisineOpen((v) => !v)}
                className="flex h-11 w-full items-center justify-between rounded-xl bg-bg-input px-4 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
              >
                <span>{t('food.cuisineSelect')}</span>
                {cuisineOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}

            {/* Выпадающий список */}
            {cuisineOpen && (() => {
              const allCuisines = t.raw('food.cuisineList') as string[]
              const filtered = allCuisines.filter((c) =>
                c.toLowerCase().includes(cuisineSearch.toLowerCase())
              )
              const showCustom = cuisineSearch.trim() && !allCuisines.some(
                (c) => c.toLowerCase() === cuisineSearch.trim().toLowerCase()
              )
              return (
                <div className="rounded-xl bg-bg-input overflow-hidden">
                  <div className="relative border-b border-border">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={cuisineSearch}
                      onChange={(e) => setCuisineSearch(e.target.value)}
                      placeholder={t('food.cuisinePlaceholder')}
                      className="h-10 w-full bg-transparent pl-8 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto scrollbar-none p-1">
                    {showCustom && (
                      <button
                        type="button"
                        onClick={() => { setTitle(cuisineSearch.trim()); setCuisineOpen(false); setCuisineSearch('') }}
                        className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-primary hover:bg-bg-hover transition-colors"
                      >
                        <span className="text-text-muted">+</span>
                        <span>{t('food.cuisineCustom')}: <strong>{cuisineSearch.trim()}</strong></span>
                      </button>
                    )}
                    {filtered.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setTitle(c); setCuisineOpen(false); setCuisineSearch('') }}
                        className={`flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
                          title === c
                            ? 'bg-bg-secondary text-text-primary font-medium'
                            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                        }`}
                      >
                        🍜 {c}
                      </button>
                    ))}
                    {filtered.length === 0 && !showCustom && (
                      <p className="px-3 py-2 text-sm text-text-muted">{t('common.empty')}</p>
                    )}
                  </div>
                </div>
              )
            })()}
          </>
        ) : (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('food.namePlaceholder')}
            className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
            autoFocus
          />
        )}
      </div>

      {/* Отношение */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('items.sentiments.likes')} / {t('items.sentiments.dislikes')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSentiment('likes')}
            className={`h-9 flex-1 min-w-0 whitespace-nowrap rounded-[20px] px-4 text-[13px] font-medium transition-colors ${
              sentiment === 'likes'
                ? 'bg-loves-bg text-loves'
                : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
            }`}
          >
            ❤️ {t('items.sentiments.likes')}
          </button>
          <button
            type="button"
            onClick={() => setSentiment('dislikes')}
            className={`h-9 flex-1 min-w-0 whitespace-nowrap rounded-[20px] px-4 text-[13px] font-medium transition-colors ${
              sentiment === 'dislikes'
                ? 'bg-avoid-bg text-avoid'
                : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
            }`}
          >
            😕 {t('items.sentiments.dislikes')}
          </button>
        </div>
      </div>

      {/* Тип кухни — только для блюд (как необязательный тег) */}
      {type === 'dish' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            {t('food.cuisineType')}
          </label>

          {/* Выбранная пилюля или кнопка открытия */}
          {cuisineType ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-bg-input px-4 h-11">
                <span className="text-sm">🍜</span>
                <span className="flex-1 text-sm text-text-primary">{cuisineType}</span>
                <button
                  type="button"
                  onClick={() => { setCuisineType(''); setCuisineSearch(''); setCuisineOpen(false) }}
                  className="text-text-muted hover:text-text-secondary"
                >
                  <X size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCuisineOpen((v) => !v)}
                className="flex h-11 items-center gap-1 rounded-xl bg-bg-input px-3 text-sm text-text-secondary hover:bg-bg-hover"
              >
                {cuisineOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCuisineOpen((v) => !v)}
              className="flex h-11 w-full items-center justify-between rounded-xl bg-bg-input px-4 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
            >
              <span>{t('food.cuisineSelect')}</span>
              {cuisineOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* Выпадающий список с поиском */}
          {cuisineOpen && (() => {
            const allCuisines = t.raw('food.cuisineList') as string[]
            const filtered = allCuisines.filter((c) =>
              c.toLowerCase().includes(cuisineSearch.toLowerCase())
            )
            const showCustom = cuisineSearch.trim() && !allCuisines.some(
              (c) => c.toLowerCase() === cuisineSearch.trim().toLowerCase()
            )
            return (
              <div className="rounded-xl bg-bg-input overflow-hidden">
                {/* Поиск */}
                <div className="relative border-b border-border">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={cuisineSearch}
                    onChange={(e) => setCuisineSearch(e.target.value)}
                    placeholder={t('food.cuisinePlaceholder')}
                    className="h-10 w-full bg-transparent pl-8 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none"
                    autoFocus
                  />
                </div>
                {/* Список */}
                <div className="max-h-44 overflow-y-auto scrollbar-none p-1">
                  {/* Пользовательский вариант, когда введённое значение отсутствует в списке */}
                  {showCustom && (
                    <button
                      type="button"
                      onClick={() => { setCuisineType(cuisineSearch.trim()); setCuisineOpen(false); setCuisineSearch('') }}
                      className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-primary hover:bg-bg-hover transition-colors"
                    >
                      <span className="text-text-muted">+</span>
                      <span>{t('food.cuisineCustom')}: <strong>{cuisineSearch.trim()}</strong></span>
                    </button>
                  )}
                  {filtered.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setCuisineType(c); setCuisineOpen(false); setCuisineSearch('') }}
                      className={`flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
                        cuisineType === c
                          ? 'bg-bg-secondary text-text-primary font-medium'
                          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                      }`}
                    >
                      🍜 {c}
                    </button>
                  ))}
                  {filtered.length === 0 && !showCustom && (
                    <p className="px-3 py-2 text-sm text-text-muted">{t('common.empty')}</p>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Привязка к ресторану — только для блюд */}
      {type === 'dish' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            {t('food.linkRestaurant')}
          </label>

          {/* Выбранный ресторан — пилюля или кнопка открытия */}
          {linkedRestaurantId ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-bg-input px-4 h-11">
                <span className="text-sm">🍴</span>
                <span className="flex-1 text-sm text-text-primary truncate">{linkedRestaurantName}</span>
                <button
                  type="button"
                  onClick={() => selectRestaurant(null, null)}
                  className="text-text-muted hover:text-text-secondary"
                >
                  <X size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setRestaurantOpen((v) => !v)}
                className="flex h-11 items-center gap-1 rounded-xl bg-bg-input px-3 text-sm text-text-secondary hover:bg-bg-hover"
              >
                {restaurantOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (availableRestaurants.length === 0) return
                setRestaurantOpen((v) => !v)
              }}
              className={`flex h-11 w-full items-center justify-between rounded-xl bg-bg-input px-4 text-sm transition-colors ${
                availableRestaurants.length === 0
                  ? 'text-text-muted cursor-default'
                  : 'text-text-secondary hover:bg-bg-hover'
              }`}
            >
              <span>
                {availableRestaurants.length === 0
                  ? t('food.noRestaurants')
                  : t('food.linkRestaurantBtn')}
              </span>
              {availableRestaurants.length > 0 && (
                restaurantOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />
              )}
            </button>
          )}

          {/* Выпадающий список с поиском */}
          {restaurantOpen && availableRestaurants.length > 0 && (
            <div className="rounded-xl bg-bg-input overflow-hidden">
              {/* Поле поиска */}
              <div className="relative border-b border-border">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={restaurantSearch}
                  onChange={(e) => setRestaurantSearch(e.target.value)}
                  placeholder={t('food.searchRestaurant')}
                  className="h-10 w-full bg-transparent pl-8 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none"
                  autoFocus
                />
              </div>

              {/* Список ресторанов */}
              <div className="max-h-40 overflow-y-auto p-1">
                {filteredRestaurants.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-text-muted">{t('common.empty')}</p>
                ) : (
                  filteredRestaurants.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectRestaurant(r.id, r.title)}
                      className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                    >
                      <span>🍴</span>
                      <span className="truncate">{r.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Комментарий */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('food.comment')}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={t('food.commentPlaceholder')}
          className="rounded-xl bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 flex-1 rounded-xl border border-border text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSaving || !title.trim()}
          className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isSaving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
