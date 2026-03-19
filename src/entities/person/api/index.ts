import type { DbClient } from '@/shared/api/supabase'
import type { Person } from '../model/types'

export async function getPeople(
  supabase: DbClient,
  userId: string
): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as Person[]
}

export interface CreatePersonInput {
  name: string
  relation: string | null
  notes: string | null
  avatar_url?: string | null
}

export async function createPerson(
  supabase: DbClient,
  userId: string,
  input: CreatePersonInput
): Promise<Person> {
  const { data, error } = await supabase
    .from('people')
    .insert({
      user_id: userId,
      name: input.name,
      relation: input.relation,
      notes: input.notes || null,
      avatar_url: input.avatar_url ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Person
}

export async function updatePerson(
  supabase: DbClient,
  id: string,
  input: CreatePersonInput
): Promise<Person> {
  const { data, error } = await supabase
    .from('people')
    .update({
      name: input.name,
      relation: input.relation,
      notes: input.notes || null,
      avatar_url: input.avatar_url ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Person
}

export async function deletePerson(
  supabase: DbClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('people').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function toggleFavorite(
  supabase: DbClient,
  id: string,
  isFavorite: boolean
): Promise<void> {
  const { error } = await supabase
    .from('people')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
