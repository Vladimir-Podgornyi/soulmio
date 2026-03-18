// Типы сущности Item
export type Sentiment = 'likes' | 'dislikes' | 'wants' | 'visited'

export interface Item {
  id: string
  category_id: string
  person_id: string
  title: string
  description: string | null
  image_url: string | null
  external_url: string | null
  price: number | null
  sentiment: Sentiment | null
  my_rating: number | null
  partner_rating: number | null
  tags: string[] | null
  ai_suggested: boolean
  created_at: string
}
