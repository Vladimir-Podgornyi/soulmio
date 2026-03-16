'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Person } from '@/entities/person/model/types'
import { AddPersonForm } from '@/features/add-person'

interface AddPersonWidgetProps {
  onPersonAdded?: (person: Person) => void
}

export function AddPersonWidget({ onPersonAdded }: AddPersonWidgetProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)

  function handleSuccess(person: Person) {
    setIsOpen(false)
    onPersonAdded?.(person)
  }

  return (
    <>
      {/* Trigger card */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-4 rounded-[14px] bg-s-bg-card border border-dashed border-s-border p-4 text-left transition-colors hover:bg-s-bg-hover min-h-[60px]"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-s-bg-input text-xl text-s-text-muted">
          +
        </div>
        <span className="text-sm font-medium text-s-text-secondary">
          {t('people.addPerson')}
        </span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
          />

          {/* Sheet */}
          <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-s-bg-secondary p-6 pb-safe">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-[-0.5px] text-s-text-primary">
                {t('people.addPerson')}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-s-bg-input text-s-text-muted hover:bg-s-bg-hover"
              >
                ✕
              </button>
            </div>

            <AddPersonForm
              onSuccess={handleSuccess}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
