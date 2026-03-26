'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/shared/api/supabase'

export function useSignOut() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function signOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return { signOut, loading }
}
