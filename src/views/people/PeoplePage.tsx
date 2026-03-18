'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Star, Trash2, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/shared/api/supabase'
import { deletePerson, toggleFavorite } from '@/entities/person/api'
import type { Person } from '@/entities/person/model/types'
import { DEFAULT_RELATIONS } from '@/entities/person/model/types'
import { AddPersonWidget } from '@/widgets/add-person'

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

  function handlePersonAdded(person: Person) {
    setPeople((prev) => sortPeople([person, ...prev]))
  }

  function handleDeleted(id: string) {
    setPeople((prev) => prev.filter((p) => p.id !== id))
  }

  function handleFavoriteToggled(id: string, isFavorite: boolean) {
    setPeople((prev) =>
      sortPeople(prev.map((p) => (p.id === id ? { ...p, is_favorite: isFavorite } : p)))
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary px-4 pt-14 pb-8">
      <h1 className="mb-6 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
        {t('people.title')}
      </h1>

      <div className="flex flex-col gap-2">
        {people.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onDeleted={handleDeleted}
            onFavoriteToggled={handleFavoriteToggled}
          />
        ))}

        <AddPersonWidget
          isPro={isPro}
          canAdd={isPro || people.length === 0}
          onPersonAdded={handlePersonAdded}
        />
      </div>
    </div>
  )
}

/* ── Person card ── */

interface PersonCardProps {
  person: Person
  onDeleted: (id: string) => void
  onFavoriteToggled: (id: string, isFavorite: boolean) => void
}

function PersonCard({ person, onDeleted, onFavoriteToggled }: PersonCardProps) {
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
        {/* Avatar — tapping navigates */}
        <Link href={`/people/${person.id}`} className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#E8735A] to-[#C94F38] text-sm font-bold text-white uppercase">
              {person.name.charAt(0)}
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
          </div>
        </Link>

        {/* Three-dot menu */}
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

      {/* Delete confirmation */}
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
