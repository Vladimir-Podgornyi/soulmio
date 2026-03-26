import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getProfile } from '@/entities/user/api'
import { SettingsPage } from '@/views/settings/SettingsPage'
import type { Profile } from '@/entities/user/model/types'

export default async function Page() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let profile = await getProfile(supabase as DbClient, user.id)

  if (!profile) {
    const fullName = (user.user_metadata?.full_name as string | undefined) ?? null
    profile = {
      id: user.id,
      email: user.email ?? null,
      full_name: fullName,
      avatar_url: null,
      subscription_tier: 'free',
      created_at: new Date().toISOString(),
    } satisfies Profile
  }

  return <SettingsPage profile={profile} />
}
