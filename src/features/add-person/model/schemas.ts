import { z } from 'zod'

export const addPersonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  relation: z.string().nullable(),
  notes: z.string().max(500).nullable(),
})

export type AddPersonFormValues = z.infer<typeof addPersonSchema>
