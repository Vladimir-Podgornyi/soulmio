'use client'

import { useState } from 'react'
import { createClient } from '@/shared/api/supabase'
import { createItem, updateItem, deleteItem } from '@/entities/item/api'
import type { Item } from '@/entities/item/model/types'

export type MovieSentiment = 'wants' | 'likes' | 'dislikes'

export interface MovieFormValues {
  title: string
  description: string
  sentiment: MovieSentiment
  genres: string[]
  releaseDate: string
  myRating: number | null
  partnerRating: number | null
  pinned: boolean
}

export function getMoviePinned(tags: string[] | null): boolean {
  return tags?.includes('pinned:true') ?? false
}

export interface ActorFormValues {
  name: string
  description: string
  films: string[]
  pinned: boolean
}

export function getMovieGenres(tags: string[] | null): string[] {
  return (tags ?? []).filter((t) => t.startsWith('genre:')).map((t) => t.slice('genre:'.length))
}

export function getMovieReleaseDate(tags: string[] | null): string {
  const tag = (tags ?? []).find((t) => t.startsWith('release_date:'))
  return tag ? tag.slice('release_date:'.length) : ''
}

export function isActorItem(tags: string[] | null): boolean {
  return (tags ?? []).includes('item_type:actor')
}

export function getActorFilms(tags: string[] | null): string[] {
  return (tags ?? []).filter((t) => t.startsWith('film:')).map((t) => t.slice('film:'.length))
}

function buildMovieTags(values: MovieFormValues): string[] {
  const tags: string[] = []
  if (values.pinned) tags.push('pinned:true')
  for (const g of values.genres) {
    if (g.trim()) tags.push(`genre:${g.trim()}`)
  }
  if (values.releaseDate.trim()) {
    tags.push(`release_date:${values.releaseDate.trim()}`)
  }
  return tags
}

function buildActorTags(films: string[], pinned = false): string[] {
  const tags: string[] = ['item_type:actor']
  if (pinned) tags.push('pinned:true')
  for (const f of films) {
    if (f.trim()) tags.push(`film:${f.trim()}`)
  }
  return tags
}

export function useAddMovie(
  personId: string,
  categoryId: string,
  onSuccess: (item: Item) => void
) {
  const [isSaving, setIsSaving] = useState(false)

  async function saveMovie(values: MovieFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const item = await createItem(supabase, {
        category_id: categoryId,
        person_id: personId,
        title: values.title.trim(),
        description: values.description.trim() || null,
        image_url: null,
        external_url: null,
        price: null,
        sentiment: values.sentiment,
        my_rating: values.myRating,
        partner_rating: values.partnerRating,
        tags: buildMovieTags(values),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function editMovie(itemId: string, values: MovieFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const item = await updateItem(supabase, itemId, {
        title: values.title.trim(),
        description: values.description.trim() || null,
        sentiment: values.sentiment,
        my_rating: values.myRating,
        partner_rating: values.partnerRating,
        tags: buildMovieTags(values),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function removeMovie(itemId: string) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      await deleteItem(supabase, itemId)
    } finally {
      setIsSaving(false)
    }
  }

  async function saveActor(values: ActorFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const item = await createItem(supabase, {
        category_id: categoryId,
        person_id: personId,
        title: values.name.trim(),
        description: values.description.trim() || null,
        image_url: null,
        external_url: null,
        price: null,
        sentiment: null,
        my_rating: null,
        partner_rating: null,
        tags: buildActorTags(values.films, values.pinned),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  async function editActor(itemId: string, values: ActorFormValues) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const item = await updateItem(supabase, itemId, {
        title: values.name.trim(),
        description: values.description.trim() || null,
        tags: buildActorTags(values.films, values.pinned),
      })
      onSuccess(item)
    } finally {
      setIsSaving(false)
    }
  }

  return { isSaving, saveMovie, editMovie, removeMovie, saveActor, editActor }
}
