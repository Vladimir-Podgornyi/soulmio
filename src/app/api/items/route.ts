import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'
import type { DbClient } from '@/shared/api/supabase'
import { getItemsByCategory } from '@/entities/item/api'

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

  const items = await getItemsByCategory(supabase as DbClient, personId, categoryId)
  return NextResponse.json(items)
}
