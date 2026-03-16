'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}
