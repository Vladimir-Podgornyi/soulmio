import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'

/**
 * Supabase auth callback handler.
 * Called after:
 *  - Email confirmation (signup)
 *  - Google OAuth redirect
 *
 * Exchanges the one-time `code` for a session and redirects the user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
