import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getItemsByCategory } from '@/entities/item/api'
import { calcIsPro } from '@/shared/lib/calcIsPro'

const PRO_CATEGORY_NAMES = new Set(['movies', 'travel'])

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const personId = searchParams.get('personId')
  const categoryId = searchParams.get('categoryId')

  if (!personId || !categoryId) {
    return NextResponse.json({ error: 'personId and categoryId required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Проверяем что человек принадлежит текущему пользователю
  const { data: person } = await supabase
    .from('people')
    .select('id, user_id')
    .eq('id', personId)
    .eq('user_id', user.id)
    .single()

  if (!person) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Получаем профиль для проверки подписки
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_ends_at, grace_period_ends_at')
    .eq('id', user.id)
    .single()

  const isPro = profile ? calcIsPro(profile) : false

  // Для Free пользователей — проверяем доступ к категории
  if (!isPro) {
    const { data: category } = await supabase
      .from('categories')
      .select('id, name, is_custom, person_id')
      .eq('id', categoryId)
      .single()

    if (category) {
      if (PRO_CATEGORY_NAMES.has(category.name)) {
        return NextResponse.json({ error: 'Pro required' }, { status: 403 })
      }

      if (category.is_custom) {
        // Первая кастомная категория человека (по created_at) — разрешена
        const { data: firstCustom } = await supabase
          .from('categories')
          .select('id')
          .eq('person_id', category.person_id)
          .eq('is_custom', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        if (firstCustom?.id !== categoryId) {
          return NextResponse.json({ error: 'Pro required' }, { status: 403 })
        }
      }
    }
  }

  const items = await getItemsByCategory(supabase as DbClient, personId, categoryId)
  return NextResponse.json(items)
}
