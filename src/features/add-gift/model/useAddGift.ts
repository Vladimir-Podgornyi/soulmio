'use client'

import { useState } from 'react'
import { createClient } from '@/shared/api/supabase'
import { createItem, updateItem, deleteItem } from '@/entities/item/api'
import type { Item } from '@/entities/item/model/types'

export interface GiftFormValues {
  title: string
  description: string
  externalUrl: string
  imageUrl: string
  price: string
  sentiment: 'wants' | 'likes'
  giftDate: string
  pinned: boolean
}

export function getGiftPinned(tags: string[] | null): boolean {
  return tags?.includes('pinned:true') ?? false
}

export function getGiftDate(tags: string[] | null): string {
  const tag = tags?.find((t) => t.startsWith('gift_date:'))
  return tag ? tag.slice('gift_date:'.length) : ''
}

function buildGiftTags(values: GiftFormValues): string[] {
  const tags: string[] = []
  if (values.pinned) tags.push('pinned:true')
  if (values.giftDate.trim()) tags.push(`gift_date:${values.giftDate.trim()}`)
  return tags
}

export function useAddGift(
  personId: string,
  categoryId: string,
  onSuccess: (item: Item) => void
) {
  const [isFetching, setIsFetching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function fetchProductDetails(url: string): Promise<{
    title: string | null
    price: number | null
    imageUrl: string | null
  }> {
    setIsFetching(true)
    try {
      const res = await fetch('/api/gifts/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      return await res.json() as { title: string | null; price: number | null; imageUrl: string | null }
    } finally {
      setIsFetching(false)
    }
  }

  async function saveGift(values: GiftFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const priceNum = values.price.trim()
        ? parseFloat(values.price.replace(',', '.'))
        : null

      const item = await createItem(supabase, {
        category_id: categoryId,
        person_id: personId,
        title: values.title.trim(),
        description: values.description.trim() || null,
        image_url: values.imageUrl.trim() || null,
        external_url: values.externalUrl.trim() || null,
        price: isNaN(priceNum ?? NaN) ? null : priceNum,
        sentiment: values.sentiment,
        my_rating: null,
        partner_rating: null,
        tags: buildGiftTags(values),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function editGift(itemId: string, values: GiftFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()

      const priceNum = values.price.trim()
        ? parseFloat(values.price.replace(',', '.'))
        : null

      const item = await updateItem(supabase, itemId, {
        title: values.title.trim(),
        description: values.description.trim() || null,
        image_url: values.imageUrl.trim() || null,
        external_url: values.externalUrl.trim() || null,
        price: isNaN(priceNum ?? NaN) ? null : priceNum,
        sentiment: values.sentiment,
        tags: buildGiftTags(values),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function removeGift(itemId: string) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      await deleteItem(supabase, itemId)
    } finally {
      setIsSaving(false)
    }
  }

  return { isFetching, isSaving, fetchProductDetails, saveGift, editGift, removeGift }
}
