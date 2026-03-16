'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { GoogleIcon } from '@/shared/ui/GoogleIcon'
import { useRegister } from '../model/useRegister'

export function RegisterForm() {
  const t = useTranslations()
  const { form, isLoading, state, onSubmit, signInWithGoogle } = useRegister()
  const { register, handleSubmit, formState: { errors } } = form

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-2xl">
          ✉️
        </div>
        <p className="text-base font-semibold text-s-text-primary">{t('auth.emailSent.title')}</p>
        <p className="text-sm leading-relaxed text-s-text-secondary">
          {t('auth.emailSent.message')}
        </p>
        <Link href="/login" className="mt-2 text-sm font-medium text-s-primary hover:underline">
          {t('auth.emailSent.backToSignIn')}
        </Link>
      </div>
    )
  }

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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Full name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-s-text-secondary">
            {t('auth.yourName')}
          </label>
          <input
            {...register('fullName')}
            type="text"
            autoComplete="name"
            placeholder={t('auth.namePlaceholder')}
            className="h-11 rounded-xl bg-s-bg-input px-4 text-sm text-s-text-primary placeholder:text-s-text-muted outline-none transition-colors focus:bg-s-bg-input-focus focus:ring-1 focus:ring-s-primary/40"
          />
          {errors.fullName && (
            <span className="text-xs text-red-500">{errors.fullName.message}</span>
          )}
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-s-text-secondary">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl bg-s-bg-input px-4 pr-11 text-sm text-s-text-primary placeholder:text-s-text-muted outline-none transition-colors focus:bg-s-bg-input-focus focus:ring-1 focus:ring-s-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-s-text-muted transition-colors hover:text-s-text-secondary"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-red-500">{errors.password.message}</span>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-s-text-secondary">
            {t('auth.confirmPassword')}
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl bg-s-bg-input px-4 pr-11 text-sm text-s-text-primary placeholder:text-s-text-muted outline-none transition-colors focus:bg-s-bg-input-focus focus:ring-1 focus:ring-s-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-s-text-muted transition-colors hover:text-s-text-secondary"
              tabIndex={-1}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-11 w-full rounded-xl bg-s-primary text-sm font-semibold text-white transition-colors hover:bg-s-primary-dark disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('auth.signUp')}
        </button>
      </form>

      <p className="text-center text-sm text-s-text-secondary">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link href="/login" className="font-medium text-s-primary hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  )
}

