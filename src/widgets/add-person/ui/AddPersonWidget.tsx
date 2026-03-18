'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import type { Person } from '@/entities/person/model/types'
import { AddPersonForm } from '@/features/add-person'

interface AddPersonWidgetProps {
  isPro: boolean
  canAdd: boolean
  onPersonAdded?: (person: Person) => void
}

export function AddPersonWidget({ isPro, canAdd, onPersonAdded }: AddPersonWidgetProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  function handleSuccess(person: Person) {
    setIsOpen(false)
    onPersonAdded?.(person)
  }

  function handleTriggerClick() {
    if (canAdd) {
      setIsOpen(true)
    } else {
      setShowPaywall((v) => !v)
    }
  }

  return (
    <>
      {/* Карточка-триггер */}
      <button
        type="button"
        onClick={handleTriggerClick}
        className="flex w-full items-center gap-4 rounded-[14px] bg-bg-card border border-dashed border-border p-4 text-left transition-colors hover:bg-bg-hover min-h-[60px]"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bg-input text-text-muted overflow-hidden">
          <Plus size={18} />
        </div>
        <span className="text-sm font-medium text-text-secondary">
          {t('people.addPerson')}
        </span>
      </button>

      {/* Сообщение пейволла */}
      {showPaywall && !canAdd && (
        <div className="flex flex-col gap-2 rounded-[14px] border border-primary/30 bg-primary/5 px-4 py-3.5">
          <p className="text-sm text-text-primary">{t('paywall.personLimit')}</p>
          <button
            type="button"
            className="self-start rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            {t('paywall.upgradeToPro')}
          </button>
        </div>
      )}

      {/* Оверлей модального окна */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Фон */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
          />

          {/* Лист */}
          <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-bg-secondary p-6 pb-safe">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-[-0.5px] text-text-primary">
                {t('people.addPerson')}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover"
              >
                ✕
              </button>
            </div>

            <AddPersonForm
              isPro={isPro}
              onSuccess={handleSuccess}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
