import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'

/**
 * Обработчик callback-а аутентификации Supabase.
 * Вызывается после:
 *  - Подтверждения email (регистрация)
 *  - Редиректа Google OAuth
 *
 * Обменивает одноразовый `code` на сессию и перенаправляет пользователя.
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

  // Что-то пошло не так — перенаправляем на логин с параметром ошибки
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
