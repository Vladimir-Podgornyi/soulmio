import type { DbClient } from '@/shared/api/supabase'

export interface PersonDate {
  id: string
  person_id: string
  user_id: string
  title: string
  date: string
  notify_days: number
  created_at: string
}

export interface CreatePersonDateInput {
  person_id: string
  user_id: string
  title: string
  date: string
  notify_days: number
}

export async function getPersonDates(
  supabase: DbClient,
  personId: string
): Promise<PersonDate[]> {
  const { data } = await supabase
    .from('person_dates')
    .select('*')
    .eq('person_id', personId)
    .order('date', { ascending: true })

  return (data as PersonDate[]) ?? []
}

export async function createPersonDate(
  supabase: DbClient,
  input: CreatePersonDateInput
): Promise<PersonDate> {
  const { data, error } = await supabase
    .from('person_dates')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PersonDate
}

export async function deletePersonDate(
  supabase: DbClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('person_dates').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export interface UpcomingPersonDate {
  id: string
  personId: string
  personName: string
  title: string
  date: string
  daysLeft: number
  yearsSince: number | null
}

type PersonDateQueryRow = {
  id: string
  person_id: string
  title: string
  date: string
  notify_days: number
  people: { name: string } | null
}

export async function getUpcomingPersonDates(
  supabase: DbClient,
  userId: string
): Promise<UpcomingPersonDate[]> {
  const { data } = await supabase
    .from('person_dates')
    .select('id, person_id, title, date, notify_days, people(name)')
    .eq('user_id', userId)

  if (!data?.length) return []
  const rows = data as unknown as PersonDateQueryRow[]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming: UpcomingPersonDate[] = []

  for (const d of rows) {
    const orig = new Date(d.date + 'T00:00:00')
    let next = new Date(today.getFullYear(), orig.getMonth(), orig.getDate())
    if (next < today) {
      next = new Date(today.getFullYear() + 1, orig.getMonth(), orig.getDate())
    }
    const daysLeft = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const notifyDays = d.notify_days ?? 0
    if (daysLeft <= notifyDays) {
      const yearsSince = next.getFullYear() - orig.getFullYear()
      upcoming.push({
        id: d.id,
        personId: d.person_id,
        personName: d.people?.name ?? '',
        title: d.title,
        date: d.date,
        daysLeft,
        yearsSince: yearsSince > 0 ? yearsSince : null,
      })
    }
  }

  return upcoming.sort((a, b) => a.daysLeft - b.daysLeft)
}
