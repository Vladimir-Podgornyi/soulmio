import type { DbClient } from '@/shared/api/supabase'

/** Переводы дефолтных категорий на все 6 языков для JS-поиска */
const CATEGORY_ALIASES: Record<string, string[]> = {
  restaurants: ['restaurants', 'рестораны', 'restaurant', 'restaurantes', 'restaurants', 'restaurantes', 'restaurantes', 'gastronomie', 'essen gehen'],
  food:        ['food', 'еда', 'essen', 'nourriture', 'comida', 'comida', 'питание', 'блюда'],
  gifts:       ['gifts', 'подарки', 'geschenke', 'cadeaux', 'regalos', 'presentes', 'gift', 'подарок'],
  movies:      ['movies', 'фильмы', 'filme', 'films', 'películas', 'filmes', 'кино', 'movie', 'film'],
  travel:      ['travel', 'путешествия', 'reisen', 'voyage', 'viajes', 'viagens', 'путешествие', 'поездки'],
}

function matchesQuery(categoryName: string, isCustom: boolean, q: string): boolean {
  const lower = q.toLowerCase()
  if (categoryName.toLowerCase().includes(lower)) return true
  if (!isCustom) {
    const aliases = CATEGORY_ALIASES[categoryName] ?? []
    return aliases.some((a) => a.includes(lower))
  }
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
}

export async function searchAll(
  supabase: DbClient,
  userId: string,
  query: string
): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const q = `%${query.trim()}%`
  const results: SearchResult[] = []

  // ── 1. Люди ──────────────────────────────────────────────────────────
  const { data: people } = await supabase
    .from('people')
    .select('id, name, relation')
    .eq('user_id', userId)
    .ilike('name', q)
    .limit(5)

  for (const p of people ?? []) {
    results.push({
      type: 'person',
      id: p.id,
      title: p.name,
      subtitle: p.relation ?? '',
      href: `/people/${p.id}`,
      icon: null,
    })
  }

  // ── 2. Категории ──────────────────────────────────────────────────────
  // Сначала получаем id всех людей пользователя для фильтра
  const { data: userPeople } = await supabase
    .from('people')
    .select('id, name')
    .eq('user_id', userId)

  const peopleIds = (userPeople ?? []).map((p) => p.id)
  const peopleNameMap = new Map((userPeople ?? []).map((p) => [p.id, p.name]))

  if (peopleIds.length > 0) {
    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, name, icon, is_custom, person_id')
      .in('person_id', peopleIds)

    const categories = (allCategories ?? [])
      .filter((cat) => matchesQuery(cat.name, cat.is_custom, query.trim()))
      .slice(0, 8)

    for (const cat of categories) {
      const personName = peopleNameMap.get(cat.person_id) ?? ''
      results.push({
        type: 'category',
        id: cat.id,
        title: cat.name,
        subtitle: personName,
        href: `/people/${cat.person_id}?section=${cat.id}`,
        icon: cat.icon ?? null,
        categoryId: cat.id,
        categoryName: cat.name,
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
      })
    }
  }

  return results
}
