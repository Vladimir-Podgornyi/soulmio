'use client'

import { useState } from 'react'
import { createClient } from '@/shared/api/supabase'
import { createItem, updateItem, deleteItem } from '@/entities/item/api'
import type { Item } from '@/entities/item/model/types'
import type { PlaceResult } from '@/app/api/places/route'

export interface RestaurantFormValues {
  mapsUrl: string
  name: string
  address: string
  comment: string
  sentiment: 'visited' | 'wants'
  visitDate: string       // дата планируемого посещения (YYYY-MM-DD)
  isBooked: boolean       // уже забронировано (скрытое поле, сохраняется при редактировании)
  myRating: number | null
  partnerRating: number | null
}

export function getVisitDate(tags: string[] | null): string {
  const tag = tags?.find((t) => t.startsWith('visit_date:'))
  return tag ? tag.slice('visit_date:'.length) : ''
}

export function getVisitBooked(tags: string[] | null): boolean {
  return tags?.includes('visit_booked:true') ?? false
}

export function useAddRestaurant(
  personId: string,
  categoryId: string,
  onSuccess: (item: Item) => void
) {
  const [isFetching, setIsFetching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function fetchPlaceDetails(url: string): Promise<PlaceResult> {
    setIsFetching(true)
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      return (await res.json()) as PlaceResult
    } finally {
      setIsFetching(false)
    }
  }

  function buildTags(address: string, visitDate: string, isBooked: boolean): string[] | null {
    const tags: string[] = []
    if (address.trim()) tags.push(`📍 ${address.trim()}`)
    if (visitDate.trim()) tags.push(`visit_date:${visitDate.trim()}`)
    if (isBooked) tags.push('visit_booked:true')
    return tags.length > 0 ? tags : null
  }

  async function saveRestaurant(values: RestaurantFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const sentiment = values.sentiment === 'visited' ? 'visited' : 'wants'
      const item = await createItem(supabase, {
        category_id: categoryId,
        person_id: personId,
        title: values.name.trim(),
        description: values.comment.trim() || null,
        external_url: values.mapsUrl.trim() || null,
        sentiment,
        my_rating: sentiment === 'visited' ? (values.myRating ?? null) : null,
        partner_rating: sentiment === 'visited' ? (values.partnerRating ?? null) : null,
        tags: buildTags(values.address, values.visitDate, false),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function editRestaurant(itemId: string, values: RestaurantFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const sentiment = values.sentiment === 'visited' ? 'visited' : 'wants'
      const item = await updateItem(supabase, itemId, {
        title: values.name.trim(),
        description: values.comment.trim() || null,
        external_url: values.mapsUrl.trim() || null,
        sentiment,
        my_rating: sentiment === 'visited' ? (values.myRating ?? null) : null,
        partner_rating: sentiment === 'visited' ? (values.partnerRating ?? null) : null,
        tags: buildTags(values.address, values.visitDate, values.isBooked),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function removeRestaurant(itemId: string) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      await deleteItem(supabase, itemId)
    } finally {
      setIsSaving(false)
    }
  }

  return { isFetching, isSaving, fetchPlaceDetails, saveRestaurant, editRestaurant, removeRestaurant }
}
