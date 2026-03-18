'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Person } from '@/entities/person/model/types'
import { AddPersonWidget } from '@/widgets/add-person'

interface PeoplePageProps {
  initialPeople: Person[]
}

export function PeoplePage({ initialPeople }: PeoplePageProps) {
  const t = useTranslations()
  const [people, setPeople] = useState<Person[]>(initialPeople)

  function handlePersonAdded(person: Person) {
    setPeople((prev) => [person, ...prev])
  }

  return (
    <div className="min-h-screen bg-bg-primary px-4 pt-14 pb-8">
      <h1 className="mb-6 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
        {t('people.title')}
      </h1>

      <div className="flex flex-col gap-2">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/people/${person.id}`}
            className="flex items-center gap-4 rounded-[14px] bg-bg-card border border-border-card px-4 py-3 min-h-[60px] transition-colors hover:bg-bg-hover"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8735A] to-[#C94F38] text-sm font-bold text-white uppercase">
              {person.name.charAt(0)}
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-semibold text-text-primary">
                {person.name}
              </span>
              {person.relation && (
                <span className="text-xs text-text-secondary capitalize">
                  {t(`people.relations.${person.relation}`)}
                </span>
              )}
            </div>
            <span className="text-text-muted">›</span>
          </Link>
        ))}

        <AddPersonWidget onPersonAdded={handlePersonAdded} />
      </div>
    </div>
  )
}
