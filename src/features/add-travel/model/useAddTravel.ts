'use client'
import { useState } from 'react'
import { createClient } from '@/shared/api/supabase'
import { createItem, updateItem, deleteItem } from '@/entities/item/api'
import type { Item } from '@/entities/item/model/types'

export interface TravelBudget {
  hotel: number | null
  transport: number | null
  onsite: number | null
  other: number | null
}

export interface TravelFormValues {
  city: string
  country: string
  countryCode: string
  sentiment: 'wants' | 'visited'
  tripDate: string
  comment: string
  pinned: boolean
  hasPlanBudget: boolean
  planBudget: TravelBudget
  hasActualBudget: boolean
  actualBudget: TravelBudget
}

// Helpers to read from tags
export function getTravelPinned(tags: string[] | null): boolean {
  return tags?.includes('pinned:true') ?? false
}

export function getTravelCity(tags: string[] | null): string {
  const t = tags?.find((tag) => tag.startsWith('city:'))
  return t ? t.slice('city:'.length) : ''
}

export function getTravelCountry(tags: string[] | null): { name: string; code: string } {
  const name = tags?.find((t) => t.startsWith('country:'))?.slice('country:'.length) ?? ''
  const code = tags?.find((t) => t.startsWith('country_code:'))?.slice('country_code:'.length) ?? ''
  return { name, code }
}

export function getTravelDate(tags: string[] | null): string {
  const t = tags?.find((tag) => tag.startsWith('trip_date:'))
  return t ? t.slice('trip_date:'.length) : ''
}

export function getTravelBudget(tags: string[] | null): { plan: TravelBudget; actual: TravelBudget } {
  const num = (prefix: string) => {
    const t = tags?.find((tag) => tag.startsWith(prefix))
    return t ? Number(t.slice(prefix.length)) : null
  }
  return {
    plan: {
      hotel: num('plan_hotel:'),
      transport: num('plan_transport:'),
      onsite: num('plan_onsite:'),
      other: num('plan_other:'),
    },
    actual: {
      hotel: num('actual_hotel:'),
      transport: num('actual_transport:'),
      onsite: num('actual_onsite:'),
      other: num('actual_other:'),
    },
  }
}

function buildTravelTags(values: TravelFormValues): string[] {
  const tags: string[] = []
  if (values.pinned) tags.push('pinned:true')
  if (values.city.trim()) tags.push(`city:${values.city.trim()}`)
  if (values.country.trim()) tags.push(`country:${values.country.trim()}`)
  if (values.countryCode.trim()) tags.push(`country_code:${values.countryCode.trim()}`)
  if (values.tripDate.trim()) tags.push(`trip_date:${values.tripDate.trim()}`)
  if (values.hasPlanBudget) {
    const b = values.planBudget
    if (b.hotel !== null) tags.push(`plan_hotel:${b.hotel}`)
    if (b.transport !== null) tags.push(`plan_transport:${b.transport}`)
    if (b.onsite !== null) tags.push(`plan_onsite:${b.onsite}`)
    if (b.other !== null) tags.push(`plan_other:${b.other}`)
  }
  if (values.hasActualBudget) {
    const b = values.actualBudget
    if (b.hotel !== null) tags.push(`actual_hotel:${b.hotel}`)
    if (b.transport !== null) tags.push(`actual_transport:${b.transport}`)
    if (b.onsite !== null) tags.push(`actual_onsite:${b.onsite}`)
    if (b.other !== null) tags.push(`actual_other:${b.other}`)
  }
  return tags
}

function buildTitle(values: TravelFormValues): string {
  const parts = []
  if (values.city.trim()) parts.push(values.city.trim())
  if (values.country.trim()) parts.push(values.country.trim())
  return parts.join(', ') || 'Trip'
}

export function useAddTravel(
  personId: string,
  categoryId: string,
  onSuccess: (item: Item) => void
) {
  const [isSaving, setIsSaving] = useState(false)

  async function saveTravel(values: TravelFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const item = await createItem(supabase, {
        category_id: categoryId,
        person_id: personId,
        title: buildTitle(values),
        description: values.comment.trim() || null,
        image_url: null,
        external_url: null,
        price: null,
        sentiment: values.sentiment,
        my_rating: null,
        partner_rating: null,
        tags: buildTravelTags(values),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function editTravel(itemId: string, values: TravelFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const item = await updateItem(supabase, itemId, {
        title: buildTitle(values),
        description: values.comment.trim() || null,
        sentiment: values.sentiment,
        tags: buildTravelTags(values),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function removeTravel(itemId: string) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      await deleteItem(supabase, itemId)
    } finally {
      setIsSaving(false)
    }
  }

  return { isSaving, saveTravel, editTravel, removeTravel }
}
