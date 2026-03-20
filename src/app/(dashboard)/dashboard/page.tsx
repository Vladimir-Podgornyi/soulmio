import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getProfile } from '@/entities/user/api'
import { getPeople } from '@/entities/person/api'
import { getItemSummary, getUpcomingGifts, getUpcomingRestaurants } from '@/entities/item/api'
import { DashboardPage } from '@/views/dashboard/DashboardPage'
import type { Profile } from '@/entities/user/model/types'

async function getOrCreateProfile(
  supabase: DbClient,
  userId: string,
  email: string | undefined,
  fullName: string | null,
): Promise<Profile> {
  const existing = await getProfile(supabase, userId)
  if (existing) return existing

  const { data } = await supabase
    .from('profiles')
    .insert({ id: userId, email: email ?? null, full_name: fullName })
    .select()
    .single()

  if (data) return data as Profile

  return {
    id: userId,
    email: email ?? null,
    full_name: fullName,
    avatar_url: null,
    subscription_tier: 'free',
    created_at: new Date().toISOString(),
  }
}

export default async function Page() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null
  const db = supabase as DbClient

  const [profile, people, summary, upcomingGifts, upcomingRestaurants] = await Promise.all([
    getOrCreateProfile(db, user.id, user.email, fullName),
    getPeople(db, user.id),
    getItemSummary(db, user.id),
    getUpcomingGifts(db, user.id),
    getUpcomingRestaurants(db, user.id),
  ])

  return (
    <DashboardPage
      profile={profile}
      people={people}
      summary={summary}
      upcomingGifts={upcomingGifts}
      upcomingRestaurants={upcomingRestaurants}
    />
  )
}
