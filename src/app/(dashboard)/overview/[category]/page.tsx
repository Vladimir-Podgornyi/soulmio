import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getAllItemsByCategoryName } from '@/entities/item/api'
import { getProfile } from '@/entities/user/api'
import { getPeople } from '@/entities/person/api'
import { OverviewPage } from '@/views/overview/OverviewPage'
import { calcIsPro, getAccessiblePeopleIds } from '@/shared/lib/calcIsPro'

interface Props {
  params: Promise<{ category: string }>
}

const VALID_CATEGORIES = ['food', 'restaurants', 'gifts', 'movies', 'travel']

export default async function Page({ params }: Props) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category)) redirect('/dashboard')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabase as DbClient

  const [profile, people] = await Promise.all([
    getProfile(db, user.id),
    getPeople(db, user.id),
  ])

  const isPro = calcIsPro(profile ?? {})
  const accessiblePeopleIds = getAccessiblePeopleIds(isPro, people)

  const items = await getAllItemsByCategoryName(db, user.id, category, accessiblePeopleIds)

  return <OverviewPage category={category} items={items} isPro={isPro} people={people} />
}
