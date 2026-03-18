'use client'

import { useState } from 'react'
import { createClient } from '@/shared/api/supabase'
import { createItem, updateItem, deleteItem } from '@/entities/item/api'
import type { Item } from '@/entities/item/model/types'

export type FoodItemType = 'dish' | 'food_type' | 'cuisine'

export interface FoodFormValues {
  title: string
  type: FoodItemType
  sentiment: 'likes' | 'dislikes'
  comment: string
  /** Необязательная метка кухни для блюд, например "Итальянская" */
  cuisineType: string
  linkedRestaurantId: string | null
  linkedRestaurantName: string | null
}

export function getFoodType(tags: string[] | null): FoodItemType {
  if (tags?.includes('type:dish')) return 'dish'
  if (tags?.includes('type:cuisine')) return 'cuisine'
  return 'food_type'
}

export function getCuisineType(tags: string[] | null): string {
  const tag = tags?.find((t) => t.startsWith('cuisine:'))
  return tag ? tag.slice('cuisine:'.length) : ''
}

export function getLinkedRestaurant(tags: string[] | null): { id: string; name: string } | null {
  const idTag = tags?.find((t) => t.startsWith('restaurant_id:'))
  const nameTag = tags?.find((t) => t.startsWith('restaurant_name:'))
  if (!idTag || !nameTag) return null
  return {
    id: idTag.slice('restaurant_id:'.length),
    name: nameTag.slice('restaurant_name:'.length),
  }
}

function buildFoodTags(values: FoodFormValues): string[] {
  const tags: string[] = [`type:${values.type}`]
  if (values.type === 'dish' || values.type === 'cuisine') {
    if (values.cuisineType.trim()) {
      tags.push(`cuisine:${values.cuisineType.trim()}`)
    }
  }
  if (values.type === 'dish') {
    if (values.linkedRestaurantId && values.linkedRestaurantName) {
      tags.push(`restaurant_id:${values.linkedRestaurantId}`)
      tags.push(`restaurant_name:${values.linkedRestaurantName}`)
    }
  }
  return tags
}

export function useAddFood(
  personId: string,
  categoryId: string,
  onSuccess: (item: Item) => void
) {
  const [isSaving, setIsSaving] = useState(false)

  async function saveFood(values: FoodFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const item = await createItem(supabase, {
        category_id: categoryId,
        person_id: personId,
        title: values.title.trim(),
        description: values.comment.trim() || null,
        external_url: null,
        sentiment: values.sentiment,
        my_rating: null,
        partner_rating: null,
        tags: buildFoodTags(values),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function editFood(itemId: string, values: FoodFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const item = await updateItem(supabase, itemId, {
        title: values.title.trim(),
        description: values.comment.trim() || null,
        sentiment: values.sentiment,
        tags: buildFoodTags(values),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function removeFood(itemId: string) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      await deleteItem(supabase, itemId)
    } finally {
      setIsSaving(false)
    }
  }

  return { isSaving, saveFood, editFood, removeFood }
}
