import type { DbClient } from '@/shared/api/supabase'
import type { Person, Relation } from '../model/types'

export interface CreatePersonInput {
  name: string
  relation: Relation | null
  notes: string | null
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
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Person
}
