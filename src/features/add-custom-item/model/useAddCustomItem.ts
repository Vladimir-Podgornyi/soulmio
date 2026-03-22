'use client'

import { useState } from 'react'
import { createClient } from '@/shared/api/supabase'
import { createItem, updateItem, deleteItem } from '@/entities/item/api'
import type { Item, Sentiment } from '@/entities/item/model/types'

export const CUSTOM_REMINDER_DAY_OPTIONS = [7, 14, 30, 60, 90] as const
export type CustomReminderDays = (typeof CUSTOM_REMINDER_DAY_OPTIONS)[number]

export interface CustomItemFormValues {
  title: string
  sentiment: 'likes' | 'dislikes'
  likesLabel: string
  dislikesLabel: string
  comment: string
  date: string
  reminderDays: CustomReminderDays
  myRating: number | null
  partnerRating: number | null
  externalUrl: string
  pinned: boolean
}

export function getCustomItemPinned(tags: string[] | null): boolean {
  return tags?.includes('pinned:true') ?? false
}

export function getCustomItemDate(tags: string[] | null): string {
  const tag = tags?.find((t) => t.startsWith('custom_date:'))
  return tag ? tag.slice('custom_date:'.length) : ''
}

export function getCustomItemReminderDays(tags: string[] | null): CustomReminderDays {
  const tag = tags?.find((t) => t.startsWith('reminder_days:'))
  if (!tag) return 7
  const n = Number(tag.slice('reminder_days:'.length))
  return (CUSTOM_REMINDER_DAY_OPTIONS as readonly number[]).includes(n)
    ? (n as CustomReminderDays)
    : 7
}

export function getCustomItemLikesLabel(tags: string[] | null): string {
  const tag = tags?.find((t) => t.startsWith('likes_label:'))
  return tag ? tag.slice('likes_label:'.length) : ''
}

export function getCustomItemDislikesLabel(tags: string[] | null): string {
  const tag = tags?.find((t) => t.startsWith('dislikes_label:'))
  return tag ? tag.slice('dislikes_label:'.length) : ''
}

function buildCustomItemTags(values: CustomItemFormValues): string[] {
  const tags: string[] = []
  if (values.pinned) tags.push('pinned:true')
  if (values.likesLabel.trim()) tags.push(`likes_label:${values.likesLabel.trim()}`)
  if (values.dislikesLabel.trim()) tags.push(`dislikes_label:${values.dislikesLabel.trim()}`)
  if (values.date.trim()) {
    tags.push(`custom_date:${values.date.trim()}`)
    tags.push(`reminder_days:${values.reminderDays}`)
  }
  return tags
}

export function useAddCustomItem(
  personId: string,
  categoryId: string,
  onSuccess: (item: Item) => void
) {
  const [isSaving, setIsSaving] = useState(false)

  async function saveCustomItem(values: CustomItemFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const item = await createItem(supabase, {
        category_id: categoryId,
        person_id: personId,
        title: values.title.trim(),
        description: values.comment.trim() || null,
        image_url: null,
        external_url: values.externalUrl.trim() || null,
        price: null,
        sentiment: values.sentiment as Sentiment,
        my_rating: values.myRating,
        partner_rating: values.partnerRating,
        tags: buildCustomItemTags(values),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function editCustomItem(itemId: string, values: CustomItemFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const item = await updateItem(supabase, itemId, {
        title: values.title.trim(),
        description: values.comment.trim() || null,
        external_url: values.externalUrl.trim() || null,
        sentiment: values.sentiment as Sentiment,
        my_rating: values.myRating,
        partner_rating: values.partnerRating,
        tags: buildCustomItemTags(values),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function removeCustomItem(itemId: string) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      await deleteItem(supabase, itemId)
    } finally {
      setIsSaving(false)
    }
  }

  return { isSaving, saveCustomItem, editCustomItem, removeCustomItem }
}
