import type { DbClient } from '@/shared/api/supabase'

/** Переводы дефолтных категорий на все 6 языков для JS-поиска */
const CATEGORY_ALIASES: Record<string, string[]> = {
  restaurants: ['restaurants', 'рестораны', 'restaurant', 'restaurantes', 'restaurants', 'restaurantes', 'restaurantes', 'gastronomie', 'essen gehen'],
  food:        ['food', 'еда', 'essen', 'nourriture', 'comida', 'comida', 'питание', 'блюда'],
  gifts:       ['gifts', 'подарки', 'geschenke', 'cadeaux', 'regalos', 'presentes', 'gift', 'подарок'],
  movies:      ['movies', 'фильмы', 'filme', 'films', 'películas', 'filmes', 'кино', 'movie', 'film'],
  travel:      ['travel', 'путешествия', 'reisen', 'voyage', 'viajes', 'viagens', 'путешествие', 'поездки'],
}

const PRO_CATEGORY_NAMES = new Set(['movies', 'travel'])

function matchesQuery(categoryName: string, isCustom: boolean, q: string): boolean {
  const lower = q.toLowerCase()
  if (categoryName.toLowerCase().includes(lower)) return true
  if (!isCustom) {
    const aliases = CATEGORY_ALIASES[categoryName] ?? []
    return aliases.some((a) => a.includes(lower))
  }
  return false
}

/** Проверяет isPro с учётом grace period */
function calcIsPro(profile: {
  subscription_tier: string | null
  subscription_ends_at: string | null
  grace_period_ends_at: string | null
}): boolean {
  if (profile.subscription_tier !== 'pro') return false
  const now = new Date()
  if (!profile.subscription_ends_at && !profile.grace_period_ends_at) return true
  if (profile.subscription_ends_at && new Date(profile.subscription_ends_at) > now) return true
  if (profile.grace_period_ends_at && new Date(profile.grace_period_ends_at) > now) return true
  return false
}

export interface SearchResult {
  type: 'person' | 'item' | 'category'
  id: string
  title: string
  subtitle: string
  /** URL for navigation */
  href: string
  /** Category icon field (raw, for parseCategoryIconField) */
  icon: string | null
  /** For items: the item id used to build highlight param */
  itemId?: string
  /** For items/categories: the category id */
  categoryId?: string
  /** For items/categories: the category name (for section param) */
  categoryName?: string
  /** Whether this result is locked behind Pro */
  isLocked?: boolean
  /** Which feature key to pass to PaywallModal */
  lockedFeature?: string
}

export async function searchAll(
  supabase: DbClient,
  userId: string,
  query: string
): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const q = `%${query.trim()}%`
  const results: SearchResult[] = []

  // ── Fetch profile + all people (with created_at) in parallel ──────────
  const [{ data: profile }, { data: allUserPeople }] = await Promise.all([
    supabase
      .from('profiles')
      .select('subscription_tier, subscription_ends_at, grace_period_ends_at')
      .eq('id', userId)
      .single(),
    supabase
      .from('people')
      .select('id, name, relation, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ])

  const isPro = profile ? calcIsPro(profile) : false

  // Compute locked people IDs (all except first by created_at)
  const userPeopleList = allUserPeople ?? []
  const lockedPeopleIds = new Set(
    isPro ? [] : userPeopleList.slice(1).map((p) => p.id)
  )

  const peopleIds = userPeopleList.map((p) => p.id)
  const peopleNameMap = new Map(userPeopleList.map((p) => [p.id, p.name]))

  // ── 1. Люди ──────────────────────────────────────────────────────────
  const matchingPeople = userPeopleList
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 5)

  for (const p of matchingPeople) {
    const locked = lockedPeopleIds.has(p.id)
    results.push({
      type: 'person',
      id: p.id,
      title: p.name,
      subtitle: p.relation ?? '',
      href: `/people/${p.id}`,
      icon: null,
      isLocked: locked || undefined,
      lockedFeature: locked ? 'people' : undefined,
    })
  }

  if (peopleIds.length > 0) {
    // ── 2. Категории ──────────────────────────────────────────────────────
    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, name, icon, is_custom, person_id, created_at')
      .in('person_id', peopleIds)

    // Compute locked category IDs
    let lockedCategoryIds = new Set<string>()
    if (!isPro) {
      // First custom category per person is free, rest locked
      const firstCustomPerPerson = new Map<string, string>()
      const sortedCats = [...(allCategories ?? [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      for (const cat of sortedCats) {
        if (cat.is_custom && !firstCustomPerPerson.has(cat.person_id)) {
          firstCustomPerPerson.set(cat.person_id, cat.id)
        }
      }
      lockedCategoryIds = new Set(
        (allCategories ?? [])
          .filter((cat) => {
            if (PRO_CATEGORY_NAMES.has(cat.name)) return true
            if (cat.is_custom && firstCustomPerPerson.get(cat.person_id) !== cat.id) return true
            return false
          })
          .map((cat) => cat.id)
      )
    }

    const categories = (allCategories ?? [])
      .filter((cat) => matchesQuery(cat.name, cat.is_custom, query.trim()))
      .slice(0, 8)

    for (const cat of categories) {
      const personName = peopleNameMap.get(cat.person_id) ?? ''
      const locked = lockedCategoryIds.has(cat.id) || lockedPeopleIds.has(cat.person_id)
      const lockedFeature = locked
        ? PRO_CATEGORY_NAMES.has(cat.name)
          ? cat.name as string
          : 'custom_categories'
        : undefined
      results.push({
        type: 'category',
        id: cat.id,
        title: cat.name,
        subtitle: personName,
        href: `/people/${cat.person_id}?section=${cat.id}`,
        icon: cat.icon ?? null,
        categoryId: cat.id,
        categoryName: cat.name,
        isLocked: locked || undefined,
        lockedFeature,
      })
    }

    // ── 3. Items ──────────────────────────────────────────────────────────
    const { data: items } = await supabase
      .from('items')
      .select(`
        id,
        title,
        person_id,
        category_id,
        people!inner ( user_id, name ),
        categories ( id, name, icon, is_custom )
      `)
      .eq('people.user_id', userId)
      .ilike('title', q)
      .limit(20)

    for (const raw of items ?? []) {
      const item = raw as {
        id: string
        title: string
        person_id: string
        category_id: string
        people: { user_id: string; name: string } | null
        categories: { id: string; name: string; icon: string | null; is_custom: boolean } | null
      }

      const personName = item.people?.name ?? ''
      const categoryName = item.categories?.name ?? ''
      const categoryIcon = item.categories?.icon ?? null
      const catId = item.categories?.id ?? item.category_id

      const locked = lockedCategoryIds.has(catId) || lockedPeopleIds.has(item.person_id)
      const lockedFeature = locked
        ? PRO_CATEGORY_NAMES.has(categoryName)
          ? categoryName
          : item.categories?.is_custom
            ? 'custom_categories'
            : 'people'
        : undefined

      results.push({
        type: 'item',
        id: item.id,
        itemId: item.id,
        title: item.title,
        subtitle: `${personName} · ${categoryName}`,
        href: `/people/${item.person_id}?section=${catId}&highlight=${item.id}`,
        icon: categoryIcon,
        categoryId: catId,
        categoryName,
        isLocked: locked || undefined,
        lockedFeature,
      })
    }
  }

  return results
}
