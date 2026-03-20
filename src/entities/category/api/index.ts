import type { DbClient } from '@/shared/api/supabase'
import type { Category } from '../model/types'

const DEFAULT_CATEGORIES: Array<{
  name: string
  icon: string
  sort_order: number
  proOnly: boolean
}> = [
  { name: 'food',        icon: '🍽️', sort_order: 0, proOnly: false },
  { name: 'restaurants', icon: '🍴', sort_order: 1, proOnly: false },
  { name: 'gifts',       icon: '🎁', sort_order: 2, proOnly: false },
  { name: 'movies',      icon: '🎬', sort_order: 3, proOnly: true  },
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
  const existingNames = new Set(existing.map((c) => c.name))

  const toInsert = DEFAULT_CATEGORIES
    .filter((c) => !existingNames.has(c.name) && (isPro || !c.proOnly))
    .map((c) => ({
      person_id: personId,
      name: c.name,
      icon: c.icon,
      is_custom: false,
      sort_order: c.sort_order,
    }))

  if (toInsert.length === 0) return existing

  const { data, error } = await supabase
    .from('categories')
    .insert(toInsert)
    .select()

  if (error || !data) return existing

  return [...existing, ...(data as Category[])].sort(
    (a, b) => a.sort_order - b.sort_order
  )
}
