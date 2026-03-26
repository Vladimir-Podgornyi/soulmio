import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/shared/api/supabase-server'

export async function DELETE() {
  // 1. Проверяем что пользователь авторизован
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Удаляем через admin-клиент (service role key, обходит RLS)
  //    Supabase каскадом удалит profiles → people → categories → items и т.д.
  const adminSupabase = await createServiceSupabaseClient()
  const { error } = await adminSupabase.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
