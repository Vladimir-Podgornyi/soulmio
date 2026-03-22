import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getAllItemsByCategoryName } from '@/entities/item/api'
import { getProfile } from '@/entities/user/api'
import { getPeople } from '@/entities/person/api'
import { OverviewPage } from '@/views/overview/OverviewPage'

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

  const [items, profile, people] = await Promise.all([
    getAllItemsByCategoryName(db, user.id, name),
    getProfile(db, user.id),
    getPeople(db, user.id),
  ])

  // Получаем иконку кастомной категории из первой попавшейся категории с таким именем
  const { data: categoryRow } = await (supabase as DbClient)
    .from('categories')
    .select('icon')
    .eq('name', name)
    .eq('is_custom', true)
    .limit(1)
    .single()

  const isPro = profile?.subscription_tier === 'pro'

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
