import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/shared/api/supabase-server'

// Корневая страница: аутентифицированных пользователей перенаправляем на dashboard, остальных — на login.
// Middleware тоже обрабатывает это, но здесь дополнительная защита для корневого пути.
export default async function RootPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
