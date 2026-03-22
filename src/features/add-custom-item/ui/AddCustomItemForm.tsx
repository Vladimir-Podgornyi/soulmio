'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Star, Link as LinkIcon, Bell, Zap, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Item } from '@/entities/item/model/types'
import {
  useAddCustomItem,
  getCustomItemPinned,
  getCustomItemDate,
  getCustomItemReminderDays,
  getCustomItemLikesLabel,
  getCustomItemDislikesLabel,
  CUSTOM_REMINDER_DAY_OPTIONS,
  type CustomItemFormValues,
  type CustomReminderDays,
} from '../model/useAddCustomItem'

interface AddCustomItemFormProps {
  personId: string
  categoryId: string
  item?: Item
  isPro: boolean
  onSuccess: (item: Item) => void
  onCancel: () => void
}

function StarRating({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(value === s ? null : s)}
          className="p-0.5 transition-transform active:scale-90"
        >
          <Star
            size={20}
            className={s <= (value ?? 0) ? 'fill-primary text-primary' : 'text-border-card'}
          />
        </button>
      ))}
    </div>
  )
}

export function AddCustomItemForm({
  personId,
  categoryId,
  item,
  isPro,
  onSuccess,
  onCancel,
}: AddCustomItemFormProps) {
  const t = useTranslations()
  const isEdit = !!item
  const { isSaving, saveCustomItem, editCustomItem } = useAddCustomItem(personId, categoryId, onSuccess)

  const [title, setTitle] = useState(item?.title ?? '')
  const [sentiment, setSentiment] = useState<'likes' | 'dislikes'>(
    item?.sentiment === 'dislikes' ? 'dislikes' : 'likes'
  )
  const [likesLabel, setLikesLabel] = useState(getCustomItemLikesLabel(item?.tags ?? null))
  const [dislikesLabel, setDislikesLabel] = useState(getCustomItemDislikesLabel(item?.tags ?? null))
  const [editingStatus, setEditingStatus] = useState<'likes' | 'dislikes' | null>(null)
  const [comment, setComment] = useState(item?.description ?? '')
  const [date, setDate] = useState(getCustomItemDate(item?.tags ?? null))
  const [reminderDays, setReminderDays] = useState<CustomReminderDays>(
    getCustomItemReminderDays(item?.tags ?? null)
  )
  const [myRating, setMyRating] = useState<number | null>(item?.my_rating ?? null)
  const [partnerRating, setPartnerRating] = useState<number | null>(item?.partner_rating ?? null)
  const [externalUrl, setExternalUrl] = useState(item?.external_url ?? '')
  const [pinned, setPinned] = useState(getCustomItemPinned(item?.tags ?? null))

  const likesDisplay = likesLabel.trim() || t('items.sentiments.likes')
  const dislikesDisplay = dislikesLabel.trim() || t('items.sentiments.dislikes')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error(t('customItem.nameRequired'))
      return
    }

    const values: CustomItemFormValues = {
      title,
      sentiment,
      likesLabel: isPro ? likesLabel : '',
      dislikesLabel: isPro ? dislikesLabel : '',
      comment,
      date: isPro ? date : '',
      reminderDays,
      myRating: isPro ? myRating : null,
      partnerRating: isPro ? partnerRating : null,
      externalUrl: isPro ? externalUrl : '',
      pinned,
    }

    try {
      if (isEdit) {
        await editCustomItem(item.id, values)
        toast.success(t('customItem.updated'))
      } else {
        await saveCustomItem(values)
        toast.success(t('customItem.added'))
      }
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Название */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('customItem.title')} *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('customItem.namePlaceholder')}
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
          autoFocus={!isEdit}
        />
      </div>

      {/* Статус */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('customItem.status')}
        </label>
        <div className="flex gap-2">

          {/* ❤️ Likes */}
          <div className={`flex flex-1 h-9 items-center rounded-[20px] transition-colors overflow-hidden ${
            sentiment === 'likes' ? 'bg-loves-bg' : 'bg-bg-input'
          }`}>
            <button
              type="button"
              onClick={() => { setSentiment('likes'); setEditingStatus(null) }}
              className="flex flex-1 min-w-0 items-center gap-1.5 pl-3 h-full"
            >
              <span className="text-sm flex-shrink-0">❤️</span>
              {editingStatus === 'likes' ? (
                <input
                  autoFocus
                  type="text"
                  value={likesLabel}
                  onChange={(e) => setLikesLabel(e.target.value)}
                  onBlur={() => setEditingStatus(null)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={t('items.sentiments.likes')}
                  maxLength={20}
                  className={`flex-1 min-w-0 bg-transparent text-[13px] font-medium outline-none placeholder:opacity-40 ${
                    sentiment === 'likes' ? 'text-loves' : 'text-text-secondary'
                  }`}
                />
              ) : (
                <span className={`flex-1 min-w-0 truncate text-left text-[13px] font-medium ${
                  sentiment === 'likes' ? 'text-loves' : 'text-text-secondary'
                }`}>
                  {likesDisplay}
                </span>
              )}
            </button>
            {isPro && editingStatus !== 'likes' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setEditingStatus('likes') }}
                className={`flex h-full w-7 flex-shrink-0 items-center justify-center transition-colors ${
                  sentiment === 'likes' ? 'text-loves/50 hover:text-loves' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Pencil size={11} />
              </button>
            )}
          </div>

          {/* 😕 Dislikes */}
          <div className={`flex flex-1 h-9 items-center rounded-[20px] transition-colors overflow-hidden ${
            sentiment === 'dislikes' ? 'bg-avoid-bg' : 'bg-bg-input'
          }`}>
            <button
              type="button"
              onClick={() => { setSentiment('dislikes'); setEditingStatus(null) }}
              className="flex flex-1 min-w-0 items-center gap-1.5 pl-3 h-full"
            >
              <span className="text-sm flex-shrink-0">😕</span>
              {editingStatus === 'dislikes' ? (
                <input
                  autoFocus
                  type="text"
                  value={dislikesLabel}
                  onChange={(e) => setDislikesLabel(e.target.value)}
                  onBlur={() => setEditingStatus(null)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={t('items.sentiments.dislikes')}
                  maxLength={20}
                  className={`flex-1 min-w-0 bg-transparent text-[13px] font-medium outline-none placeholder:opacity-40 ${
                    sentiment === 'dislikes' ? 'text-avoid' : 'text-text-secondary'
                  }`}
                />
              ) : (
                <span className={`flex-1 min-w-0 truncate text-left text-[13px] font-medium ${
                  sentiment === 'dislikes' ? 'text-avoid' : 'text-text-secondary'
                }`}>
                  {dislikesDisplay}
                </span>
              )}
            </button>
            {isPro && editingStatus !== 'dislikes' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setEditingStatus('dislikes') }}
                className={`flex h-full w-7 flex-shrink-0 items-center justify-center transition-colors ${
                  sentiment === 'dislikes' ? 'text-avoid/50 hover:text-avoid' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Pencil size={11} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Комментарий */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('customItem.comment')}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder={t('customItem.commentPlaceholder')}
          className="rounded-xl bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 resize-none"
        />
      </div>

      {isPro ? (
        <>
          {/* Pro: Дата */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
              {t('customItem.date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 [color-scheme:dark]"
            />
          </div>

          {/* Pro: Напоминание (только если есть дата) */}
          {date && (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                {t('customItem.reminderLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_REMINDER_DAY_OPTIONS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setReminderDays(days)}
                    className={`h-8 rounded-[20px] px-3 text-xs font-medium transition-colors ${
                      reminderDays === days
                        ? 'bg-primary text-white'
                        : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    {t(`travel.reminder${days}`)}
                  </button>
                ))}
              </div>
              <p className="flex items-center gap-1 text-[11px] text-text-muted">
                <Bell size={11} />
                {t('customItem.dateHint')}
              </p>
            </div>
          )}

          {/* Pro: Моя оценка */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
              {t('items.ratings.mine')}
            </label>
            <StarRating value={myRating} onChange={setMyRating} />
          </div>

          {/* Pro: Оценка партнера */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
              {t('items.ratings.partner')}
            </label>
            <StarRating value={partnerRating} onChange={setPartnerRating} />
          </div>

          {/* Pro: Ссылка */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
              {t('customItem.link')}
            </label>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder={t('customItem.linkPlaceholder')}
                className="h-11 w-full rounded-xl bg-bg-input pl-8 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>
        </>
      ) : (
        /* Free: подсказка про Pro */
        <Link
          href="/pro"
          className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 hover:border-primary/30 transition-colors"
        >
          <Zap size={15} className="flex-shrink-0 text-text-muted" />
          <span className="flex-1 text-sm text-text-muted">{t('customItem.proHint')}</span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            Pro
          </span>
        </Link>
      )}

      {/* Закрепить */}
      <button
        type="button"
        onClick={() => setPinned((v) => !v)}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
          pinned ? 'bg-primary/10 text-primary' : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
        }`}
      >
        <Star size={16} className={pinned ? 'fill-primary text-primary' : 'text-text-muted'} />
        {t('gifts.pinned')}
      </button>

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
