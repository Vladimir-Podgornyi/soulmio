// Типы сущности User
export type SubscriptionTier = 'free' | 'pro'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  subscription_tier: SubscriptionTier
  created_at: string
}
