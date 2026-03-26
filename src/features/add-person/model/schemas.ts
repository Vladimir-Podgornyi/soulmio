import { z } from 'zod'

export const addPersonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  relation: z.string().nullable(),
  notes: z.string().max(500).nullable(),
  relation_since: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  birth_notify_days: z.number().int().min(0).max(365),
})

export type AddPersonFormValues = z.infer<typeof addPersonSchema>
