'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Star, Bell } from 'lucide-react'
import { toast } from 'sonner'
import type { Item } from '@/entities/item/model/types'
import { useAddMovie, getMovieGenres, getMovieReleaseDate, getMoviePinned } from '../model/useAddMovie'
import type { MovieFormValues } from '../model/useAddMovie'

const MOVIE_GENRES = [
  'action', 'comedy', 'drama', 'thriller', 'horror',
  'scifi', 'fantasy', 'romance', 'animation', 'documentary',
  'adventure', 'crime', 'biography', 'musical', 'historical',
]

interface AddMovieFormProps {
  personId: string
  categoryId: string
  item?: Item
  isPro: boolean
  onSuccess: (item: Item) => void
  onCancel: () => void
}

function StarRow({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? null : star)}
          className="p-1 transition-transform active:scale-90"
        >
          <Star
            size={26}
            className={star <= (value ?? 0) ? 'fill-primary text-primary' : 'text-text-muted'}
          />
        </button>
      ))}
    </div>
  )
}

export function AddMovieForm({
  personId,
  categoryId,
  item,
  isPro,
  onSuccess,
  onCancel,
}: AddMovieFormProps) {
  const t = useTranslations()
  const isEdit = !!item
  const { isSaving, saveMovie, editMovie } = useAddMovie(personId, categoryId, onSuccess)

  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [sentiment, setSentiment] = useState<'wants' | 'likes' | 'dislikes'>(
    (item?.sentiment as 'wants' | 'likes' | 'dislikes' | null) ?? 'wants'
  )
  const [genres, setGenres] = useState<string[]>(getMovieGenres(item?.tags ?? null))
  const [releaseDate, setReleaseDate] = useState(getMovieReleaseDate(item?.tags ?? null))
  const [myRating, setMyRating] = useState<number | null>(item?.my_rating ?? null)
  const [partnerRating, setPartnerRating] = useState<number | null>(item?.partner_rating ?? null)
  const [pinned, setPinned] = useState(getMoviePinned(item?.tags ?? null))
  const [genreSearch, setGenreSearch] = useState('')

  const showRating = sentiment === 'likes'
  const showReleaseDate = sentiment === 'wants'

  const filteredGenres = genreSearch.trim()
    ? MOVIE_GENRES.filter((g) =>
        t(`movies.genres.${g}` as Parameters<typeof t>[0]).toLowerCase().includes(genreSearch.toLowerCase())
      )
    : MOVIE_GENRES

  function toggleGenre(genre: string) {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error(t('movies.nameRequired'))
      return
    }
    const values: MovieFormValues = {
      title,
      description,
      sentiment,
      genres,
      releaseDate: showReleaseDate ? releaseDate : '',
      myRating: showRating ? myRating : null,
      partnerRating: showRating ? partnerRating : null,
      pinned,
    }
    try {
      if (isEdit) {
        await editMovie(item.id, values)
        toast.success(t('movies.updated'))
      } else {
        await saveMovie(values)
        toast.success(t('movies.added'))
      }
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Название */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('items.title')} *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('movies.namePlaceholder')}
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
          autoFocus={!isEdit}
        />
      </div>

      {/* Статус */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('movies.status')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSentiment('wants')}
            className={`h-9 flex-1 min-w-0 whitespace-nowrap rounded-[20px] px-3 text-[13px] font-medium transition-colors ${
              sentiment === 'wants' ? 'bg-wants-bg text-wants' : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
            }`}
          >
            🎬 {t('movies.statusWants')}
          </button>
          <button
            type="button"
            onClick={() => setSentiment('likes')}
            className={`h-9 flex-1 min-w-0 whitespace-nowrap rounded-[20px] px-3 text-[13px] font-medium transition-colors ${
              sentiment === 'likes' ? 'bg-loves-bg text-loves' : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
            }`}
          >
            ✅ {t('movies.statusLikes')}
          </button>
          <button
            type="button"
            onClick={() => setSentiment('dislikes')}
            className={`h-9 flex-1 min-w-0 whitespace-nowrap rounded-[20px] px-3 text-[13px] font-medium transition-colors ${
              sentiment === 'dislikes' ? 'bg-avoid-bg text-avoid' : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
            }`}
          >
            ❌ {t('movies.statusDislikes')}
          </button>
        </div>
      </div>

      {/* Рейтинги — только если смотрел (likes) */}
      {showRating && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
              {t('movies.myRating')}
            </label>
            <StarRow value={myRating} onChange={setMyRating} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
              {t('movies.partnerRating')}
            </label>
            <StarRow value={partnerRating} onChange={setPartnerRating} />
          </div>
        </div>
      )}

      {/* Жанры */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('movies.genre')}
        </label>
        <input
          type="text"
          value={genreSearch}
          onChange={(e) => setGenreSearch(e.target.value)}
          placeholder={t('movies.genreSearch')}
          className="h-9 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:ring-1 focus:ring-primary/40"
        />
        <div className="flex flex-wrap gap-2 mt-1">
          {filteredGenres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGenre(g)}
              className={`h-8 rounded-[20px] px-3 text-xs font-medium transition-colors ${
                genres.includes(g) ? 'bg-primary text-white' : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {t(`movies.genres.${g}` as Parameters<typeof t>[0])}
            </button>
          ))}
          {filteredGenres.length === 0 && (
            <p className="text-xs text-text-muted py-1">{t('common.empty')}</p>
          )}
        </div>
      </div>

      {/* Дата выхода — только при статусе "хочу посмотреть" */}
      {showReleaseDate && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            {t('movies.releaseDate')}
          </label>
          <input
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 [color-scheme:dark]"
          />
          {releaseDate && (
            isPro ? (
              <p className="flex items-center gap-1 text-[11px] text-text-muted">
                <Bell size={11} />
                {t('movies.releaseDateHint')}
              </p>
            ) : (
              <Link href="/pro" className="flex items-center gap-1 text-[11px] text-text-muted hover:text-primary transition-colors">
                <Bell size={11} />
                {t('movies.releaseDateHintPro')}
              </Link>
            )
          )}
        </div>
      )}

      {/* Комментарий */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('movies.comment')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={t('movies.commentPlaceholder')}
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
          disabled={isSaving || !title.trim()}
          className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isSaving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
