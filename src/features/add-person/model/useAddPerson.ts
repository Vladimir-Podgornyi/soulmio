'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/shared/api/supabase'
import { createPerson } from '@/entities/person/api'
import type { Person } from '@/entities/person/model/types'
import { addPersonSchema, type AddPersonFormValues } from './schemas'

export function useAddPerson(onSuccess?: (person: Person) => void) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<AddPersonFormValues>({
    resolver: zodResolver(addPersonSchema),
    defaultValues: { name: '', relation: null, notes: null },
  })

  async function onSubmit(values: AddPersonFormValues) {
    setIsLoading(true)
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      toast.error('Not authenticated')
      setIsLoading(false)
      return
    }

    try {
      const person = await createPerson(supabase, user.id, {
        name: values.name,
        relation: values.relation,
        notes: values.notes,
      })
      form.reset()
      onSuccess?.(person)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return { form, isLoading, onSubmit }
}
