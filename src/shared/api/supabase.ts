import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/shared/types/database'

export type DbClient = ReturnType<typeof createBrowserClient<Database>>

/**
 * Браузерный (клиентский компонент) Supabase-клиент.
 * Использовать внутри компонентов с 'use client' и пользовательских хуков.
 *
 * Создаёт новый экземпляр при каждом вызове — намеренно для @supabase/ssr,
 * который внутри дедуплицирует базовый GoTrue-клиент.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
