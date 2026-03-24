import { getTranslations } from 'next-intl/server'
import { RegisterForm } from '@/features/auth'

export async function RegisterPage() {
  const t = await getTranslations()

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <p className="text-2xl">🫶</p>
          <h1 className="mt-2 text-xl font-bold tracking-[-0.5px] text-text-primary">SoulMio</h1>
          <p className="mt-1 text-xs text-text-muted">{t('brand.tagline')}</p>
        </div>
        <div className="rounded-[20px] bg-bg-card p-7" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="mb-1 text-lg font-semibold tracking-[-0.5px] text-text-primary">
            {t('auth.register.title')}
          </h2>
          <p className="mb-6 text-sm text-text-secondary">{t('auth.register.subtitle')}</p>
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
