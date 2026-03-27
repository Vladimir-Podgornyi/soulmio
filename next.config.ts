import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs'

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts')

const nextConfig: NextConfig = {}

const withIntl = withNextIntl(nextConfig)

export default withSentryConfig(withIntl, {
  org: 'soulmio',
  project: 'soulmio-web',

  // Молчаливая сборка — не засорять output
  silent: !process.env.CI,

  // Загружать source maps в Sentry
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Не добавлять логи в браузерную консоль
  disableLogger: true,

  // Автоматические release и source maps через Vercel
  webpack: {
    automaticVercelMonitors: true,
  },
})
