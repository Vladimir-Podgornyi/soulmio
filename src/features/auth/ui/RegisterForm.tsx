'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { GoogleIcon } from '@/shared/ui/GoogleIcon'
import { AppleIcon } from '@/shared/ui/AppleIcon'
import { useRegister } from '../model/useRegister'

export function RegisterForm() {
  const t = useTranslations()
  const { form, isLoading, state, onSubmit, signInWithGoogle, signInWithApple } = useRegister()
  const { register, handleSubmit, formState: { errors }, watch } = form
  const passwordValue = watch('password', '')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-2xl">
          ✉️
        </div>
        <p className="text-base font-semibold text-text-primary">{t('auth.emailSent.title')}</p>
        <p className="text-sm leading-relaxed text-text-secondary">
          {t('auth.emailSent.message')}
        </p>
        <Link href="/login" className="mt-2 text-sm font-medium text-primary hover:underline">
          {t('auth.emailSent.backToSignIn')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* OAuth кнопки */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-bg-card text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-50"
        >
          <GoogleIcon />
          {t('auth.continueWithGoogle')}
        </button>
        <button
          type="button"
          onClick={signInWithApple}
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-bg-card text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-50"
        >
          <AppleIcon />
          {t('auth.continueWithApple')}
        </button>
      </div>

      {/* Разделитель */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">{t('common.or')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Полное имя */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            {t('auth.yourName')}
          </label>
          <input
            {...register('fullName')}
            type="text"
            autoComplete="name"
            placeholder={t('auth.namePlaceholder')}
            className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
          />
          {errors.fullName && (
            <span className="text-xs text-red-500">{errors.fullName.message}</span>
          )}
        </div>

        {/* Email (почта) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            {t('auth.email')}
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
          />
          {errors.email && (
            <span className="text-xs text-red-500">{errors.email.message}</span>
          )}
        </div>

        {/* Пароль */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl bg-bg-input px-4 pr-11 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordValue.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {(
                [
                  { key: 'minLength', ok: passwordValue.length >= 8 },
                  { key: 'uppercase', ok: /[A-Z]/.test(passwordValue) },
                  { key: 'number', ok: /[0-9]/.test(passwordValue) },
                  { key: 'symbol', ok: /[^A-Za-z0-9]/.test(passwordValue) },
                ] as const
              ).map(({ key, ok }) => (
                <span key={key} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-[#5CBD8A]' : 'text-text-muted'}`}>
                  {ok ? <Check size={11} /> : <X size={11} />}
                  {t(`auth.passwordRequirements.${key}`)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Подтверждение пароля */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            {t('auth.confirmPassword')}
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl bg-bg-input px-4 pr-11 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
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
          className="mt-2 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('auth.signUp')}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  )
}

