import type { DbClient } from '@/shared/api/supabase'
import type { Profile } from '../model/types'

export async function getProfile(
  supabase: DbClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as Profile
}
