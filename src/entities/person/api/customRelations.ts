import type { DbClient } from '@/shared/api/supabase'

export async function getCustomRelations(
  supabase: DbClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('custom_relations')
    .select('name')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data.map((r) => r.name)
}

export async function addCustomRelation(
  supabase: DbClient,
  userId: string,
  name: string
): Promise<void> {
  await supabase
    .from('custom_relations')
    .upsert({ user_id: userId, name }, { onConflict: 'user_id,name' })
}

export async function deleteCustomRelation(
  supabase: DbClient,
  userId: string,
  name: string
): Promise<void> {
  await supabase
    .from('custom_relations')
    .delete()
    .eq('user_id', userId)
    .eq('name', name)
}
