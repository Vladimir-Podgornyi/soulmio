// Person entity types
export type Relation = 'partner' | 'friend' | 'family' | 'other'

export interface Person {
  id: string
  user_id: string
  name: string
  relation: Relation | null
  avatar_url: string | null
  notes: string | null
  created_at: string
}
