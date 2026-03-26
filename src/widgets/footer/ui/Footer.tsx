'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Mail } from 'lucide-react'

const SUPPORT_EMAIL = 'soulmio.support@gmail.com'

export function Footer() {
  const t = useTranslations()

  return (
    <footer id="site-footer" className="border-t border-border bg-bg-secondary px-6 py-5 pb-[calc(1.25rem+64px)] md:pb-5">
      <div className="mx-auto max-w-3xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Лого + копирайт */}
        <p className="text-xs text-text-muted">
          <span className="font-semibold text-text-secondary">SoulMio</span>
          {' · '}
          {t('footer.copyright')}
        </p>

        {/* Юридические ссылки + фидбек */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
          >
            <Mail size={12} />
            {t('footer.feedback')}
          </a>
          <Link href="/privacy" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            {t('footer.privacy')}
          </Link>
          <Link href="/impressum" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            {t('footer.impressum')}
          </Link>
          <Link href="/terms" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            {t('footer.terms')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
