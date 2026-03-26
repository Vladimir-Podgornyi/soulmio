'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { GoogleIcon } from '@/shared/ui/GoogleIcon'
import { AppleIcon } from '@/shared/ui/AppleIcon'
import { useLogin } from '../model/useLogin'
import { useForgotPassword } from '../model/useForgotPassword'

interface LoginFormProps {
  initialView?: 'login' | 'forgot'
}

export function LoginForm({ initialView = 'login' }: LoginFormProps) {
  const t = useTranslations()
  const [view, setView] = useState<'login' | 'forgot'>(initialView)

  if (view === 'forgot') {
    return <ForgotPasswordView onBack={() => setView('login')} />
  }

  return <LoginView onForgot={() => setView('forgot')} />
}

function LoginView({ onForgot }: { onForgot: () => void }) {
  const t = useTranslations()
  const { form, isLoading, onSubmit, signInWithGoogle, signInWithApple } = useLogin()
  const { register, handleSubmit, formState: { errors } } = form

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

      {/* Форма email/пароль */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
              {t('auth.password')}
            </label>
            <button
              type="button"
              onClick={onForgot}
              className="text-[11px] text-text-muted hover:text-primary transition-colors"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
          />
          {errors.password && (
            <span className="text-xs text-red-500">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('auth.signIn')}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        {t('auth.dontHaveAccount')}{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          {t('auth.signUp')}
        </Link>
      </p>
    </div>
  )
}

function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const t = useTranslations()
  const { form, isLoading, sent, onSubmit } = useForgotPassword()
  const { register, handleSubmit, formState: { errors } } = form

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-input">
          <Mail size={26} className="text-primary" />
        </div>
        <div>
          <p className="text-base font-semibold text-text-primary">{t('auth.resetLinkSent')}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
            {t('auth.resetLinkSentMessage')}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft size={14} />
          {t('auth.backToSignIn')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-base font-semibold tracking-[-0.3px] text-text-primary">
          {t('auth.forgotPasswordTitle')}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {t('auth.forgotPasswordSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        <button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('auth.sendResetLink')}
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        {t('auth.backToSignIn')}
      </button>
    </div>
  )
}
