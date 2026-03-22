'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Star, Trash2, MoreVertical, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/shared/api/supabase'
import { deletePerson, toggleFavorite } from '@/entities/person/api'
import { getCustomRelations } from '@/entities/person/api/customRelations'
import type { Person } from '@/entities/person/model/types'
import { DEFAULT_RELATIONS } from '@/entities/person/model/types'
import { getRelationDuration } from '@/shared/lib/milestones'
import { AddPersonWidget } from '@/widgets/add-person'
import { AddPersonForm } from '@/features/add-person'

interface PeoplePageProps {
  initialPeople: Person[]
  isPro: boolean
}

function sortPeople(people: Person[]): Person[] {
  return [...people].sort((a, b) => {
    if (a.is_favorite === b.is_favorite) return 0
    return a.is_favorite ? -1 : 1
  })
}

export function PeoplePage({ initialPeople, isPro }: PeoplePageProps) {
  const t = useTranslations()
  const [people, setPeople] = useState<Person[]>(sortPeople(initialPeople))
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [customRelations, setCustomRelations] = useState<string[]>([])

  // Загружаем кастомные отношения чтобы показывать их в фильтрах
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const relations = await getCustomRelations(supabase, user.id)
      setCustomRelations(relations)
    }
    load()
  }, [])

  // Все отношения, которые реально есть у людей
  const usedRelations = [
    ...DEFAULT_RELATIONS.filter((r) => people.some((p) => p.relation === r)),
    ...customRelations.filter((r) => people.some((p) => p.relation === r)),
  ]

  const filteredPeople = activeFilter
    ? people.filter((p) => p.relation === activeFilter)
    : people

  function handlePersonAdded(person: Person) {
    setPeople((prev) => sortPeople([person, ...prev]))
  }

  function handlePersonUpdated(updated: Person) {
    setPeople((prev) => sortPeople(prev.map((p) => (p.id === updated.id ? updated : p))))
    setEditingPerson(null)
    toast.success(t('people.updated'))
  }

  function handleDeleted(id: string) {
    setPeople((prev) => prev.filter((p) => p.id !== id))
    // Если после удаления в текущем фильтре никого не осталось — сбрасываем
    if (activeFilter && people.filter((p) => p.id !== id && p.relation === activeFilter).length === 0) {
      setActiveFilter(null)
    }
  }

  function handleFavoriteToggled(id: string, isFavorite: boolean) {
    setPeople((prev) =>
      sortPeople(prev.map((p) => (p.id === id ? { ...p, is_favorite: isFavorite } : p)))
    )
  }

  function getRelationLabel(rel: string): string {
    if (DEFAULT_RELATIONS.includes(rel as typeof DEFAULT_RELATIONS[number])) {
      return t(`people.relations.${rel as 'partner' | 'friend' | 'family' | 'other'}`)
    }
    return rel
  }

  return (
    <div className="min-h-screen bg-bg-primary px-4 pt-14 pb-8">
      <h1 className="mb-6 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
        {t('people.title')}
      </h1>

      {/* Фильтр по отношениям */}
      {usedRelations.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
          <button
            onClick={() => setActiveFilter(null)}
            className={`h-8 flex-shrink-0 rounded-[8px] px-3 text-xs font-medium transition-colors ${
              activeFilter === null
                ? 'bg-bg-input text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t('common.all')}
          </button>
          {usedRelations.map((rel) => (
            <button
              key={rel}
              onClick={() => setActiveFilter(activeFilter === rel ? null : rel)}
              className={`h-8 flex-shrink-0 rounded-[8px] px-3 text-xs font-medium transition-colors ${
                activeFilter === rel
                  ? 'bg-bg-input text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {getRelationLabel(rel)}
              <span className="ml-1.5 text-text-muted">
                {people.filter((p) => p.relation === rel).length}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <AddPersonWidget
          isPro={isPro}
          canAdd={isPro || people.length === 0}
          onPersonAdded={handlePersonAdded}
        />

        {filteredPeople.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onEdit={() => setEditingPerson(person)}
            onDeleted={handleDeleted}
            onFavoriteToggled={handleFavoriteToggled}
          />
        ))}
      </div>

      {/* Bottom sheet редактирования */}
      {editingPerson && (
        <BottomSheet
          title={t('people.editPerson')}
          onClose={() => setEditingPerson(null)}
        >
          <AddPersonForm
            isPro={isPro}
            person={editingPerson}
            onSuccess={handlePersonUpdated}
            onCancel={() => setEditingPerson(null)}
          />
        </BottomSheet>
      )}
    </div>
  )
}

/* ── Карточка человека ── */

interface PersonCardProps {
  person: Person
  onEdit: () => void
  onDeleted: (id: string) => void
  onFavoriteToggled: (id: string, isFavorite: boolean) => void
}

function PersonCard({ person, onEdit, onDeleted, onFavoriteToggled }: PersonCardProps) {
  const t = useTranslations()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
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

  async function handleToggleFavorite() {
    setMenuOpen(false)
    setLoading(true)
    try {
      const supabase = createClient()
      await toggleFavorite(supabase, person.id, !person.is_favorite)
      onFavoriteToggled(person.id, !person.is_favorite)
      toast.success(
        person.is_favorite ? t('people.removedFromFavorites') : t('people.addedToFavorites')
      )
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      const supabase = createClient()
      await deletePerson(supabase, person.id)
      onDeleted(person.id)
      toast.success(t('people.deleted'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col rounded-[14px] bg-bg-card border border-border-card">
      <div className="flex items-center gap-4 px-4 py-3 min-h-[60px]">
        {/* Аватар — нажатие переходит на страницу */}
        <Link href={`/people/${person.id}`} className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#E8735A] to-[#C94F38] text-[15px] font-bold text-white uppercase leading-none overflow-hidden">
              {person.avatar_url
                ? <img src={person.avatar_url} alt={person.name} className="h-full w-full object-cover" />
                : person.name.charAt(0)
              }
            </div>
            {person.is_favorite && (
              <span className="absolute -top-1 -right-1 text-[11px]">⭐</span>
            )}
          </div>

          <div className="flex flex-1 flex-col min-w-0">
            <span className="text-sm font-semibold text-text-primary truncate">
              {person.name}
            </span>
            {person.relation && (
              <span className="text-xs text-text-secondary capitalize">
                {DEFAULT_RELATIONS.includes(person.relation as typeof DEFAULT_RELATIONS[number])
                  ? t(`people.relations.${person.relation as 'partner' | 'friend' | 'family' | 'other'}`)
                  : person.relation}
              </span>
            )}
            {person.relation_since && (() => {
              const dur = getRelationDuration(person.relation_since!)
              if (dur.value <= 0) return null
              const unitLabel = dur.unit === 'years'
                ? t('milestones.statYears')
                : dur.unit === 'months'
                  ? t('milestones.statMonths')
                  : t('milestones.statDays')
              const secondary = dur.secondary != null
                ? ` ${dur.secondary} ${t('milestones.statMonths')}`
                : ''
              return (
                <span className="text-[11px] text-text-muted mt-0.5">
                  {dur.value} {unitLabel}{secondary}
                </span>
              )
            })()}
          </div>
        </Link>

        {/* Меню из трёх точек */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary disabled:opacity-40"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 min-w-max rounded-[12px] bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onEdit() }}
                className="flex w-full items-center justify-start gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors whitespace-nowrap"
              >
                <span className="flex w-4 flex-shrink-0 items-center justify-center">
                  <Pencil size={15} className="text-text-secondary" />
                </span>
                {t('people.editPerson')}
              </button>
              <div className="mx-3 h-px bg-border-card" />
              <button
                onClick={handleToggleFavorite}
                className="flex w-full items-center justify-start gap-2.5 px-4 py-3 text-sm text-text-primary hover:bg-bg-hover transition-colors whitespace-nowrap"
              >
                <span className="flex w-4 flex-shrink-0 items-center justify-center">
                  <Star size={15} className={person.is_favorite ? 'fill-primary text-primary' : 'text-text-secondary'} />
                </span>
                {person.is_favorite ? t('people.removeFromFavorites') : t('people.addToFavorites')}
              </button>
              <div className="mx-3 h-px bg-border-card" />
              <button
                onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                className="flex w-full items-center justify-start gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors whitespace-nowrap"
              >
                <span className="flex w-4 flex-shrink-0 items-center justify-center">
                  <Trash2 size={15} />
                </span>
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Подтверждение удаления */}
      {confirmDelete && (
        <div className="flex items-center justify-between border-t border-border-card bg-red-500/5 px-4 py-2.5 rounded-b-[14px]">
          <span className="text-sm text-red-500">{t('people.deleteConfirm')}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : t('common.delete')}
            </button>
          </div>
        </div>
      )}
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
