'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Item } from '@/entities/item/model/types'
import { useAddMovie, getActorFilms, getMoviePinned } from '../model/useAddMovie'
import type { ActorFormValues } from '../model/useAddMovie'

interface AddActorFormProps {
  personId: string
  categoryId: string
  item?: Item
  onSuccess: (item: Item) => void
  onCancel: () => void
}

export function AddActorForm({
  personId,
  categoryId,
  item,
  onSuccess,
  onCancel,
}: AddActorFormProps) {
  const t = useTranslations()
  const isEdit = !!item
  const { isSaving, saveActor, editActor } = useAddMovie(personId, categoryId, onSuccess)

  const [name, setName] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [films, setFilms] = useState<string[]>(() => {
    const f = getActorFilms(item?.tags ?? null)
    return f.length > 0 ? f : ['']
  })
  const [pinned] = useState(getMoviePinned(item?.tags ?? null))

  function updateFilm(index: number, value: string) {
    setFilms((prev) => prev.map((f, i) => (i === index ? value : f)))
  }

  function addFilm() {
    setFilms((prev) => [...prev, ''])
  }

  function removeFilm(index: number) {
    setFilms((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(t('movies.actorNameRequired'))
      return
    }
    const values: ActorFormValues = {
      name,
      description,
      films: films.filter((f) => f.trim()),
      pinned,
    }
    try {
      if (isEdit) {
        await editActor(item.id, values)
        toast.success(t('movies.actorUpdated'))
      } else {
        await saveActor(values)
        toast.success(t('movies.actorAdded'))
      }
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Имя актёра */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('movies.actorName')} *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('movies.actorNamePlaceholder')}
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
          autoFocus={!isEdit}
        />
      </div>

      {/* Фильмы с участием */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('movies.actorFilms')}
        </label>
        <div className="flex flex-col gap-2">
          {films.map((film, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={film}
                onChange={(e) => updateFilm(i, e.target.value)}
                placeholder={t('movies.actorFilmPlaceholder')}
                className="h-11 flex-1 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:ring-1 focus:ring-primary/40"
              />
              {films.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFilm(i)}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-bg-input text-text-muted hover:text-text-secondary transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addFilm}
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-xs text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
        >
          <Plus size={13} />
          {t('movies.actorAddFilm')}
        </button>
      </div>

      {/* Заметки */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('movies.comment')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={t('movies.actorNotesPlaceholder')}
          className="rounded-xl bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* Кнопки */}
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
          disabled={isSaving || !name.trim()}
          className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isSaving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
