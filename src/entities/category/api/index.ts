import type { DbClient } from '@/shared/api/supabase'
import type { Category } from '../model/types'

const DEFAULT_CATEGORIES: Array<{
  name: string
  icon: string
  sort_order: number
  proOnly: boolean
}> = [
  { name: 'restaurants', icon: '🍴', sort_order: 0, proOnly: false },
  { name: 'gifts',       icon: '🎁', sort_order: 1, proOnly: false },
  { name: 'movies',      icon: '🎬', sort_order: 2, proOnly: true  },
  { name: 'food',        icon: '🍽️', sort_order: 3, proOnly: false },
  { name: 'travel',      icon: '✈️', sort_order: 4, proOnly: true  },
]

export async function getCategories(
  supabase: DbClient,
  personId: string
): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('person_id', personId)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data as Category[]
}

export async function createCustomCategory(
  supabase: DbClient,
  personId: string,
  name: string,
  icon: string,
): Promise<Category | null> {
  const existing = await getCategories(supabase, personId)
  const maxOrder = existing.reduce((max, c) => Math.max(max, c.sort_order), 0)

  const { data, error } = await supabase
    .from('categories')
    .insert({
      person_id: personId,
      name,
      icon,
      is_custom: true,
      sort_order: maxOrder + 1,
    })
    .select()
    .single()

  if (error || !data) return null
  return data as Category
}

export async function updateCustomCategory(
  supabase: DbClient,
  categoryId: string,
  name: string,
  icon: string,
): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name, icon })
    .eq('id', categoryId)
    .select()
    .single()

  if (error || !data) return null
  return data as Category
}

export async function deleteCustomCategory(
  supabase: DbClient,
  categoryId: string,
): Promise<void> {
  await supabase.from('categories').delete().eq('id', categoryId)
}

export async function ensureDefaultCategories(
  supabase: DbClient,
  personId: string,
  isPro: boolean
): Promise<Category[]> {
  const existing = await getCategories(supabase, personId)
  const existingByName = new Map(existing.map((c) => [c.name, c]))

  // Обновляем sort_order у уже существующих дефолтных категорий
  const toUpdate = DEFAULT_CATEGORIES
    .filter((c) => existingByName.has(c.name) && existingByName.get(c.name)!.sort_order !== c.sort_order)
  await Promise.all(
    toUpdate.map((c) =>
      supabase.from('categories').update({ sort_order: c.sort_order }).eq('id', existingByName.get(c.name)!.id)
    )
  )

  const toInsert = DEFAULT_CATEGORIES
    .filter((c) => !existingByName.has(c.name) && (isPro || !c.proOnly))
    .map((c) => ({
      person_id: personId,
      name: c.name,
      icon: c.icon,
      is_custom: false,
      sort_order: c.sort_order,
    }))

  if (toInsert.length === 0) {
    // Обновим sort_order в памяти и вернём
    const merged = existing.map((c) => {
      const def = DEFAULT_CATEGORIES.find((d) => d.name === c.name)
      return def ? { ...c, sort_order: def.sort_order } : c
    })
    return merged.sort((a, b) => a.sort_order - b.sort_order)
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(toInsert)
    .select()

  if (error || !data) return existing

  const merged = [...existing, ...(data as Category[])].map((c) => {
    const def = DEFAULT_CATEGORIES.find((d) => d.name === c.name)
    return def ? { ...c, sort_order: def.sort_order } : c
  })
  return merged.sort((a, b) => a.sort_order - b.sort_order)
}
