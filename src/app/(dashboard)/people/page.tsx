import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getPeople } from '@/entities/person/api'
import { PeoplePage } from '@/views/people/PeoplePage'

export default async function Page() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const people = await getPeople(supabase as DbClient, user.id)

  return <PeoplePage initialPeople={people} />
}
