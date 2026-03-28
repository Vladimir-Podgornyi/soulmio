import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getProfile } from '@/entities/user/api'
import { getPeople } from '@/entities/person/api'
import { getItemSummary, getUpcomingGifts, getUpcomingRestaurants, getUpcomingMovies, getUpcomingTrips, getUpcomingCustomItems } from '@/entities/item/api'
import { getUpcomingBirthdays } from '@/entities/person/api'
import { getUpcomingPersonDates } from '@/entities/person/api/personDates'
import { DashboardPage } from '@/views/dashboard/DashboardPage'
import type { Profile } from '@/entities/user/model/types'
import { calcIsPro, getAccessiblePeopleIds } from '@/shared/lib/calcIsPro'

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
    subscription_ends_at: null,
    grace_period_ends_at: null,
    created_at: new Date().toISOString(),
  }
}


export default async function Page() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null
  const db = supabase as DbClient

  // Fetch profile + people first to compute accessible person IDs
  const [profile, people] = await Promise.all([
    getOrCreateProfile(db, user.id, user.email, fullName),
    getPeople(db, user.id),
  ])

  const isPro = calcIsPro(profile)
  const accessiblePeopleIds = getAccessiblePeopleIds(isPro, people)

  const [summary, upcomingGifts, upcomingRestaurants, upcomingMovies, upcomingTrips, upcomingCustomItems, upcomingBirthdays, upcomingPersonDates] = await Promise.all([
    getItemSummary(db, user.id, accessiblePeopleIds),
    getUpcomingGifts(db, user.id),
    getUpcomingRestaurants(db, user.id),
    getUpcomingMovies(db, user.id),
    getUpcomingTrips(db, user.id),
    getUpcomingCustomItems(db, user.id),
    getUpcomingBirthdays(db, user.id),
    getUpcomingPersonDates(db, user.id),
  ])

  return (
    <DashboardPage
      profile={profile}
      people={people}
      summary={summary}
      upcomingGifts={upcomingGifts}
      upcomingRestaurants={upcomingRestaurants}
      upcomingMovies={upcomingMovies}
      upcomingTrips={upcomingTrips}
      upcomingCustomItems={upcomingCustomItems}
      upcomingBirthdays={upcomingBirthdays}
      upcomingPersonDates={upcomingPersonDates}
    />
  )
}
