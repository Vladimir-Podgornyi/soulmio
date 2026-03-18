'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sun, Moon, Monitor, LogOut, ChevronRight } from 'lucide-react'
import type { Profile } from '@/entities/user/model/types'
import { useUpdateName } from '@/features/settings/model/useUpdateName'
import { useUpdateEmail } from '@/features/settings/model/useUpdateEmail'
import { useUpdatePassword } from '@/features/settings/model/useUpdatePassword'
import { useSignOut } from '@/features/settings/model/useSignOut'

interface SettingsPageProps {
  profile: Profile
}

type EditingField = 'name' | 'email' | 'password' | null

const LOCALES = ['en', 'de', 'ru'] as const
type LocaleKey = (typeof LOCALES)[number]

export function SettingsPage({ profile }: SettingsPageProps) {
  const t = useTranslations()
  const { theme, setTheme } = useTheme()
  const locale = useLocale()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [editing, setEditing] = useState<EditingField>(null)
  const [nameValue, setNameValue] = useState(profile.full_name ?? '')
  const [emailValue, setEmailValue] = useState(profile.email ?? '')
  const [passwordValue, setPasswordValue] = useState('')
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('')

  const { updateName, loading: nameLoading } = useUpdateName()
  const { updateEmail, loading: emailLoading } = useUpdateEmail()
  const { updatePassword, loading: passwordLoading } = useUpdatePassword()
  const { signOut, loading: signOutLoading } = useSignOut()

  function changeLocale(locale: LocaleKey) {
    document.cookie = `locale=${locale}; path=/; max-age=31536000`
    router.refresh()
  }

  async function handleSaveName() {
    const { error } = await updateName(profile.id, nameValue.trim())
    if (error) { toast.error(t('common.error')); return }
    toast.success(t('settings.nameSaved'))
    setEditing(null)
  }

  async function handleSaveEmail() {
    const { error } = await updateEmail(emailValue.trim())
    if (error) { toast.error(t('common.error')); return }
    toast.success(t('settings.emailSent'))
    setEditing(null)
  }

  async function handleSavePassword() {
    if (passwordValue !== confirmPasswordValue) {
      toast.error(t('settings.passwordMismatch'))
      return
    }
    const { error } = await updatePassword(passwordValue)
    if (error) { toast.error(t('common.error')); return }
    toast.success(t('settings.passwordSaved'))
    setPasswordValue('')
    setConfirmPasswordValue('')
    setEditing(null)
  }

  return (
    <div className="min-h-screen bg-bg-primary px-4 pt-14 pb-10">
      <h1 className="mb-8 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
        {t('settings.title')}
      </h1>

      {/* ── Appearance ── */}
      <SectionLabel>{t('settings.appearance')}</SectionLabel>
      <div className="mb-5 rounded-[14px] bg-bg-card border border-border-card overflow-hidden">

        {/* Theme */}
        <div className="px-4 py-3">
          <p className="mb-2 text-sm font-medium text-text-primary">{t('settings.theme')}</p>
          <div className="flex gap-2">
            {(['dark', 'light', 'system'] as const).map((t_) => (
              <button
                key={t_}
                onClick={() => setTheme(t_)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-[8px] py-2 text-xs font-medium transition-colors ${
                  mounted && theme === t_
                    ? 'bg-primary text-white'
                    : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {t_ === 'dark' && <Moon size={13} />}
                {t_ === 'light' && <Sun size={13} />}
                {t_ === 'system' && <Monitor size={13} />}
                {t(`settings.themes.${t_}`)}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* Language */}
        <div className="px-4 py-3">
          <p className="mb-2 text-sm font-medium text-text-primary">{t('settings.language')}</p>
          <div className="flex gap-2">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => changeLocale(l)}
                className={`flex flex-1 items-center justify-center rounded-[8px] py-2 text-xs font-medium transition-colors ${
                  mounted && locale === l
                    ? 'bg-primary text-white'
                    : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {t(`settings.languages.${l}` as never)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Account ── */}
      <SectionLabel>{t('settings.account')}</SectionLabel>
      <div className="mb-5 rounded-[14px] bg-bg-card border border-border-card overflow-hidden">

        {/* Name */}
        <AccountRow
          label={t('settings.name')}
          value={profile.full_name ?? '—'}
          cancelLabel={t('common.cancel')}
          isEditing={editing === 'name'}
          onEdit={() => setEditing('name')}
          onCancel={() => setEditing(null)}
        >
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder={t('settings.name')}
            className="w-full rounded-[8px] bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <SaveButton loading={nameLoading} onClick={handleSaveName} label={t('common.save')} />
        </AccountRow>

        <Divider />

        {/* Email */}
        <AccountRow
          label={t('settings.email')}
          value={profile.email ?? '—'}
          cancelLabel={t('common.cancel')}
          isEditing={editing === 'email'}
          onEdit={() => setEditing('email')}
          onCancel={() => setEditing(null)}
        >
          <input
            autoFocus
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder={t('settings.email')}
            className="w-full rounded-[8px] bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <SaveButton loading={emailLoading} onClick={handleSaveEmail} label={t('common.save')} />
        </AccountRow>

        <Divider />

        {/* Password */}
        <AccountRow
          label={t('settings.password')}
          value="••••••••"
          cancelLabel={t('common.cancel')}
          isEditing={editing === 'password'}
          onEdit={() => setEditing('password')}
          onCancel={() => { setPasswordValue(''); setConfirmPasswordValue(''); setEditing(null) }}
        >
          <input
            autoFocus
            type="password"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            placeholder={t('settings.newPassword')}
            className="w-full rounded-[8px] bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <input
            type="password"
            value={confirmPasswordValue}
            onChange={(e) => setConfirmPasswordValue(e.target.value)}
            placeholder={t('settings.confirmPassword')}
            className="w-full rounded-[8px] bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {confirmPasswordValue && passwordValue !== confirmPasswordValue && (
            <p className="text-xs text-red-500">{t('settings.passwordMismatch')}</p>
          )}
          <SaveButton
            loading={passwordLoading}
            onClick={handleSavePassword}
            label={t('common.save')}
            disabled={passwordValue.length < 6 || passwordValue !== confirmPasswordValue}
          />
        </AccountRow>
      </div>

      {/* ── Sign out ── */}
      <button
        onClick={signOut}
        disabled={signOutLoading}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50 min-h-[52px]"
      >
        <LogOut size={16} />
        {t('auth.signOut')}
      </button>
    </div>
  )
}

/* ── Sub-components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="mx-4 h-px bg-border-card" />
}

interface AccountRowProps {
  label: string
  value: string
  cancelLabel: string
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  children: React.ReactNode
}

function AccountRow({ label, value, cancelLabel, isEditing, onEdit, onCancel, children }: AccountRowProps) {
  return (
    <div className="px-4 py-3">
      {!isEditing ? (
        <button
          onClick={onEdit}
          className="flex w-full items-center justify-between min-h-[44px]"
        >
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-xs text-text-secondary">{label}</span>
            <span className="text-sm font-medium text-text-primary">{value}</span>
          </div>
          <ChevronRight size={16} className="text-text-muted" />
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">{label}</span>
            <button
              onClick={onCancel}
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              {cancelLabel}
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  )
}

interface SaveButtonProps {
  loading: boolean
  onClick: () => void
  label: string
  disabled?: boolean
}

function SaveButton({ loading, onClick, label, disabled }: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full rounded-[8px] bg-primary py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 min-h-[40px]"
    >
      {loading ? '...' : label}
    </button>
  )
}
