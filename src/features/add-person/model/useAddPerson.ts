'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/shared/api/supabase'
import { createPerson, updatePerson } from '@/entities/person/api'
import { createPersonDate } from '@/entities/person/api/personDates'
import type { Person } from '@/entities/person/model/types'
import { addPersonSchema, type AddPersonFormValues } from './schemas'

export function useAddPerson(onSuccess?: (person: Person) => void, initial?: Person) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<AddPersonFormValues>({
    resolver: zodResolver(addPersonSchema),
    defaultValues: {
      name: initial?.name ?? '',
      relation: initial?.relation ?? null,
      notes: initial?.notes ?? null,
      relation_since: initial?.relation_since ?? null,
      birth_date: initial?.birth_date ?? null,
      birth_notify_days: initial?.birth_notify_days ?? 0,
    },
  })

  async function onSubmit(
    values: AddPersonFormValues,
    avatarUrl?: string | null,
    pendingDates?: { title: string; date: string; notify_days: number }[]
  ) {
    setIsLoading(true)
    const supabase = createClient()

    try {
      if (initial) {
        const updated = await updatePerson(supabase, initial.id, {
          name: values.name,
          relation: values.relation,
          notes: values.notes,
          avatar_url: avatarUrl !== undefined ? avatarUrl : initial.avatar_url,
          relation_since: values.relation_since || null,
          birth_date: values.birth_date || null,
          birth_notify_days: values.birth_notify_days ?? 0,
        })
        onSuccess?.(updated)
      } else {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          toast.error('Not authenticated')
          return
        }
        const person = await createPerson(supabase, user.id, {
          name: values.name,
          relation: values.relation,
          notes: values.notes,
          avatar_url: avatarUrl ?? null,
          relation_since: values.relation_since || null,
          birth_date: values.birth_date || null,
          birth_notify_days: values.birth_notify_days ?? 0,
        })
        if (pendingDates?.length) {
          await Promise.all(
            pendingDates.map((d) =>
              createPersonDate(supabase, {
                person_id: person.id,
                user_id: user.id,
                title: d.title,
                date: d.date,
                notify_days: d.notify_days,
              })
            )
          )
        }
        form.reset()
        onSuccess?.(person)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return { form, isLoading, onSubmit }
}
