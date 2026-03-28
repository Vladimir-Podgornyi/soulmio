import { redirect } from 'next/navigation'
import { getAdminSession } from '@/shared/lib/adminGuard'
import { AdminPage } from '@/views/admin/AdminPage'

export default async function AdminRoute() {
  const session = await getAdminSession()
  if (!session) redirect('/dashboard')

  return <AdminPage />
}
