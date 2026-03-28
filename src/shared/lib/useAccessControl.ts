'use client'

import { useMemo } from 'react'
import { useSubscriptionStatus } from './useSubscriptionStatus'

const FREE_PERSON_LIMIT = 1
const FREE_CUSTOM_CATEGORY_LIMIT = 1
const PRO_CATEGORY_NAMES = new Set(['movies', 'travel'])

interface AccessControlProfile {
  subscription_tier?: string | null
  subscription_ends_at?: string | null
  grace_period_ends_at?: string | null
}

interface PersonLike {
  id: string
  created_at: string
}

interface CategoryLike {
  id: string
  name: string
  is_custom: boolean
  created_at: string
}

interface UseAccessControlParams {
  profile?: AccessControlProfile
  people: PersonLike[]
  categories: CategoryLike[]
}

const ALL_UNLOCKED = {
  canAddPerson: true,
  isPersonLocked: (_id: string) => false,
  canAddCategory: true,
  isCategoryLocked: (_id: string) => false,
  canAddItem: (_id: string) => true,
  canEditItem: (_id: string) => true,
  lockedPeopleIds: [] as string[],
  lockedCategoryIds: [] as string[],
}

/**
 * Хук контроля доступа к контенту.
 * Определяет какие люди/категории/items заблокированы для Free пользователей.
 *
 * Логика Free плана:
 * - Люди: 1-й по created_at — свободен, остальные заблокированы
 * - Категории: Restaurants, Gifts, Food + 1-я кастомная — свободны.
 *   Movies, Travel и кастомные сверх лимита — заблокированы.
 */
export function useAccessControl({ profile, people, categories }: UseAccessControlParams) {
  const { isPro } = useSubscriptionStatus(profile)

  return useMemo(() => {
    if (isPro) return ALL_UNLOCKED

    // Сортируем людей по created_at ASC → первый = бесплатный
    const sortedPeople = [...people].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const freePeopleIds = new Set(sortedPeople.slice(0, FREE_PERSON_LIMIT).map((p) => p.id))
    const lockedPeopleIds = sortedPeople.slice(FREE_PERSON_LIMIT).map((p) => p.id)

    // Сортируем кастомные категории по created_at ASC → первая = бесплатная
    const customCats = categories.filter((c) => c.is_custom)
    const sortedCustom = [...customCats].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const freeCustomIds = new Set(
      sortedCustom.slice(0, FREE_CUSTOM_CATEGORY_LIMIT).map((c) => c.id)
    )

    const lockedCategoryIds = categories
      .filter(
        (c) => PRO_CATEGORY_NAMES.has(c.name) || (c.is_custom && !freeCustomIds.has(c.id))
      )
      .map((c) => c.id)
    const lockedCategorySet = new Set(lockedCategoryIds)

    return {
      canAddPerson: people.length < FREE_PERSON_LIMIT,
      isPersonLocked: (personId: string) => !freePeopleIds.has(personId),
      canAddCategory: customCats.length < FREE_CUSTOM_CATEGORY_LIMIT,
      isCategoryLocked: (categoryId: string) => lockedCategorySet.has(categoryId),
      canAddItem: (categoryId: string) => !lockedCategorySet.has(categoryId),
      canEditItem: (categoryId: string) => !lockedCategorySet.has(categoryId),
      lockedPeopleIds,
      lockedCategoryIds,
    }
  }, [isPro, people, categories])
}
