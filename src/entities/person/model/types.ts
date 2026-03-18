// Person entity types
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
  created_at: string
}
