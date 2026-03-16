import { getTranslations } from 'next-intl/server'
import { LoginForm } from '@/features/auth'

export async function LoginPage() {
  const t = await getTranslations()

  return (
    <AuthCard
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      tagline={t('brand.tagline')}
    >
      <LoginForm />
    </AuthCard>
  )
}

function AuthCard({
  title,
  subtitle,
  tagline,
  children,
}: {
  title: string
  subtitle: string
  tagline: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-s-bg-primary px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <p className="text-2xl">🫶</p>
          <h1 className="mt-2 text-xl font-bold tracking-[-0.5px] text-s-text-primary">Soulmio</h1>
          <p className="mt-1 text-xs text-s-text-muted">{tagline}</p>
        </div>

        {/* Card */}
        <div className="rounded-[20px] bg-s-bg-card p-7" style={{ boxShadow: 'var(--s-shadow-card)' }}>
          <h2 className="mb-1 text-lg font-semibold tracking-[-0.5px] text-s-text-primary">{title}</h2>
          <p className="mb-6 text-sm text-s-text-secondary">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
