'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, X, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/shared/api/supabase'
import type { Person } from '@/entities/person/model/types'
import { DEFAULT_RELATIONS } from '@/entities/person/model/types'
import {
  getCustomRelations,
  addCustomRelation,
  deleteCustomRelation,
} from '@/entities/person/api/customRelations'
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

  const [avatarUrl, setAvatarUrl] = useState<string | null>(person?.avatar_url ?? null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [savedCustom, setSavedCustom] = useState<string[]>([])
  const [customMode, setCustomMode] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const relations = await getCustomRelations(supabase, user.id)
      setSavedCustom(relations)
    }
    if (isPro) load()
  }, [isPro])

  // При редактировании предустанавливаем relation в форме
  useEffect(() => {
    if (person?.relation) setValue('relation', person.relation)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <form onSubmit={handleSubmit((v) => onSubmit(v, avatarUrl))} className="flex flex-col gap-5">
      {/* Аватар */}
      {!isPro && (
        <div className="flex items-center gap-3 pb-1">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-bg-input opacity-50">
            <Camera size={20} className="text-text-muted" />
          </div>
          <p className="text-xs text-text-muted">{t('people.avatarProHint')}</p>
        </div>
      )}
      {isPro && (
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
      )}

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
