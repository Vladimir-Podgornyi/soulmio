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

  // Load person
  const people = await getPeople(supabase as DbClient, user.id)
  const person = people.find((p) => p.id === id)
  if (!person) notFound()

  // Determine pro status
  const profile = await getProfile(supabase as DbClient, user.id)
  const isPro = profile?.subscription_tier === 'pro'

  // Ensure default categories exist
  const categories = await ensureDefaultCategories(supabase as DbClient, person.id, isPro)

  // Load items for the first category (restaurants)
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
    />
  )
}
