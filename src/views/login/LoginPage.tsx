import { getTranslations } from 'next-intl/server'
import { ShieldAlert } from 'lucide-react'
import { LoginForm } from '@/features/auth'

interface Props {
  errorCode?: string
}

export async function LoginPage({ errorCode }: Props) {
  const t = await getTranslations()
  const isExpiredLink = errorCode === 'otp_expired' || errorCode === 'access_denied'

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <p className="text-2xl">🫶</p>
          <h1 className="mt-2 text-xl font-bold tracking-[-0.5px] text-text-primary">SoulMio</h1>
          <p className="mt-1 text-xs text-text-muted">{t('brand.tagline')}</p>
        </div>

        {isExpiredLink && (
          <div className="mb-4 flex items-start gap-3 rounded-[14px] bg-bg-card px-4 py-3.5" style={{ border: '1px solid rgba(224, 104, 104, 0.25)' }}>
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{t('auth.resetPassword.invalidLink')}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{t('auth.resetPassword.invalidLinkMessage')}</p>
            </div>
          </div>
        )}

        <div className="rounded-[20px] bg-bg-card p-7" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-1 text-center text-lg font-semibold tracking-[-0.5px] text-text-primary">
            {t('auth.login.title')}
          </h2>
          <p className="mb-6 text-center text-sm text-text-secondary">{t('auth.login.subtitle')}</p>
          <LoginForm initialView={isExpiredLink ? 'forgot' : 'login'} />
        </div>
      </div>
    </div>
  )
}
