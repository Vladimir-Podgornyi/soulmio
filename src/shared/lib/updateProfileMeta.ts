import type { DbClient } from '@/shared/api/supabase'

/**
 * Обновляет platform / language / country_code в profiles.
 * Вызывается после любого успешного входа (email+password).
 * country_code запрашивается через ipapi.co только если поле пустое.
 */
export async function updateProfileMeta(supabase: DbClient, userId: string): Promise<void> {
  const language = navigator.language?.split('-')[0] || 'en'

  // Берём текущий country_code чтобы не перезаписывать если уже есть
  const { data: profile } = await supabase
    .from('profiles')
    .select('country_code')
    .eq('id', userId)
    .single()

  let countryCode: string | null = profile?.country_code ?? null

  if (!countryCode) {
    try {
      const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
      if (res.ok) {
        const geo = await res.json() as { country_code?: string }
        countryCode = geo.country_code ?? null
      }
    } catch {
      // не критично — просто оставляем null
    }
  }

  await supabase.from('profiles').upsert(
    {
      id: userId,
      platform: 'web',
      language,
      ...(countryCode ? { country_code: countryCode } : {}),
    },
    { onConflict: 'id' }
  )
}
