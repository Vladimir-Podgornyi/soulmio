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
  relation_since?: string | null
  birth_date?: string | null
  birth_notify_days?: number
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
      relation_since: input.relation_since ?? null,
      birth_date: input.birth_date ?? null,
      birth_notify_days: input.birth_notify_days ?? 0,
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
      relation_since: input.relation_since ?? null,
      birth_date: input.birth_date ?? null,
      birth_notify_days: input.birth_notify_days ?? 0,
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

export interface UpcomingBirthday {
  personId: string
  personName: string
  personAvatarUrl: string | null
  daysLeft: number
  birthDate: string
  age: number
}

export async function getUpcomingBirthdays(
  supabase: DbClient,
  userId: string
): Promise<UpcomingBirthday[]> {
  const { data: people } = await supabase
    .from('people')
    .select('id, name, avatar_url, birth_date, birth_notify_days')
    .eq('user_id', userId)
    .not('birth_date', 'is', null)

  if (!people?.length) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming: UpcomingBirthday[] = []

  for (const p of people) {
    if (!p.birth_date) continue
    const birth = new Date(p.birth_date + 'T00:00:00')
    let nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
    if (nextBirthday < today) {
      nextBirthday = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate())
    }
    const daysLeft = Math.round((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const notifyDays = p.birth_notify_days ?? 0
    if (daysLeft <= notifyDays) {
      upcoming.push({
        personId: p.id,
        personName: p.name,
        personAvatarUrl: p.avatar_url ?? null,
        daysLeft,
        birthDate: p.birth_date,
        age: nextBirthday.getFullYear() - birth.getFullYear(),
      })
    }
  }

  return upcoming.sort((a, b) => a.daysLeft - b.daysLeft)
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
