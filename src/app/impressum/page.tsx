import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Impressum | Soulmio',
  robots: { index: true, follow: true },
}

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-bg-primary px-5 py-10">
      <div className="mx-auto max-w-xl">

        {/* Назад */}
        <Link
          href="/settings"
          className="mb-8 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={15} />
          Zurück
        </Link>

        <h1 className="mb-6 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
          Impressum
        </h1>

        <div className="flex flex-col gap-6 text-sm text-text-primary">

          {/* § 5 DDG */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
              Angaben gemäß § 5 DDG
            </p>
            <p className="leading-relaxed">
              Vladimir Podgornyi<br />
              Warschauerstrasse 3<br />
              60327 Frankfurt am Main<br />
              Deutschland
            </p>
          </section>

          <Divider />

          {/* Kontakt */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
              Kontakt
            </p>
            <p className="leading-relaxed">
              E-Mail:{' '}
              <a
                href="mailto:soulmio.support@gmail.com"
                className="text-primary hover:underline"
              >
                soulmio.support@gmail.com
              </a>
            </p>
          </section>

          <Divider />

          {/* § 18 MStV */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </p>
            <p className="leading-relaxed">
              Vladimir Podgornyi<br />
              Warschauerstrasse 3<br />
              60327 Frankfurt am Main<br />
              Deutschland
            </p>
          </section>

          <Divider />

          {/* Haftungsausschluss */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
              Haftungsausschluss
            </p>
            <p className="leading-relaxed text-text-secondary">
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
              können wir jedoch keine Gewähr übernehmen.
            </p>
          </section>

        </div>

        <p className="mt-10 text-xs text-text-muted">
          © 2026 Soulmio
        </p>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-border" />
}
