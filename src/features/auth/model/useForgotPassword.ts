'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/shared/api/supabase'

const forgotSchema = z.object({
  email: z.string().email(),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotFormValues) {
    setIsLoading(true)
    const supabase = createClient()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
    })

    setIsLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
  }

  return { form, isLoading, sent, onSubmit }
}
