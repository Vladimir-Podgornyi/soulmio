'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, X, ChevronLeft, Loader2 } from 'lucide-react'
import type { Person } from '@/entities/person/model/types'
import type { Category } from '@/entities/category/model/types'
import { getCategories } from '@/entities/category/api'
import { createClient } from '@/shared/api/supabase'
import { AddPersonForm } from '@/features/add-person'

interface QuickAddWidgetProps {
  people: Person[]
  isPro: boolean
}

type Step = 'person' | 'category'

const DEFAULT_NAMES = ['food', 'restaurants', 'gifts', 'movies', 'travel'] as const

export function QuickAddWidget({ people, isPro }: QuickAddWidgetProps) {
  const t = useTranslations()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<Step>('person')
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [localPeople, setLocalPeople] = useState<Person[]>(people)

  function open() {
    setStep('person')
    setSelectedPerson(null)
    setCategories([])
    setIsAddingPerson(false)
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
  }

  async function handlePersonSelect(person: Person) {
    setSelectedPerson(person)
    setIsLoadingCategories(true)
    try {
      const supabase = createClient()
      const cats = await getCategories(supabase, person.id)
      setCategories(cats)
      setStep('category')
    } catch {
      // fallback — показываем пустой список
    } finally {
      setIsLoadingCategories(false)
    }
  }

  function handleCategorySelect(cat: Category) {
    if (!selectedPerson) return
    close()
    router.push(`/people/${selectedPerson.id}?add=${cat.name}`)
  }

  function handlePersonCreated(person: Person) {
    setLocalPeople((prev) => [person, ...prev])
    setIsAddingPerson(false)
    void handlePersonSelect(person)
  }

  function getCategoryLabel(cat: Category): string {
    if (!cat.is_custom && (DEFAULT_NAMES as readonly string[]).includes(cat.name)) {
      return t(`categories.${cat.name}` as Parameters<typeof t>[0])
    }
    return cat.name
  }

  const canAddMorePeople = isPro || localPeople.length === 0

  return (
    <>
      {/* FAB — кнопка быстрого добавления */}
      <button
        type="button"
        onClick={open}
        aria-label={t('dashboard.quickAdd')}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg hover:bg-primary-dark active:scale-95 transition-all"
      >
        <Plus size={26} strokeWidth={2.5} className="text-white" />
      </button>

      {/* Оверлей */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

          <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary pb-safe">
            {/* Хэдер */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              {step === 'category' && !isAddingPerson ? (
                <button
                  type="button"
                  onClick={() => { setStep('person'); setSelectedPerson(null); setCategories([]) }}
                  className="flex items-center gap-1 text-sm text-text-secondary"
                >
                  <ChevronLeft size={16} />
                  {selectedPerson?.name}
                </button>
              ) : isAddingPerson ? (
                <button
                  type="button"
                  onClick={() => setIsAddingPerson(false)}
                  className="flex items-center gap-1 text-sm text-text-secondary"
                >
                  <ChevronLeft size={16} />
                  {t('dashboard.selectPerson')}
                </button>
              ) : (
                <span />
              )}

              <h2 className="text-base font-semibold tracking-[-0.3px] text-text-primary">
                {isAddingPerson
                  ? t('people.addPerson')
                  : step === 'person'
                  ? t('dashboard.selectPerson')
                  : t('dashboard.selectCategory')}
              </h2>

              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover"
              >
                <X size={16} />
              </button>
            </div>

            {/* Шаг 1: выбор человека */}
            {step === 'person' && !isAddingPerson && (
              <div className="flex flex-col gap-2 px-6 pb-6">
                {localPeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => void handlePersonSelect(person)}
                    disabled={isLoadingCategories}
                    className="flex items-center gap-3 rounded-[14px] bg-bg-card border border-border-card px-4 py-3 text-left transition-all hover:border-primary/40 active:scale-[0.98] disabled:opacity-60"
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
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-semibold text-text-primary leading-tight">
                        {person.name}
                      </span>
                      {person.relation && (
                        <span className="text-xs text-text-secondary capitalize">
                          {(['partner', 'friend', 'family', 'other'] as string[]).includes(person.relation)
                            ? t(`people.relations.${person.relation}` as Parameters<typeof t>[0])
                            : person.relation}
                        </span>
                      )}
                    </div>
                    {isLoadingCategories && selectedPerson?.id === person.id && (
                      <Loader2 size={16} className="text-text-muted animate-spin flex-shrink-0" />
                    )}
                  </button>
                ))}

                {canAddMorePeople && (
                  <button
                    type="button"
                    onClick={() => setIsAddingPerson(true)}
                    className="flex items-center gap-3 rounded-[14px] border border-dashed border-border px-4 py-3 text-left transition-all hover:border-primary/40"
                  >
                    <div className="h-10 w-10 rounded-full bg-bg-input flex-shrink-0 flex items-center justify-center">
                      <Plus size={18} className="text-text-muted" />
                    </div>
                    <span className="text-sm font-medium text-text-secondary">
                      {t('dashboard.addNewPerson')}
                    </span>
                  </button>
                )}

                {localPeople.length === 0 && !canAddMorePeople && (
                  <p className="text-center text-sm text-text-muted py-4">
                    {t('common.empty')}
                  </p>
                )}
              </div>
            )}

            {/* Шаг 2: выбор категории */}
            {step === 'category' && (
              <div className="grid grid-cols-3 gap-3 px-6 pb-6">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className="flex flex-col items-center gap-2 rounded-[16px] bg-bg-card border border-border-card p-4 transition-all active:scale-95 hover:border-primary/40 hover:bg-bg-hover"
                  >
                    <span className="text-3xl leading-none">{cat.icon ?? '📁'}</span>
                    <span className="text-xs font-medium text-text-secondary text-center leading-tight">
                      {getCategoryLabel(cat)}
                    </span>
                  </button>
                ))}
                {categories.length === 0 && (
                  <p className="col-span-3 text-center text-sm text-text-muted py-4">
                    {t('common.empty')}
                  </p>
                )}
              </div>
            )}

            {/* Шаг: создание нового человека */}
            {step === 'person' && isAddingPerson && (
              <div className="px-6 pb-6">
                <AddPersonForm
                  isPro={isPro}
                  onSuccess={handlePersonCreated}
                  onCancel={() => setIsAddingPerson(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
