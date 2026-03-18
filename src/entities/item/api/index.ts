import type { DbClient } from '@/shared/api/supabase'
import type { Item, Sentiment } from '../model/types'

export async function getItemsByCategory(
  supabase: DbClient,
  personId: string,
  categoryId: string
): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('person_id', personId)
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as Item[]
}

export interface CreateItemInput {
  category_id: string
  person_id: string
  title: string
  description: string | null
  external_url: string | null
  sentiment: Sentiment | null
  my_rating: number | null
  partner_rating: number | null
  tags: string[] | null
}

export async function createItem(
  supabase: DbClient,
  input: CreateItemInput
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Item
}

export type UpdateItemInput = Partial<Omit<CreateItemInput, 'category_id' | 'person_id'>>

export async function updateItem(
  supabase: DbClient,
  id: string,
  input: UpdateItemInput
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Item
}

export async function deleteItem(
  supabase: DbClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
