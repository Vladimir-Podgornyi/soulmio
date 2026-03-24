import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const passwordSchema = z
  .string()
  .min(8, 'auth.passwordRequirements.minLength')
  .regex(/[A-Z]/, 'auth.passwordRequirements.uppercase')
  .regex(/[0-9]/, 'auth.passwordRequirements.number')
  .regex(/[^A-Za-z0-9]/, 'auth.passwordRequirements.symbol')

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
