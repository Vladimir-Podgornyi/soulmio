// Типы сущности Category
export type DefaultCategoryName = 'food' | 'restaurants' | 'gifts' | 'movies' | 'travel'

export interface Category {
  id: string
  person_id: string
  name: string
  icon: string | null
  is_custom: boolean
  sort_order: number
  created_at: string
}
