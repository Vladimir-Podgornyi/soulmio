'use client'

import { useState } from 'react'
import { createClient } from '@/shared/api/supabase'

export function useUpdatePassword() {
  const [loading, setLoading] = useState(false)

  async function updatePassword(password: string): Promise<{ error: string | null }> {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (error) return { error: error.message }
    return { error: null }
  }

  return { updatePassword, loading }
}
