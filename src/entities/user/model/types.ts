// Типы сущности User
export type SubscriptionTier = 'free' | 'pro'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  subscription_tier: SubscriptionTier
  subscription_ends_at: string | null
  grace_period_ends_at: string | null
  created_at: string
}
