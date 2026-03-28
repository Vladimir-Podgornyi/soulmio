'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, X, Camera, CalendarHeart, Cake, Calendar, Trash2 } from 'lucide-react'
import { getRelationStats } from '@/shared/lib/milestones'
import { ProLock } from '@/shared/ui'
import { toast } from 'sonner'
import { createClient } from '@/shared/api/supabase'
import type { Person } from '@/entities/person/model/types'
import { DEFAULT_RELATIONS } from '@/entities/person/model/types'
import {
  getCustomRelations,
  addCustomRelation,
  deleteCustomRelation,
} from '@/entities/person/api/customRelations'
import {
  getPersonDates,
  createPersonDate,
  deletePersonDate,
  type PersonDate,
} from '@/entities/person/api/personDates'
import { useAddPerson } from '../model/useAddPerson'
import { uploadAvatar } from '@/shared/lib/uploadImage'

interface AddPersonFormProps {
  isPro: boolean
  person?: Person
  onSuccess: (person: Person) => void
  onCancel: () => void
}

export function AddPersonForm({ isPro, person, onSuccess, onCancel }: AddPersonFormProps) {
  const t = useTranslations()
  const isEdit = !!person
  const { form, isLoading, onSubmit } = useAddPerson(onSuccess, person)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = form

  const selectedRelation = watch('relation')
  const relationSinceValue = watch('relation_since')
  const birthDateValue = watch('birth_date')

  const [avatarUrl, setAvatarUrl] = useState<string | null>(person?.avatar_url ?? null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [savedCustom, setSavedCustom] = useState<string[]>([])
  const [customMode, setCustomMode] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // Существующие даты (только при редактировании)
  const [personDates, setPersonDates] = useState<PersonDate[]>([])
  // Новые даты, которые ещё не сохранены (используются при создании и при редактировании)
  const [pendingDates, setPendingDates] = useState<{ title: string; date: string; notify_days: number }[]>([])
  const [addingDate, setAddingDate] = useState(false)
  const [newDateTitle, setNewDateTitle] = useState('')
  const [newDateValue, setNewDateValue] = useState('')
  const [newDateNotify, setNewDateNotify] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const relations = await getCustomRelations(supabase, user.id)
      setSavedCustom(relations)
      if (isEdit && person) {
        const dates = await getPersonDates(supabase, person.id)
        setPersonDates(dates)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // При редактировании предустанавливаем relation + isPro в форме
  useEffect(() => {
    if (person?.relation) setValue('relation', person.relation)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAddDate() {
    if (!newDateTitle.trim() || !newDateValue) return

    if (isEdit && person && userId) {
      // Режим редактирования: сохраняем сразу в БД
      const supabase = createClient()
      try {
        const created = await createPersonDate(supabase, {
          person_id: person.id,
          user_id: userId,
          title: newDateTitle.trim(),
          date: newDateValue,
          notify_days: newDateNotify,
        })
        setPersonDates((prev) => [...prev, created])
      } catch {
        toast.error(t('common.error'))
        return
      }
    } else {
      // Режим создания: добавляем в pending-список
      setPendingDates((prev) => [...prev, { title: newDateTitle.trim(), date: newDateValue, notify_days: newDateNotify }])
    }

    setNewDateTitle('')
    setNewDateValue('')
    setNewDateNotify(0)
    setAddingDate(false)
  }

  async function handleDeleteDate(id: string) {
    const supabase = createClient()
    try {
      await deletePersonDate(supabase, id)
      setPersonDates((prev) => prev.filter((d) => d.id !== id))
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!file.type.startsWith('image/')) {
      toast.error(t('people.uploadNotImage'))
      return
    }
    setIsUploadingAvatar(true)
    try {
      const url = await uploadAvatar(file)
      setAvatarUrl(url)
    } catch {
      toast.error(t('people.uploadError'))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  function handleSelectPreset(rel: string) {
    setCustomMode(false)
    setCustomInput('')
    setValue('relation', selectedRelation === rel ? null : rel)
  }

  async function handleCustomConfirm() {
    const val = customInput.trim()
    if (!val || !userId) return

    if (!savedCustom.includes(val)) {
      const supabase = createClient()
      await addCustomRelation(supabase, userId, val)
      setSavedCustom((prev) => [...prev, val])
    }

    setValue('relation', val)
    setCustomInput('')
    setCustomMode(false)
  }

  async function handleRemoveSaved(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!userId) return
    const supabase = createClient()
    await deleteCustomRelation(supabase, userId, name)
    setSavedCustom((prev) => prev.filter((r) => r !== name))
    if (selectedRelation === name) setValue('relation', null)
  }

  function handleCustomKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); void handleCustomConfirm() }
    if (e.key === 'Escape') { setCustomMode(false); setCustomInput('') }
  }

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v, avatarUrl, pendingDates))} className="flex flex-col gap-5">
      {/* Аватар */}
      <ProLock feature="avatar" profile={{ subscription_tier: isPro ? 'pro' : 'free' }}>
        <div className="flex flex-col items-center gap-2 pb-1">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarSelect}
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="relative flex h-20 w-20 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-[#E8735A] to-[#C94F38] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <span className="text-2xl font-bold uppercase leading-none">
                {watch('name')?.charAt(0) || '?'}
              </span>
            )}
            {/* Оверлей с иконкой камеры */}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
              {isUploadingAvatar
                ? <span className="text-xs text-white">...</span>
                : <Camera size={20} className="text-white" />
              }
            </span>
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl(null)}
              className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            >
              {t('people.removePhoto')}
            </button>
          )}
          <p className="text-[11px] text-text-muted">{t('people.uploadPhotoHint')}</p>
        </div>
      </ProLock>

      {/* Имя */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('people.name')}
        </label>
        <input
          {...register('name')}
          type="text"
          autoFocus
          placeholder="Anna"
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
        />
        {errors.name && (
          <span className="text-xs text-red-500">{errors.name.message}</span>
        )}
      </div>

      {/* Отношение */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('people.relation')}
        </label>
        <div className="flex flex-wrap gap-2">

          {/* Стандартные пилюли */}
          {DEFAULT_RELATIONS.map((rel) => (
            <button
              key={rel}
              type="button"
              onClick={() => handleSelectPreset(rel)}
              className={`h-9 rounded-[20px] px-4 text-sm font-medium transition-colors ${
                selectedRelation === rel
                  ? 'bg-primary text-white'
                  : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {t(`people.relations.${rel}`)}
            </button>
          ))}

          {/* Сохранённые пользовательские пилюли */}
          {isPro && savedCustom.map((rel) => (
            <button
              key={rel}
              type="button"
              onClick={() => handleSelectPreset(rel)}
              className={`flex h-9 items-center gap-1.5 rounded-[20px] pl-4 pr-2 text-sm font-medium transition-colors ${
                selectedRelation === rel
                  ? 'bg-primary text-white'
                  : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {rel}
              <span
                role="button"
                onClick={(e) => void handleRemoveSaved(rel, e)}
                className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                  selectedRelation === rel
                    ? 'bg-white/20 hover:bg-white/30'
                    : 'bg-border hover:bg-border-card'
                }`}
              >
                <X size={11} />
              </span>
            </button>
          ))}

          {/* Pro: + новое пользовательское */}
          {isPro && (
            !customMode ? (
              <button
                type="button"
                onClick={() => { setCustomMode(true); setValue('relation', null) }}
                className="flex h-9 items-center gap-1 rounded-[20px] border border-dashed border-border px-3 text-sm font-medium text-text-muted hover:border-text-secondary hover:text-text-secondary transition-colors"
              >
                <Plus size={14} />
                {t('people.customRelation')}
              </button>
            ) : (
              <div className="flex h-9 items-center gap-1.5 rounded-[20px] bg-bg-input pl-3 pr-1.5">
                <input
                  autoFocus
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  placeholder={t('people.customRelationPlaceholder')}
                  maxLength={30}
                  className="w-28 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleCustomConfirm()}
                  disabled={!customInput.trim()}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 transition-opacity"
                >
                  <Plus size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => { setCustomMode(false); setCustomInput('') }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-hover text-text-muted"
                >
                  <X size={11} />
                </button>
              </div>
            )
          )}

          {/* Подсказка для бесплатного плана */}
          {!isPro && (
            <span className="flex h-9 items-center rounded-[20px] px-3 text-xs text-text-muted border border-dashed border-border opacity-50 cursor-not-allowed">
              + {t('people.customRelationPro')}
            </span>
          )}
        </div>
      </div>

      {/* Заметки */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('people.notes')}
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="..."
          className="rounded-xl bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* Дата начала отношений */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          <CalendarHeart size={12} />
          {t('people.relationSince')}
        </label>
        <input
          {...register('relation_since')}
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 dark:[color-scheme:dark]"
        />
        {relationSinceValue && (() => {
          const stats = getRelationStats(relationSinceValue)
          if (stats.totalDays < 0) return null
          return (
            <p className="text-[11px] text-text-muted">
              {stats.totalDays} {t('milestones.statDays')} · {stats.months} {t('milestones.statMonths')} · {stats.years} {t('milestones.statYears')}
            </p>
          )
        })()}
        {!relationSinceValue && (
          <p className="text-[11px] text-text-muted">{t('people.relationSinceHint')}</p>
        )}
      </div>

      {/* День рождения */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          <Cake size={12} />
          {t('people.birthDate')}
        </label>
        <input
          {...register('birth_date')}
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 dark:[color-scheme:dark]"
        />
        {birthDateValue && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-muted">{t('people.birthNotifyLabel')}</span>
            <select
              {...register('birth_notify_days', { valueAsNumber: true })}
              className="h-7 rounded-lg bg-bg-input px-2 text-xs text-text-primary outline-none"
            >
              <option value={0}>{t('people.birthNotify0')}</option>
              <option value={1}>{t('people.birthNotify1')}</option>
              <option value={3}>{t('people.birthNotify3')}</option>
              <option value={7}>{t('people.birthNotify7')}</option>
              <option value={14}>{t('people.birthNotify14')}</option>
              <option value={30}>{t('people.birthNotify30')}</option>
            </select>
          </div>
        )}
      </div>

      {/* Важные даты */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          <Calendar size={12} />
          {t('people.importantDates')}
        </label>

        {/* Список существующих дат (edit mode) */}
        {personDates.map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-xl bg-bg-input px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{d.title}</p>
              <p className="text-[11px] text-text-muted">
                {new Date(d.date + 'T00:00:00').toLocaleDateString()}
                {d.notify_days > 0 && ` · ${d.notify_days}d ${t('people.beforeLabel')}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDeleteDate(d.id)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg-hover hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {/* Pending-даты (create mode) */}
        {pendingDates.map((d, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-bg-input px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{d.title}</p>
              <p className="text-[11px] text-text-muted">
                {new Date(d.date + 'T00:00:00').toLocaleDateString()}
                {d.notify_days > 0 && ` · ${d.notify_days}d ${t('people.beforeLabel')}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingDates((prev) => prev.filter((_, j) => j !== i))}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg-hover hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

          {/* Форма добавления новой даты */}
          {addingDate ? (
            <div className="flex flex-col gap-2 rounded-xl bg-bg-input p-3">
              <input
                autoFocus
                value={newDateTitle}
                onChange={(e) => setNewDateTitle(e.target.value)}
                placeholder={t('people.dateTitlePlaceholder')}
                maxLength={60}
                className="h-9 rounded-lg bg-bg-secondary px-3 text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
              <input
                type="date"
                value={newDateValue}
                onChange={(e) => setNewDateValue(e.target.value)}
                className="h-9 rounded-lg bg-bg-secondary px-3 text-sm text-text-primary outline-none dark:[color-scheme:dark]"
              />
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted">{t('people.birthNotifyLabel')}</span>
                <select
                  value={newDateNotify}
                  onChange={(e) => setNewDateNotify(Number(e.target.value))}
                  className="h-7 rounded-lg bg-bg-secondary px-2 text-xs text-text-primary outline-none"
                >
                  <option value={0}>{t('people.birthNotify0')}</option>
                  <option value={1}>{t('people.birthNotify1')}</option>
                  <option value={3}>{t('people.birthNotify3')}</option>
                  <option value={7}>{t('people.birthNotify7')}</option>
                  <option value={14}>{t('people.birthNotify14')}</option>
                  <option value={30}>{t('people.birthNotify30')}</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setAddingDate(false); setNewDateTitle(''); setNewDateValue('') }}
                  className="h-8 flex-1 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleAddDate()}
                  disabled={!newDateTitle.trim() || !newDateValue}
                  className="h-8 flex-1 rounded-lg bg-primary text-xs font-semibold text-white disabled:opacity-40 transition-opacity"
                >
                  {t('common.add')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingDate(true)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-sm font-medium text-text-muted hover:border-text-secondary hover:text-text-secondary transition-colors"
            >
              <Plus size={14} />
              {t('people.addDate')}
            </button>
          )}
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
          disabled={isLoading}
          className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : isEdit ? t('common.save') : t('common.add')}
        </button>
      </div>
    </form>
  )
}
