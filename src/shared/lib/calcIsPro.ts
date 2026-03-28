/**
 * Pure server/client utility — safe to import from both Server and Client components.
 * Checks if a profile has an active Pro subscription (including grace period).
 */
export function calcIsPro(profile: {
  subscription_tier?: string | null
  subscription_ends_at?: string | null
  grace_period_ends_at?: string | null
}): boolean {
  if (profile.subscription_tier !== 'pro') return false
  const now = new Date()
  // Legacy Pro (no dates) — always active
  if (!profile.subscription_ends_at && !profile.grace_period_ends_at) return true
  // Active subscription
  if (profile.subscription_ends_at && new Date(profile.subscription_ends_at) > now) return true
  // Grace period (7 days after subscription_ends_at)
  if (profile.grace_period_ends_at && new Date(profile.grace_period_ends_at) > now) return true
  return false
}

/**
 * Computes the list of accessible person IDs for the current user.
 * Free plan: only the oldest person (by created_at).
 * Pro plan: undefined (= all people are accessible).
 */
export function getAccessiblePeopleIds(
  isPro: boolean,
  people: Array<{ id: string; created_at: string }>
): string[] | undefined {
  if (isPro) return undefined
  const oldest = [...people].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0]
  return oldest ? [oldest.id] : []
}
