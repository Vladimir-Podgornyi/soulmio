import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getPeople } from '@/entities/person/api'
import { getProfile } from '@/entities/user/api'
import { PeoplePage } from '@/views/people/PeoplePage'

export default async function Page() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [people, profile] = await Promise.all([
    getPeople(supabase as DbClient, user.id),
    getProfile(supabase as DbClient, user.id),
  ])

  const isPro = profile?.subscription_tier === 'pro'

  return <PeoplePage initialPeople={people} isPro={isPro} profile={profile ?? undefined} />
}
