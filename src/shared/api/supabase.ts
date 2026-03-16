import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/shared/types/database'

/**
 * Browser (client component) Supabase client.
 * Use inside 'use client' components and custom hooks.
 *
 * Creates a new instance on every call — intentional for @supabase/ssr,
 * which internally deduplicates the underlying GoTrue client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
