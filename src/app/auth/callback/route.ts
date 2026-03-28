import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'

/**
 * Обработчик callback-а аутентификации Supabase.
 * Вызывается после:
 *  - Подтверждения email (регистрация)
 *  - Редиректа Google OAuth
 *  - Сброса пароля: redirectTo указывает на /auth/callback?next=/reset-password
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
      // Обновляем метаданные профиля перед редиректом
      await updateProfileMetaServer(request, supabase)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Что-то пошло не так — перенаправляем на логин с параметром ошибки
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}

async function updateProfileMetaServer(
  request: NextRequest,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Язык из заголовка браузера
  const acceptLang = request.headers.get('accept-language') ?? ''
  const language = acceptLang.split(',')[0]?.split(';')[0]?.split('-')[0]?.trim() || 'en'

  // Проверяем — может country_code уже есть
  const { data: profile } = await supabase
    .from('profiles')
    .select('country_code')
    .eq('id', user.id)
    .single()

  let countryCode: string | null = profile?.country_code ?? null

  if (!countryCode) {
    // Реальный IP клиента (Vercel проксирует через x-forwarded-for)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')

    if (clientIp) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`, {
          signal: AbortSignal.timeout(4000),
        })
        if (geoRes.ok) {
          const geo = await geoRes.json() as { country_code?: string }
          countryCode = geo.country_code ?? null
        }
      } catch {
        // не критично
      }
    }
  }

  await supabase.from('profiles').upsert(
    {
      id: user.id,
      platform: 'web',
      language,
      ...(countryCode ? { country_code: countryCode } : {}),
    },
    { onConflict: 'id' }
  )
}
