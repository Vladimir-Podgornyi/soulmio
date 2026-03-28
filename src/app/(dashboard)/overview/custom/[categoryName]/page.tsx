import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getAllItemsByCategoryName } from '@/entities/item/api'
import { getProfile } from '@/entities/user/api'
import { getPeople } from '@/entities/person/api'
import { OverviewPage } from '@/views/overview/OverviewPage'
import { calcIsPro, getAccessiblePeopleIds } from '@/shared/lib/calcIsPro'

interface Props {
  params: Promise<{ categoryName: string }>
}

export default async function Page({ params }: Props) {
  const { categoryName } = await params
  const name = decodeURIComponent(categoryName)

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

  const [items, categoryRow] = await Promise.all([
    getAllItemsByCategoryName(db, user.id, name, accessiblePeopleIds),
    // Иконка кастомной категории из доступных людей
    (db as typeof supabase)
      .from('categories')
      .select('icon')
      .eq('name', name)
      .eq('is_custom', true)
      .in('person_id', accessiblePeopleIds ?? people.map((p) => p.id))
      .limit(1)
      .single()
      .then(({ data }) => data),
  ])

  return (
    <OverviewPage
      category={name}
      items={items}
      isPro={isPro}
      isCustom
      categoryIcon={categoryRow?.icon ?? null}
      people={people}
    />
  )
}
