import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/shared/types/database'



export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll вызывается из Server Component — там куки только для чтения.
            // Сессия всё равно читается; запись — это no-op и безвредна.
          }
        },
      },
    }
  )
}

/**
 * Supabase-клиент с правами сервиса — обходит RLS.
 * Использовать ТОЛЬКО в доверенных серверных контекстах (например, admin API роуты).
 * Никогда не передавать SUPABASE_SERVICE_ROLE_KEY в браузер.
 */
export async function createServiceSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // контекст только для чтения — можно проигнорировать
          }
        },
      },
    }
  )
}
