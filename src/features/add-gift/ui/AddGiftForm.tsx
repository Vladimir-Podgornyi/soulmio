'use client'

import { useState, useRef } from 'react'
import NextLink from 'next/link'
import { useTranslations } from 'next-intl'
import { Link, Star, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Item } from '@/entities/item/model/types'
import { useAddGift, getGiftPinned, getGiftDate } from '../model/useAddGift'
import type { GiftFormValues } from '../model/useAddGift'
import { useCurrency } from '@/shared/lib/currency'
import { uploadImage } from '@/shared/lib/uploadImage'

interface AddGiftFormProps {
  personId: string
  categoryId: string
  item?: Item
  isPro: boolean
  onSuccess: (item: Item) => void
  onCancel: () => void
}

export function AddGiftForm({
  personId,
  categoryId,
  item,
  isPro,
  onSuccess,
  onCancel,
}: AddGiftFormProps) {
  const t = useTranslations()
  const isEdit = !!item
  const { symbol: currencySymbol } = useCurrency()
  const { isFetching, isSaving, fetchProductDetails, saveGift, editGift } = useAddGift(
    personId,
    categoryId,
    onSuccess
  )

  const [externalUrl, setExternalUrl] = useState(item?.external_url ?? '')
  const [title, setTitle] = useState(item?.title ?? '')
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '')
  const [sentiment, setSentiment] = useState<'wants' | 'likes'>(
    item?.sentiment === 'likes' ? 'likes' : 'wants'
  )
  const [giftDate, setGiftDate] = useState(getGiftDate(item?.tags ?? null))
  const [pinned, setPinned] = useState(getGiftPinned(item?.tags ?? null))
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFetchDetails() {
    if (!externalUrl.trim()) return
    try {
      const result = await fetchProductDetails(externalUrl.trim())
      if (result.title) setTitle(result.title)
      if (result.price != null) setPrice(String(result.price))
      if (result.imageUrl) setImageUrl(result.imageUrl)
      if (!result.title && !result.price && !result.imageUrl) {
        toast.info(t('gifts.fetchNoResult'))
      }
    } catch {
      toast.error(t('common.error'))
    }
  }

  function handlePriceChange(raw: string) {
    // Разрешаем только цифры и одну точку/запятую (нормализуем запятую → точка)
    const cleaned = raw.replace(',', '.').replace(/[^\d.]/g, '')
    // Запрещаем больше одной точки
    const parts = cleaned.split('.')
    const normalised = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned
    setPrice(normalised)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Сбрасываем значение, чтобы можно было выбрать тот же файл повторно
    e.target.value = ''

    if (!file.type.startsWith('image/')) {
      toast.error(t('gifts.uploadNotImage'))
      return
    }

    setIsUploading(true)
    try {
      const url = await uploadImage(file)
      setImageUrl(url)
    } catch {
      toast.error(t('gifts.uploadError'))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error(t('gifts.nameRequired'))
      return
    }

    const values: GiftFormValues = {
      title,
      description,
      externalUrl,
      imageUrl,
      price,
      sentiment,
      giftDate,
      pinned,
    }

    try {
      if (isEdit) {
        await editGift(item.id, values)
        toast.success(t('gifts.updated'))
      } else {
        await saveGift(values)
        toast.success(t('gifts.added'))
      }
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Ссылка на товар */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('gifts.productUrl')}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder={t('gifts.productUrlPlaceholder')}
              className="h-11 w-full rounded-xl bg-bg-input pl-8 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <button
            type="button"
            onClick={handleFetchDetails}
            disabled={!externalUrl.trim() || isFetching}
            className="h-11 rounded-xl bg-bg-input px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-40"
          >
            {isFetching ? '...' : t('gifts.fetch')}
          </button>
        </div>
        <p className="text-[11px] text-text-muted">{t('gifts.productUrlHint')}</p>
      </div>

      {/* Превью изображения */}
      {imageUrl ? (
        <div className="flex items-center gap-3 rounded-xl bg-bg-input p-3">
          <img
            src={imageUrl}
            alt=""
            className="h-14 w-14 flex-shrink-0 rounded-[10px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
            <span className="text-[11px] uppercase tracking-[0.08em] text-text-muted">
              {t('items.image')}
            </span>
            <span className="text-xs text-text-secondary truncate">{imageUrl}</span>
          </div>
          <button
            type="button"
            onClick={() => setImageUrl('')}
            className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : isPro ? (
        /* Pro: кнопка загрузки фото */
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-transparent text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-50"
          >
            <Upload size={15} />
            {isUploading ? t('gifts.uploading') : t('gifts.uploadPhoto')}
          </button>
        </div>
      ) : (
        /* Free: paywall-заглушка */
        <NextLink href="/pro" className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 hover:border-primary/30 transition-colors">
          <Upload size={15} className="flex-shrink-0 text-text-muted" />
          <span className="flex-1 text-sm text-text-muted">{t('gifts.uploadPhoto')}</span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            Pro
          </span>
        </NextLink>
      )}

      {/* Название */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('items.title')} *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('gifts.namePlaceholder')}
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
          autoFocus={!isEdit}
        />
      </div>

      {/* Цена */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('gifts.price')}
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted">{currencySymbol}</span>
          <input
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => handlePriceChange(e.target.value)}
            placeholder={t('gifts.pricePlaceholder')}
            className="h-11 w-full rounded-xl bg-bg-input pl-7 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Статус */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('gifts.status')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSentiment('wants')}
            className={`h-9 flex-1 min-w-0 whitespace-nowrap rounded-[20px] px-4 text-[13px] font-medium transition-colors ${
              sentiment === 'wants'
                ? 'bg-wants-bg text-wants'
                : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
            }`}
          >
            🎁 {t('items.sentiments.wants')}
          </button>
          <button
            type="button"
            onClick={() => setSentiment('likes')}
            className={`h-9 flex-1 min-w-0 whitespace-nowrap rounded-[20px] px-4 text-[13px] font-medium transition-colors ${
              sentiment === 'likes'
                ? 'bg-loves-bg text-loves'
                : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
            }`}
          >
            ✅ {t('gifts.filterGifted')}
          </button>
        </div>
      </div>

      {/* Комментарий */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('gifts.description')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={t('gifts.descriptionPlaceholder')}
          className="rounded-xl bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* Дата */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('gifts.date')}
        </label>
        <input
          type="date"
          value={giftDate}
          onChange={(e) => setGiftDate(e.target.value)}
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 dark:[color-scheme:dark]"
        />
      </div>

      {/* Закрепить вверху */}
      <button
        type="button"
        onClick={() => setPinned((v) => !v)}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
          pinned
            ? 'bg-primary/10 text-primary'
            : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
        }`}
      >
        <Star size={16} className={pinned ? 'fill-primary text-primary' : 'text-text-muted'} />
        {t('gifts.pinned')}
      </button>

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
          disabled={isSaving || isUploading || !title.trim()}
          className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isSaving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
