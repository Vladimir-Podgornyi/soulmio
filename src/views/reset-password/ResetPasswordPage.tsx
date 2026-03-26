'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { CheckCircle, ShieldAlert } from 'lucide-react'
import { createClient } from '@/shared/api/supabase'
import { toast } from 'sonner'

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'auth.passwordRequirements.minLength')
      .regex(/[A-Z]/, 'auth.passwordRequirements.uppercase')
      .regex(/[0-9]/, 'auth.passwordRequirements.number')
      .regex(/[^A-Za-z0-9]/, 'auth.passwordRequirements.symbol'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'passwords_do_not_match',
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

type Status = 'loading' | 'ready' | 'success' | 'error'

export function ResetPasswordPage() {
  const t = useTranslations()
  const [status, setStatus] = useState<Status>('loading')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  })

  // Check that we have an active recovery session (established by /auth/callback)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'ready' : 'error')
    })
  }, [])

  async function onSubmit(values: ResetFormValues) {
    setIsSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password: values.password })

    if (error) {
      toast.error(error.message)
      setIsSubmitting(false)
      return
    }

    setStatus('success')
    setTimeout(() => { window.location.href = '/dashboard' }, 2000)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <p className="text-2xl">🫶</p>
          <h1 className="mt-2 text-xl font-bold tracking-[-0.5px] text-text-primary">SoulMio</h1>
        </div>

        <div className="rounded-[20px] bg-bg-card p-7" style={{ boxShadow: 'var(--shadow-card)' }}>

          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-text-muted">{t('common.loading')}</p>
            </div>
          )}

          {/* Invalid / expired link */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-input">
                <ShieldAlert size={26} className="text-red-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">
                  {t('auth.resetPassword.invalidLink')}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  {t('auth.resetPassword.invalidLinkMessage')}
                </p>
              </div>
              <Link
                href="/login"
                className="mt-1 text-sm font-medium text-primary hover:underline"
              >
                {t('auth.resetPassword.requestNew')}
              </Link>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-input">
                <CheckCircle size={26} className="text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">
                  {t('auth.resetPassword.success')}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  {t('auth.resetPassword.successMessage')}
                </p>
              </div>
            </div>
          )}

          {/* New password form */}
          {status === 'ready' && (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-lg font-semibold tracking-[-0.5px] text-text-primary">
                  {t('auth.resetPassword.title')}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {t('auth.resetPassword.subtitle')}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                    {t('auth.resetPassword.newPassword')}
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
                  />
                  {errors.password && (
                    <span className="text-xs text-red-500">{t(errors.password.message as Parameters<typeof t>[0])}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                    {t('auth.resetPassword.confirmPassword')}
                  </label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
                  />
                  {errors.confirmPassword && (
                    <span className="text-xs text-red-500">
                      {t('settings.passwordMismatch')}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                >
                  {isSubmitting ? t('common.loading') : t('auth.resetPassword.submit')}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
