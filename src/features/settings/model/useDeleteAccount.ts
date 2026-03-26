'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/shared/api/supabase'

export function useDeleteAccount() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function deleteAccount(): Promise<{ error?: string }> {
    setLoading(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return { error: body.error ?? 'error' }
      }
      // После удаления на сервере — выходим из сессии и редиректим
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      return {}
    } catch {
      return { error: 'error' }
    } finally {
      setLoading(false)
    }
  }

  return { deleteAccount, loading }
}
