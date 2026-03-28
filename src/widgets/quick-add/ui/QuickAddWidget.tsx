'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, X, ChevronLeft, Loader2 } from 'lucide-react'
import type { Person } from '@/entities/person/model/types'
import type { Category } from '@/entities/category/model/types'
import { ensureDefaultCategories, createCustomCategory } from '@/entities/category/api'
import { parseCategoryIconField, CATEGORY_GRADIENTS, buildCategoryIconField } from '@/entities/category/model/categoryIcon'
import { createClient } from '@/shared/api/supabase'
import { AddPersonForm } from '@/features/add-person'
import { EmojiPicker } from '@/shared/ui/EmojiPicker'
import { ProLock } from '@/shared/ui'

interface QuickAddWidgetProps {
  people: Person[]
  isPro: boolean
}

type Step = 'person' | 'category' | 'custom-category'

const DEFAULT_NAMES = ['food', 'restaurants', 'gifts', 'movies', 'travel'] as const

const FREE_CUSTOM_LIMIT = 1

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

  // Стейт для создания кастомной категории
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('📁')
  const [newCatColor, setNewCatColor] = useState('gray')
  const [newCatLikesLabel, setNewCatLikesLabel] = useState('')
  const [newCatDislikesLabel, setNewCatDislikesLabel] = useState('')
  const [isSavingCat, setIsSavingCat] = useState(false)

  // Блокировка скролла страницы когда модалка открыта
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  // FAB останавливается в 5px от footer, не падает ниже дефолтной позиции
  const [fabBottom, setFabBottom] = useState(96)
  useEffect(() => {
    const footer = document.getElementById('site-footer')
    if (!footer) return

    function update() {
      const isMobile = window.innerWidth < 768
      const defaultBottom = isMobile ? 96 : 24
      const footerRect = (footer as HTMLElement).getBoundingClientRect()
      const vh = window.innerHeight
      // Нижний край FAB должен быть в 5px выше верхнего края footer
      const needed = footerRect.top < vh ? vh - footerRect.top + 5 : 0
      setFabBottom(Math.max(defaultBottom, needed))
    }

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

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
      // ensureDefaultCategories создаёт дефолтные группы если их ещё нет и возвращает все
      const cats = await ensureDefaultCategories(supabase, person.id, isPro)
      setCategories(cats)
      setStep('category')
    } catch {
      setStep('category')
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

  function openCustomCategoryForm() {
    setNewCatName('')
    setNewCatEmoji('📁')
    setNewCatColor('gray')
    setNewCatLikesLabel('')
    setNewCatDislikesLabel('')
    setStep('custom-category')
  }

  async function handleSaveCustomCategory() {
    if (!newCatName.trim() || !selectedPerson || isSavingCat) return
    setIsSavingCat(true)
    try {
      const supabase = createClient()
      const iconField = buildCategoryIconField(newCatColor, newCatEmoji, newCatLikesLabel, newCatDislikesLabel)
      const cat = await createCustomCategory(supabase, selectedPerson.id, newCatName.trim(), iconField)
      if (cat) {
        setCategories((prev) => [...prev, cat])
        setStep('category')
      }
    } finally {
      setIsSavingCat(false)
    }
  }

  function getCategoryLabel(cat: Category): string {
    if (!cat.is_custom && (DEFAULT_NAMES as readonly string[]).includes(cat.name)) {
      return t(`categories.${cat.name}` as Parameters<typeof t>[0])
    }
    return cat.name
  }

  const customCatCount = categories.filter((c) => c.is_custom).length
  const canAddCustom = isPro || customCatCount < FREE_CUSTOM_LIMIT
  const canAddMorePeople = isPro || localPeople.length === 0

  return (
    <>
      {/* FAB — останавливается в 8px от footer при скролле */}
      <button
        type="button"
        onClick={open}
        aria-label={t('dashboard.quickAdd')}
        style={{ bottom: fabBottom, transition: 'bottom 0.08s ease-out' }}
        className="fab fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg hover:bg-primary-dark active:scale-95"
      >
        <Plus size={26} strokeWidth={2.5} className="text-white" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:pt-20">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

          <div className="sheet-animate relative z-10 w-full max-w-md rounded-[28px] bg-bg-secondary max-h-[90dvh] flex flex-col">
            {/* Хэдер */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
              {step === 'category' && !isAddingPerson ? (
                <button
                  type="button"
                  onClick={() => { setStep('person'); setSelectedPerson(null); setCategories([]) }}
                  className="flex items-center gap-1 text-sm text-text-secondary"
                >
                  <ChevronLeft size={16} />
                  {selectedPerson?.name}
                </button>
              ) : step === 'custom-category' ? (
                <button
                  type="button"
                  onClick={() => setStep('category')}
                  className="flex items-center gap-1 text-sm text-text-secondary"
                >
                  <ChevronLeft size={16} />
                  {t('dashboard.selectCategory')}
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
                  : step === 'custom-category'
                  ? t('categories.addCustom')
                  : t('dashboard.selectCategory')}
              </h2>

              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-primary hover:bg-primary/10"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Шаг 1: выбор человека ── */}
            {step === 'person' && !isAddingPerson && (
              <div className="flex flex-col gap-2 px-6 pb-6 overflow-y-auto">
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
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm">
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

            {/* ── Шаг 2: выбор категории ── */}
            {step === 'category' && (
              <div className="overflow-y-auto px-6 pb-6">
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className="flex flex-col items-center gap-2 rounded-[16px] bg-bg-card border border-border-card p-4 transition-all active:scale-95 hover:border-primary/40 hover:bg-bg-hover"
                    >
                      <span className="text-3xl leading-none">
                        {cat.is_custom
                          ? parseCategoryIconField(cat.icon ?? null).emoji
                          : (cat.icon ?? '📁')}
                      </span>
                      <span className="text-xs font-medium text-text-secondary text-center leading-tight">
                        {getCategoryLabel(cat)}
                      </span>
                    </button>
                  ))}

                  {/* Кнопка создания кастомной группы */}
                  {canAddCustom ? (
                    <button
                      type="button"
                      onClick={openCustomCategoryForm}
                      className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-border p-4 transition-all hover:border-primary/40 hover:bg-bg-hover active:scale-95"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input">
                        <Plus size={16} className="text-text-muted" />
                      </div>
                      <span className="text-xs font-medium text-text-muted text-center leading-tight">
                        {t('categories.addCustom')}
                      </span>
                    </button>
                  ) : (
                    <ProLock feature="custom_categories" profile={{ subscription_tier: 'free' }}>
                      <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-border p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input">
                          <Plus size={16} className="text-text-muted" />
                        </div>
                        <span className="text-xs font-medium text-text-muted text-center leading-tight">
                          {t('categories.addCustom')}
                        </span>
                      </div>
                    </ProLock>
                  )}
                </div>
              </div>
            )}

            {/* ── Шаг 3: создание кастомной категории ── */}
            {step === 'custom-category' && (
              <div className="overflow-y-auto px-6 pb-6 flex flex-col gap-4">
                {/* Выбор цвета */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    {t('categories.color')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_GRADIENTS.map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setNewCatColor(g.key)}
                        className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 active:scale-95 flex-shrink-0"
                        style={{ background: g.gradient }}
                        suppressHydrationWarning
                      >
                        {newCatColor === g.key && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Выбор эмодзи */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[12px] text-2xl flex-shrink-0"
                      style={{ background: CATEGORY_GRADIENTS.find((g) => g.key === newCatColor)?.gradient }}
                      suppressHydrationWarning
                    >
                      {newCatEmoji}
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                      {t('categories.icon')}
                    </p>
                  </div>
                  <EmojiPicker value={newCatEmoji} onChange={setNewCatEmoji} />
                </div>

                {/* Название */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    {t('categories.name')}
                  </p>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSaveCustomCategory()}
                    placeholder={t('categories.namePlaceholder')}
                    maxLength={30}
                    autoFocus
                    className="w-full rounded-[12px] bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>

                {/* Статусы */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    {t('categories.customStatuses')}
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 rounded-[12px] bg-bg-input px-3 py-2.5">
                      <span className="text-sm flex-shrink-0">❤️</span>
                      <input
                        type="text"
                        value={newCatLikesLabel}
                        onChange={(e) => setNewCatLikesLabel(e.target.value)}
                        placeholder={t('categories.likesLabelPlaceholder')}
                        maxLength={20}
                        className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-[12px] bg-bg-input px-3 py-2.5">
                      <span className="text-sm flex-shrink-0">😕</span>
                      <input
                        type="text"
                        value={newCatDislikesLabel}
                        onChange={(e) => setNewCatDislikesLabel(e.target.value)}
                        placeholder={t('categories.dislikesLabelPlaceholder')}
                        maxLength={20}
                        className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Сохранить */}
                <button
                  type="button"
                  onClick={() => void handleSaveCustomCategory()}
                  disabled={!newCatName.trim() || isSavingCat}
                  className="w-full rounded-[12px] bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  {isSavingCat ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('common.save')}
                </button>
              </div>
            )}

            {/* ── Шаг: создание нового человека ── */}
            {step === 'person' && isAddingPerson && (
              <div className="overflow-y-auto px-6 pb-6">
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
