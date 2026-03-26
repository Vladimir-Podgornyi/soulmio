'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Clock, Link, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Item } from '@/entities/item/model/types'
import { useAddRestaurant, getVisitDate, getVisitTime, getVisitBooked } from '../model/useAddRestaurant'
import { TimePicker } from '@/shared/ui/TimePicker'

interface AddRestaurantFormProps {
  personId: string
  categoryId: string
  /** Все уже сохранённые рестораны — используются для обнаружения дублей */
  existingItems?: Item[]
  /** Передайте существующий элемент для входа в режим редактирования */
  item?: Item
  onSuccess: (item: Item) => void
  onCancel: () => void
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-яё0-9]/gi, ' ').replace(/\s+/g, ' ').trim()
}

function findDuplicate(name: string, items: Item[], excludeId?: string): Item | null {
  const needle = normalize(name)
  if (needle.length < 4) return null
  for (const item of items) {
    if (item.id === excludeId) continue
    const hay = normalize(item.title)
    if (hay === needle || hay.includes(needle) || needle.includes(hay)) return item
  }
  return null
}

function getAddressFromTags(tags: string[] | null): string {
  const tag = tags?.find((t) => t.startsWith('📍'))
  return tag ? tag.slice(2).trim() : ''
}

export function AddRestaurantForm({
  personId,
  categoryId,
  existingItems = [],
  item,
  onSuccess,
  onCancel,
}: AddRestaurantFormProps) {
  const t = useTranslations()
  const isEdit = !!item
  const { isFetching, isSaving, fetchPlaceDetails, saveRestaurant, editRestaurant } =
    useAddRestaurant(personId, categoryId, onSuccess)

  const [mapsUrl, setMapsUrl]         = useState(item?.external_url ?? '')
  const [name, setName]               = useState(item?.title ?? '')
  const [address, setAddress]         = useState(getAddressFromTags(item?.tags ?? null))
  const [comment, setComment]         = useState(item?.description ?? '')
  const [sentiment, setSentiment]     = useState<'visited' | 'wants'>(
    item?.sentiment === 'visited' ? 'visited' : 'wants'
  )
  const [visitDate, setVisitDate]     = useState(getVisitDate(item?.tags ?? null))
  const [visitTime, setVisitTime]     = useState(getVisitTime(item?.tags ?? null))
  const [myRating, setMyRating]       = useState<number | null>(item?.my_rating ?? null)
  const [partnerRating, setPartnerRating] = useState<number | null>(item?.partner_rating ?? null)

  const isBooked = getVisitBooked(item?.tags ?? null)
  const duplicate = findDuplicate(name, existingItems, item?.id)

  function handleNameChange(value: string) {
    setName(value)
  }

  async function handleFetchDetails() {
    if (!mapsUrl.trim()) return
    try {
      const result = await fetchPlaceDetails(mapsUrl.trim())
      if (result.name) setName(result.name)
      if (result.address) setAddress(result.address)
      if (!result.name && !result.address) toast.info(t('restaurants.fetchNoResult'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error(t('restaurants.nameRequired')); return }

    const values = { mapsUrl, name, address, comment, sentiment, visitDate, visitTime, isBooked, myRating, partnerRating }

    try {
      if (isEdit) {
        await editRestaurant(item.id, values)
        toast.success(t('restaurants.updated'))
      } else {
        await saveRestaurant(values)
        toast.success(t('restaurants.added'))
      }
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Ссылка на карты */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('restaurants.mapsUrl')}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="h-11 w-full rounded-xl bg-bg-input pl-8 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <button
            type="button"
            onClick={handleFetchDetails}
            disabled={!mapsUrl.trim() || isFetching}
            className="h-11 rounded-xl bg-bg-input px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-40"
          >
            {isFetching ? '...' : t('restaurants.fetch')}
          </button>
        </div>
        <p className="text-[11px] text-text-muted">{t('restaurants.mapsHint')}</p>
      </div>

      {/* Название */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('items.title')} *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={t('restaurants.namePlaceholder')}
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
        />
      </div>

      {/* Адрес */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('restaurants.address')}
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t('restaurants.addressPlaceholder')}
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
        />
      </div>

      {/* Статус */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('restaurants.status')}
        </label>
        <div className="flex gap-2">
          {(['visited', 'wants'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSentiment(s)}
              className={`h-9 flex-1 min-w-0 whitespace-nowrap rounded-[20px] px-3 text-[13px] font-medium transition-colors ${
                sentiment === s
                  ? 'bg-primary text-white'
                  : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {s === 'visited' ? t('items.sentiments.visited') : t('items.sentiments.wants')}
            </button>
          ))}
        </div>
      </div>

      {/* Дата + время посещения — только для "хочу посетить" */}
      {sentiment === 'wants' && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
              {t('restaurants.visitDate')}
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 dark:[color-scheme:dark]"
            />
            {visitDate && (
              <p className="text-[11px] text-text-muted">{t('restaurants.visitDateHint')}</p>
            )}
          </div>

          {visitDate && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                  {t('restaurants.visitTime')}
                </label>
                <span className="text-[10px] text-text-muted">{t('common.optional')}</span>
              </div>

              {visitTime ? (
                <>
                  <div className="rounded-xl bg-bg-input px-4 py-3">
                    <TimePicker value={visitTime} onChange={setVisitTime} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setVisitTime('')}
                    className="self-start flex items-center gap-1.5 rounded-full border border-[var(--avoid-text)]/30 bg-[var(--avoid-bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--avoid-text)] hover:opacity-80 transition-opacity"
                  >
                    <X size={11} strokeWidth={2.5} />
                    {t('common.clear')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setVisitTime('19:00')}
                  className="flex h-11 items-center gap-2 rounded-xl bg-bg-input px-4 text-sm text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors"
                >
                  <Clock size={14} />
                  {t('restaurants.addTime')}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Рейтинги — только если посещали */}
      {sentiment === 'visited' && (
        <div className="flex gap-4">
          <RatingField label={t('items.ratings.mine')} value={myRating} onChange={setMyRating} />
          <RatingField label={t('items.ratings.partner')} value={partnerRating} onChange={setPartnerRating} />
        </div>
      )}

      {/* Комментарий */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('restaurants.comment')}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={t('restaurants.commentPlaceholder')}
          className="rounded-xl bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* Предупреждение о дубликате */}
      {duplicate && (
        <div className="flex items-start gap-2.5 rounded-[10px] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <span className="mt-0.5 text-base leading-none">⚠️</span>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {t('restaurants.duplicateWarning', { name: duplicate.title })}
          </p>
        </div>
      )}

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
          disabled={isSaving || !name.trim()}
          className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isSaving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}

/* ── Поле рейтинга ── */

interface RatingFieldProps {
  label: string
  value: number | null
  onChange: (v: number | null) => void
}

function RatingField({ label, value, onChange }: RatingFieldProps) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(value === star ? null : star)}
            className="p-0.5"
          >
            <Star
              size={22}
              className={star <= (value ?? 0) ? 'fill-primary text-primary' : 'text-text-muted'}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
