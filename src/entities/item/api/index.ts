import type { DbClient } from '@/shared/api/supabase'
import type { Item, Sentiment } from '../model/types'

export async function getItemsByCategory(
  supabase: DbClient,
  personId: string,
  categoryId: string
): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('person_id', personId)
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as Item[]
}

export interface CreateItemInput {
  category_id: string
  person_id: string
  title: string
  description: string | null
  image_url?: string | null
  external_url: string | null
  price?: number | null
  sentiment: Sentiment | null
  my_rating: number | null
  partner_rating: number | null
  tags: string[] | null
}

export async function createItem(
  supabase: DbClient,
  input: CreateItemInput
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Item
}

export type UpdateItemInput = Partial<Omit<CreateItemInput, 'category_id' | 'person_id'>>

export async function updateItem(
  supabase: DbClient,
  id: string,
  input: UpdateItemInput
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Item
}

export async function deleteItem(
  supabase: DbClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export interface ItemCategorySummary {
  categoryName: string
  count: number
  icon?: string | null
  isCustom?: boolean
}

export async function getItemSummary(
  supabase: DbClient,
  userId: string
): Promise<ItemCategorySummary[]> {
  const { data: people } = await supabase
    .from('people')
    .select('id')
    .eq('user_id', userId)

  if (!people?.length) return []

  const peopleIds = people.map((p) => p.id)

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon, is_custom')
    .in('person_id', peopleIds)

  if (!categories?.length) return []

  const categoryIds = categories.map((c) => c.id)
  const categoryMeta = new Map(categories.map((c) => [c.id, { name: c.name, icon: c.icon, isCustom: c.is_custom }]))

  const { data: items } = await supabase
    .from('items')
    .select('category_id')
    .in('category_id', categoryIds)

  if (!items?.length) return []

  const counts: Record<string, { count: number; icon: string | null; isCustom: boolean }> = {}
  for (const item of items) {
    const meta = categoryMeta.get(item.category_id)
    const name = meta?.name ?? 'other'
    if (!counts[name]) counts[name] = { count: 0, icon: meta?.icon ?? null, isCustom: meta?.isCustom ?? false }
    counts[name].count += 1
  }

  return Object.entries(counts).map(([categoryName, { count, icon, isCustom }]) => ({
    categoryName,
    count,
    icon,
    isCustom,
  }))
}

export interface UpcomingGift {
  itemId: string
  title: string
  description: string | null
  imageUrl: string | null
  externalUrl: string | null
  price: number | null
  personName: string
  personId: string
  daysLeft: number
  giftDate: string
}

export async function getUpcomingGifts(
  supabase: DbClient,
  userId: string,
  daysBefore = 14
): Promise<UpcomingGift[]> {
  const { data: people } = await supabase
    .from('people')
    .select('id, name')
    .eq('user_id', userId)

  if (!people?.length) return []

  const peopleIds = people.map((p) => p.id)
  const peopleMap = new Map(people.map((p) => [p.id, p.name]))

  const { data: giftCats } = await supabase
    .from('categories')
    .select('id')
    .in('person_id', peopleIds)
    .eq('name', 'gifts')

  if (!giftCats?.length) return []

  const giftCatIds = giftCats.map((c) => c.id)

  const { data: giftItems } = await supabase
    .from('items')
    .select('id, title, description, image_url, external_url, price, person_id, tags, sentiment')
    .in('category_id', giftCatIds)

  if (!giftItems?.length) return []

  const now = new Date()
  const upcoming: UpcomingGift[] = []

  for (const item of giftItems) {
    // Уже купленные подарки не показываем
    if (item.sentiment === 'likes') continue

    const dateTag = item.tags?.find((t: string) => t.startsWith('gift_date:'))
    if (!dateTag) continue

    const dateStr = (dateTag as string).slice('gift_date:'.length)
    const date = new Date(dateStr)
    const msLeft = date.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

    if (daysLeft >= 0 && daysLeft <= daysBefore) {
      upcoming.push({
        itemId: item.id,
        title: item.title,
        description: item.description ?? null,
        imageUrl: item.image_url ?? null,
        externalUrl: item.external_url ?? null,
        price: item.price ?? null,
        personName: peopleMap.get(item.person_id) ?? '',
        personId: item.person_id,
        daysLeft,
        giftDate: dateStr,
      })
    }
  }

  return upcoming.sort((a, b) => a.daysLeft - b.daysLeft)
}

export interface UpcomingRestaurant {
  itemId: string
  title: string
  address: string | null
  comment: string | null
  externalUrl: string | null
  tags: string[]
  personName: string
  personId: string
  daysLeft: number
  visitDate: string
}

export async function getUpcomingRestaurants(
  supabase: DbClient,
  userId: string,
  daysBefore = 7
): Promise<UpcomingRestaurant[]> {
  const { data: people } = await supabase
    .from('people')
    .select('id, name')
    .eq('user_id', userId)

  if (!people?.length) return []

  const peopleIds = people.map((p) => p.id)
  const peopleMap = new Map(people.map((p) => [p.id, p.name]))

  const { data: restCats } = await supabase
    .from('categories')
    .select('id')
    .in('person_id', peopleIds)
    .eq('name', 'restaurants')

  if (!restCats?.length) return []

  const restCatIds = restCats.map((c) => c.id)

  const { data: items } = await supabase
    .from('items')
    .select('id, title, description, external_url, person_id, tags')
    .in('category_id', restCatIds)

  if (!items?.length) return []

  const now = new Date()
  const upcoming: UpcomingRestaurant[] = []

  for (const item of items) {
    const tags = (item.tags ?? []) as string[]

    if (tags.includes('visit_booked:true')) continue

    const dateTag = tags.find((t: string) => t.startsWith('visit_date:'))
    if (!dateTag) continue

    const dateStr = (dateTag as string).slice('visit_date:'.length)
    const date = new Date(dateStr)
    const msLeft = date.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

    if (daysLeft >= 0 && daysLeft <= daysBefore) {
      const addressTag = tags.find((t: string) => t.startsWith('📍'))
      upcoming.push({
        itemId: item.id,
        title: item.title,
        address: addressTag ? (addressTag as string).slice(2).trim() : null,
        comment: item.description ?? null,
        externalUrl: item.external_url ?? null,
        tags,
        personName: peopleMap.get(item.person_id) ?? '',
        personId: item.person_id,
        daysLeft,
        visitDate: dateStr,
      })
    }
  }

  return upcoming.sort((a, b) => a.daysLeft - b.daysLeft)
}

export interface UpcomingMovie {
  itemId: string
  title: string
  personName: string
  personId: string
  daysLeft: number
  releaseDate: string
  tags: string[]
}

export async function getUpcomingMovies(
  supabase: DbClient,
  userId: string,
  daysBefore = 7
): Promise<UpcomingMovie[]> {
  const { data: people } = await supabase
    .from('people')
    .select('id, name')
    .eq('user_id', userId)

  if (!people?.length) return []

  const peopleIds = people.map((p) => p.id)
  const peopleMap = new Map(people.map((p) => [p.id, p.name]))

  const { data: movieCats } = await supabase
    .from('categories')
    .select('id')
    .in('person_id', peopleIds)
    .eq('name', 'movies')

  if (!movieCats?.length) return []

  const movieCatIds = movieCats.map((c) => c.id)

  const { data: items } = await supabase
    .from('items')
    .select('id, title, person_id, tags, sentiment')
    .in('category_id', movieCatIds)

  if (!items?.length) return []

  const now = new Date()
  const upcoming: UpcomingMovie[] = []

  for (const item of items) {
    const tags = (item.tags ?? []) as string[]
    // Пропускаем актёров и уже просмотренные фильмы
    if (tags.includes('item_type:actor')) continue
    if (item.sentiment === 'likes' || item.sentiment === 'dislikes') continue

    const dateTag = tags.find((t: string) => t.startsWith('release_date:'))
    if (!dateTag) continue

    const dateStr = (dateTag as string).slice('release_date:'.length)
    const date = new Date(dateStr)
    const msLeft = date.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

    if (daysLeft >= 0 && daysLeft <= daysBefore) {
      upcoming.push({
        itemId: item.id,
        title: item.title,
        personName: peopleMap.get(item.person_id) ?? '',
        personId: item.person_id,
        daysLeft,
        releaseDate: dateStr,
        tags: (item.tags ?? []) as string[],
      })
    }
  }

  return upcoming.sort((a, b) => a.daysLeft - b.daysLeft)
}

export interface UpcomingTrip {
  itemId: string
  title: string
  flagEmoji: string
  personName: string
  personId: string
  daysLeft: number
  tripDate: string
  tags: string[]
}

export async function getUpcomingTrips(
  supabase: DbClient,
  userId: string,
  daysBefore = 30
): Promise<UpcomingTrip[]> {
  const { data: people } = await supabase
    .from('people')
    .select('id, name')
    .eq('user_id', userId)

  if (!people?.length) return []

  const peopleIds = people.map((p) => p.id)
  const peopleMap = new Map(people.map((p) => [p.id, p.name]))

  const { data: travelCats } = await supabase
    .from('categories')
    .select('id')
    .in('person_id', peopleIds)
    .eq('name', 'travel')

  if (!travelCats?.length) return []

  const travelCatIds = travelCats.map((c) => c.id)

  const { data: items } = await supabase
    .from('items')
    .select('id, title, person_id, tags, sentiment')
    .in('category_id', travelCatIds)

  if (!items?.length) return []

  const now = new Date()
  const upcoming: UpcomingTrip[] = []

  for (const item of items) {
    // Only "wants to visit" trips, not yet booked
    if (item.sentiment !== 'wants') continue

    const tags = (item.tags ?? []) as string[]
    if (tags.includes('trip_booked:true')) continue

    const dateTag = tags.find((t: string) => t.startsWith('trip_date:'))
    if (!dateTag) continue

    const dateStr = dateTag.slice('trip_date:'.length)
    const date = new Date(dateStr)
    const msLeft = date.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

    const reminderTag = tags.find((t: string) => t.startsWith('reminder_days:'))
    const reminderDays = reminderTag ? Number(reminderTag.slice('reminder_days:'.length)) : daysBefore

    if (daysLeft >= 0 && daysLeft <= reminderDays) {
      const codeTag = tags.find((t: string) => t.startsWith('country_code:'))
      const code = codeTag ? codeTag.slice('country_code:'.length) : ''
      const flagEmoji = code
        ? String.fromCodePoint(
            ...code
              .toUpperCase()
              .split('')
              .map((c: string) => 0x1f1e6 + c.charCodeAt(0) - 65)
          )
        : '✈️'

      upcoming.push({
        itemId: item.id,
        title: item.title,
        flagEmoji,
        personName: peopleMap.get(item.person_id) ?? '',
        personId: item.person_id,
        daysLeft,
        tripDate: dateStr,
        tags,
      })
    }
  }

  return upcoming.sort((a, b) => a.daysLeft - b.daysLeft)
}

export interface UpcomingCustomItem {
  itemId: string
  title: string
  categoryName: string
  categoryIcon: string | null
  personName: string
  personId: string
  daysLeft: number
  customDate: string
  tags: string[]
}

export async function getUpcomingCustomItems(
  supabase: DbClient,
  userId: string
): Promise<UpcomingCustomItem[]> {
  const { data: people } = await supabase
    .from('people')
    .select('id, name')
    .eq('user_id', userId)

  if (!people?.length) return []

  const peopleIds = people.map((p) => p.id)
  const peopleMap = new Map(people.map((p) => [p.id, p.name]))

  const { data: customCats } = await supabase
    .from('categories')
    .select('id, name, icon')
    .in('person_id', peopleIds)
    .eq('is_custom', true)

  if (!customCats?.length) return []

  const catIds = customCats.map((c) => c.id)
  const catMeta = new Map(customCats.map((c) => [c.id, { name: c.name, icon: c.icon }]))

  const { data: items } = await supabase
    .from('items')
    .select('id, title, person_id, category_id, tags')
    .in('category_id', catIds)

  if (!items?.length) return []

  const now = new Date()
  const upcoming: UpcomingCustomItem[] = []

  for (const item of items) {
    const tags = (item.tags ?? []) as string[]
    const dateTag = tags.find((t) => t.startsWith('custom_date:'))
    if (!dateTag) continue

    const dateStr = dateTag.slice('custom_date:'.length)
    const date = new Date(dateStr)
    const msLeft = date.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

    const reminderTag = tags.find((t) => t.startsWith('reminder_days:'))
    const reminderDays = reminderTag ? Number(reminderTag.slice('reminder_days:'.length)) : 7

    if (daysLeft >= 0 && daysLeft <= reminderDays) {
      const meta = catMeta.get(item.category_id)
      upcoming.push({
        itemId: item.id,
        title: item.title,
        categoryName: meta?.name ?? '',
        categoryIcon: meta?.icon ?? null,
        personName: peopleMap.get(item.person_id) ?? '',
        personId: item.person_id,
        daysLeft,
        customDate: dateStr,
        tags,
      })
    }
  }

  return upcoming.sort((a, b) => a.daysLeft - b.daysLeft)
}

export interface ItemWithPerson extends Item {
  personName: string
  personAvatar: string | null
}

export async function getAllItemsByCategoryName(
  supabase: DbClient,
  userId: string,
  categoryName: string
): Promise<ItemWithPerson[]> {
  const { data: people } = await supabase
    .from('people')
    .select('id, name, avatar_url')
    .eq('user_id', userId)

  if (!people?.length) return []

  const peopleIds = people.map((p) => p.id)
  const peopleMap = new Map(
    people.map((p) => [p.id, { name: p.name, avatar_url: p.avatar_url }])
  )

  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .in('person_id', peopleIds)
    .eq('name', categoryName)

  if (!categories?.length) return []

  const categoryIds = categories.map((c) => c.id)

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .in('category_id', categoryIds)
    .order('created_at', { ascending: false })

  if (!items?.length) return []

  return items.map((raw) => {
    const item = raw as Item
    return {
      ...item,
      personName: peopleMap.get(item.person_id)?.name ?? '',
      personAvatar: peopleMap.get(item.person_id)?.avatar_url ?? null,
    }
  })
}
