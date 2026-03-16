import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getProfile } from '@/entities/user/api'
import { DashboardPage } from '@/views/dashboard/DashboardPage'
import type { Profile } from '@/entities/user/model/types'

async function getOrCreateProfile(
  supabase: DbClient,
  userId: string,
  email: string | undefined,
  fullName: string | null,
): Promise<Profile> {
  const existing = await getProfile(supabase, userId)
  if (existing) return existing

  const { data } = await supabase
    .from('profiles')
    .insert({ id: userId, email: email ?? null, full_name: fullName })
    .select()
    .single()

  if (data) return data as Profile

  // Fallback: profile table unreachable (e.g. RLS not configured yet)
  // Build an in-memory profile from auth data so the user can still use the app
  return {
    id: userId,
    email: email ?? null,
    full_name: fullName,
    avatar_url: null,
    subscription_tier: 'free',
    created_at: new Date().toISOString(),
  }
}

export default async function Page() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null
  const profile = await getOrCreateProfile(supabase as DbClient, user.id, user.email, fullName)

  return <DashboardPage profile={profile} />
}
