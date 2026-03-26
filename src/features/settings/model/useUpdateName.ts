'use client'

import { useState } from 'react'
import { createClient } from '@/shared/api/supabase'

export function useUpdateName() {
  const [loading, setLoading] = useState(false)

  async function updateName(userId: string, name: string): Promise<{ error: string | null }> {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', userId)

    setLoading(false)
    if (error) return { error: error.message }
    return { error: null }
  }

  return { updateName, loading }
}
