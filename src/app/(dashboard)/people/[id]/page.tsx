import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getPeople } from '@/entities/person/api'
import { ensureDefaultCategories } from '@/entities/category/api'
import { getItemsByCategory } from '@/entities/item/api'
import { getProfile } from '@/entities/user/api'
import { PersonPage } from '@/views/person/PersonPage'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Загружаем человека
  const people = await getPeople(supabase as DbClient, user.id)
  const person = people.find((p) => p.id === id)
  if (!person) notFound()

  // Определяем статус Pro
  const profile = await getProfile(supabase as DbClient, user.id)
  const isPro = profile?.subscription_tier === 'pro'

  // Убеждаемся, что дефолтные категории существуют
  const categories = await ensureDefaultCategories(supabase as DbClient, person.id, isPro)

  // Загружаем элементы для первой категории (рестораны)
  const defaultCategory =
    categories.find((c) => c.name === 'restaurants') ?? categories[0]

  const initialItems = defaultCategory
    ? await getItemsByCategory(supabase as DbClient, person.id, defaultCategory.id)
    : []

  return (
    <PersonPage
      person={person}
      categories={categories}
      initialItems={initialItems}
      initialCategoryId={defaultCategory?.id ?? ''}
      isPro={isPro}
    />
  )
}
