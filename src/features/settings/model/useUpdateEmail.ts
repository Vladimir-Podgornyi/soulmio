'use client'

import { useState } from 'react'
import { createClient } from '@/shared/api/supabase'

export function useUpdateEmail() {
  const [loading, setLoading] = useState(false)

  async function updateEmail(email: string): Promise<{ error: string | null }> {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ email })

    setLoading(false)
    if (error) return { error: error.message }
    return { error: null }
  }

  return { updateEmail, loading }
}
