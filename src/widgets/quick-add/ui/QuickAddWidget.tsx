'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, X, ChevronLeft } from 'lucide-react'
import type { Person } from '@/entities/person/model/types'
import { AddPersonForm } from '@/features/add-person'

interface QuickAddWidgetProps {
  people: Person[]
  isPro: boolean
}

type CategoryOption = {
  name: string
  icon: string
  labelKey: string
  proOnly: boolean
}

const CATEGORIES: CategoryOption[] = [
  { name: 'food',        icon: '🍽️', labelKey: 'categories.food',        proOnly: false },
  { name: 'restaurants', icon: '🍴', labelKey: 'categories.restaurants', proOnly: false },
  { name: 'gifts',       icon: '🎁', labelKey: 'categories.gifts',       proOnly: false },
  { name: 'movies',      icon: '🎬', labelKey: 'categories.movies',      proOnly: true  },
  { name: 'travel',      icon: '✈️', labelKey: 'categories.travel',      proOnly: true  },
]

type Step = 'category' | 'person'

export function QuickAddWidget({ people, isPro }: QuickAddWidgetProps) {
  const t = useTranslations()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<Step>('category')
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null)
  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [localPeople, setLocalPeople] = useState<Person[]>(people)

  function open() {
    setStep('category')
    setSelectedCategory(null)
    setIsAddingPerson(false)
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
  }

  function handleCategorySelect(cat: CategoryOption) {
    if (cat.proOnly && !isPro) return
    setSelectedCategory(cat)
    setStep('person')
  }

  function handlePersonSelect(person: Person) {
    if (!selectedCategory) return
    close()
    router.push(`/people/${person.id}?add=${selectedCategory.name}`)
  }

  function handlePersonCreated(person: Person) {
    setLocalPeople((prev) => [person, ...prev])
    setIsAddingPerson(false)
    handlePersonSelect(person)
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
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary pb-safe">
            {/* Хэдер */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              {step === 'person' && !isAddingPerson ? (
                <button
                  type="button"
                  onClick={() => setStep('category')}
                  className="flex items-center gap-1 text-sm text-text-secondary"
                >
                  <ChevronLeft size={16} />
                  {t('categories.' + selectedCategory?.name)}
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
                  : step === 'category'
                  ? t('dashboard.selectCategory')
                  : t('dashboard.selectPerson')}
              </h2>

              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover"
              >
                <X size={16} />
              </button>
            </div>

            {/* Шаг 1: выбор категории */}
            {step === 'category' && (
              <div className="grid grid-cols-3 gap-3 px-6 pb-6">
                {CATEGORIES.map((cat) => {
                  const locked = cat.proOnly && !isPro
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      disabled={locked}
                      className={[
                        'flex flex-col items-center gap-2 rounded-[16px] bg-bg-card border border-border-card p-4 transition-all active:scale-95',
                        locked
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:border-primary/40 hover:bg-bg-hover',
                      ].join(' ')}
                    >
                      <span className="text-3xl leading-none">{cat.icon}</span>
                      <span className="text-xs font-medium text-text-secondary">
                        {t(cat.labelKey)}
                      </span>
                      {locked && (
                        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                          Pro
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Шаг 2: выбор человека */}
            {step === 'person' && !isAddingPerson && (
              <div className="flex flex-col gap-2 px-6 pb-6">
                {localPeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handlePersonSelect(person)}
                    className="flex items-center gap-3 rounded-[14px] bg-bg-card border border-border-card px-4 py-3 text-left transition-all hover:border-primary/40 active:scale-[0.98]"
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
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-text-primary leading-tight">
                        {person.name}
                      </span>
                      {person.relation && (
                        <span className="text-xs text-text-secondary capitalize">
                          {['partner', 'friend', 'family', 'other'].includes(person.relation)
                            ? t(`people.relations.${person.relation}` as Parameters<typeof t>[0])
                            : person.relation}
                        </span>
                      )}
                    </div>
                  </button>
                ))}

                {/* Добавить нового человека */}
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
