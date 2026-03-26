import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getProfile } from '@/entities/user/api'
import { ProPage } from '@/views/pro/ProPage'

export default async function Page() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(supabase as DbClient, user.id)
  const isPro = profile?.subscription_tier === 'pro'

  return <ProPage isPro={isPro} />
}
