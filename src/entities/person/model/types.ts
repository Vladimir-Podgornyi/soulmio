// Типы сущности Person
export type DefaultRelation = 'partner' | 'friend' | 'family' | 'other'
export const DEFAULT_RELATIONS: DefaultRelation[] = ['partner', 'friend', 'family', 'other']

export interface Person {
  id: string
  user_id: string
  name: string
  relation: string | null
  avatar_url: string | null
  notes: string | null
  is_favorite: boolean
  relation_since: string | null
  birth_date: string | null
  birth_notify_days: number
  created_at: string
}
