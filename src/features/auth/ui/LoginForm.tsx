'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { GoogleIcon } from '@/shared/ui/GoogleIcon'
import { useLogin } from '../model/useLogin'

export function LoginForm() {
  const t = useTranslations()
  const { form, isLoading, onSubmit, signInWithGoogle } = useLogin()
  const { register, handleSubmit, formState: { errors } } = form

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Google OAuth */}
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isLoading}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-s-border bg-s-bg-card text-sm font-medium text-s-text-primary transition-colors hover:bg-s-bg-hover disabled:opacity-50"
      >
        <GoogleIcon />
        {t('auth.continueWithGoogle')}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-s-border" />
        <span className="text-xs text-s-text-muted">{t('common.or')}</span>
        <div className="h-px flex-1 bg-s-border" />
      </div>

      {/* Email/password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-s-text-secondary">
            {t('auth.email')}
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-11 rounded-xl bg-s-bg-input px-4 text-sm text-s-text-primary placeholder:text-s-text-muted outline-none transition-colors focus:bg-s-bg-input-focus focus:ring-1 focus:ring-s-primary/40"
          />
          {errors.email && (
            <span className="text-xs text-red-500">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-s-text-secondary">
            {t('auth.password')}
          </label>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 rounded-xl bg-s-bg-input px-4 text-sm text-s-text-primary placeholder:text-s-text-muted outline-none transition-colors focus:bg-s-bg-input-focus focus:ring-1 focus:ring-s-primary/40"
          />
          {errors.password && (
            <span className="text-xs text-red-500">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-11 w-full rounded-xl bg-s-primary text-sm font-semibold text-white transition-colors hover:bg-s-primary-dark disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('auth.signIn')}
        </button>
      </form>

      <p className="text-center text-sm text-s-text-secondary">
        {t('auth.dontHaveAccount')}{' '}
        <Link href="/signup" className="font-medium text-s-primary hover:underline">
          {t('auth.signUp')}
        </Link>
      </p>
    </div>
  )
}

