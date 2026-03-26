'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/shared/api/supabase'
import { registerSchema, type RegisterFormValues } from './schemas'

export type RegisterState = 'idle' | 'success'

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false)
  const [state, setState] = useState<RegisterState>('idle')

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: { full_name: values.fullName },
      },
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    setState('success')
    setIsLoading(false)
  }

  async function signInWithGoogle() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) toast.error(error.message)
  }

  async function signInWithApple() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) toast.error(error.message)
  }

  return { form, isLoading, state, onSubmit, signInWithGoogle, signInWithApple }
}
