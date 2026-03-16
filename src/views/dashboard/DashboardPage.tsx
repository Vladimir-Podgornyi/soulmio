'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Profile } from '@/entities/user/model/types'
import type { Person } from '@/entities/person/model/types'
import { AddPersonWidget } from '@/widgets/add-person'

interface DashboardPageProps {
  profile: Profile
}

export function DashboardPage({ profile }: DashboardPageProps) {
  const t = useTranslations()
  const [people, setPeople] = useState<Person[]>([])

  function handlePersonAdded(person: Person) {
    setPeople((prev) => [person, ...prev])
  }

  const displayName = profile.full_name?.split(' ')[0] ?? profile.email ?? 'there'

  return (
    <div className="min-h-screen bg-s-bg-primary px-4 pt-14 pb-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-s-text-primary">
          {t('dashboard.greeting', { name: displayName })}
        </h1>
      </div>

      {/* People section */}
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-s-text-secondary">
          {t('dashboard.yourPeople')}
        </p>

        <div className="flex flex-col gap-2">
          {/* Existing people */}
          {people.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-4 rounded-[14px] bg-s-bg-card border border-s-border-card px-4 py-3 min-h-[60px]"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8735A] to-[#C94F38] text-sm font-bold text-white uppercase">
                {person.name.charAt(0)}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-semibold text-s-text-primary">
                  {person.name}
                </span>
                {person.relation && (
                  <span className="text-xs text-s-text-secondary capitalize">
                    {t(`people.relations.${person.relation}`)}
                  </span>
                )}
              </div>
              <span className="text-s-text-muted">›</span>
            </div>
          ))}

          {/* Add person widget */}
          <AddPersonWidget onPersonAdded={handlePersonAdded} />
        </div>
      </div>
    </div>
  )
}
