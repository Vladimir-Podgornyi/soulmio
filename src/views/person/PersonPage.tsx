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

interface PersonPageProps {
  person: Person
  categories: Category[]
  initialItems: Item[]
  initialCategoryId: string
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
}: PersonPageProps) {
  const t = useTranslations()

  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId)
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, Item[]>>({
    [initialCategoryId]: initialItems,
  })
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [filter, setFilter] = useState<'all' | 'visited' | 'wants'>('all')

  const activeCategory = categories.find((c) => c.id === activeCategoryId)
  const allItems = itemsByCategory[activeCategoryId] ?? []
  const items = filter === 'all'
    ? allItems
    : allItems.filter((it) => it.sentiment === filter)

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
    if (!(categoryId in itemsByCategory)) {
      const res = await fetch(`/api/items?personId=${person.id}&categoryId=${categoryId}`)
      const data = (await res.json()) as Item[]
      setItemsByCategory((prev) => ({ ...prev, [categoryId]: data }))
    }
  }

  const isRestaurants = activeCategory?.name === 'restaurants'

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="px-4 pt-14 pb-4">
        <Link href="/people" className="mb-4 flex items-center gap-1 text-sm text-text-secondary">
          <ChevronLeft size={16} />
          {t('common.back')}
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8735A] to-[#C94F38] text-lg font-bold text-white uppercase">
            {person.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.5px] text-text-primary leading-tight">
              {person.name}
            </h1>
            {person.relation && (
              <p className="text-sm text-text-secondary capitalize">
                {t(`people.relations.${person.relation}`)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-none">
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

      {/* Sentiment filter — shown only for restaurants and when there are items */}
      {activeCategory?.name === 'restaurants' && allItems.length > 0 && (
        <div className="flex gap-2 px-4 pb-3">
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

      {/* Items list */}
      <div className="px-4 pb-32">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-3 text-5xl">
              {activeCategory?.icon ?? CATEGORY_ICONS[activeCategory?.name ?? ''] ?? '📋'}
            </span>
            <p className="text-sm text-text-muted">{t('common.empty')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <RestaurantCard
                key={item.id}
                item={item}
                personId={person.id}
                categoryId={activeCategoryId}
                onEdit={() => setEditingItem(item)}
                onDeleted={() => handleItemDeleted(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform active:scale-95"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Add bottom sheet */}
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

      {/* Edit bottom sheet */}
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
    </div>
  )
}

/* ── Restaurant card ── */

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

  // Close menu on outside click
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

  return (
    <div className="rounded-[14px] bg-bg-card border border-border-card p-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-semibold text-text-primary leading-tight">{item.title}</span>
          {addressTag && (
            <span className="text-xs text-text-secondary">{addressTag}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sentiment badge */}
          <span
            className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium ${
              isVisited ? 'bg-loves-bg text-loves' : 'bg-wants-bg text-wants'
            }`}
          >
            {isVisited ? t('items.sentiments.visited') : t('items.sentiments.wants')}
          </span>

          {/* External link */}
          {item.external_url && (
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-secondary"
            >
              <ExternalLink size={15} />
            </a>
          )}

          {/* Three-dot menu */}
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

      {/* Ratings */}
      {isVisited && (item.my_rating || item.partner_rating) ? (
        <div className="mt-3 flex gap-4 border-t border-border-card pt-3">
          {item.my_rating !== null && (
            <RatingDisplay label={t('items.ratings.mine')} value={item.my_rating} />
          )}
          {item.partner_rating !== null && (
            <RatingDisplay label={t('items.ratings.partner')} value={item.partner_rating} />
          )}
        </div>
      ) : null}

      {/* Comment */}
      {item.description && (
        <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Delete confirmation */}
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

/* ── Rating display ── */

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

/* ── Bottom sheet ── */

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
