'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import type { Person } from '@/entities/person/model/types'
import { AddPersonForm } from '@/features/add-person'
import { ProLock } from '@/shared/ui'

interface AddPersonWidgetProps {
  isPro: boolean
  canAdd: boolean
  onPersonAdded?: (person: Person) => void
  compact?: boolean
}

export function AddPersonWidget({ isPro, canAdd, onPersonAdded, compact }: AddPersonWidgetProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  function handleSuccess(person: Person) {
    setIsOpen(false)
    onPersonAdded?.(person)
  }

  const triggerButton = compact ? (
    <button
      type="button"
      onClick={canAdd ? () => setIsOpen(true) : undefined}
      className="flex h-9 flex-shrink-0 items-center gap-1 rounded-[20px] px-3 text-sm font-medium bg-bg-input text-text-muted hover:bg-bg-hover transition-colors"
    >
      <Plus size={14} />
      <span>{t('people.addPerson')}</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={canAdd ? () => setIsOpen(true) : undefined}
      className="flex w-full items-center gap-4 rounded-[14px] bg-bg-card border border-dashed border-border p-4 text-left transition-colors hover:bg-bg-hover min-h-[60px]"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bg-input text-text-muted overflow-hidden">
        <Plus size={18} />
      </div>
      <span className="text-sm font-medium text-text-secondary">
        {t('people.addPerson')}
      </span>
    </button>
  )

  return (
    <>
      {/* Кнопка-триггер — ProLock когда лимит исчерпан */}
      {canAdd ? triggerButton : (
        <ProLock feature="people" profile={{ subscription_tier: 'free' }}>
          {triggerButton}
        </ProLock>
      )}

      {/* Оверлей модального окна */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-[80px] md:p-6">
          {/* Фон */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
          />

          {/* Лист */}
          <div className="sheet-animate relative z-10 w-full max-w-md rounded-[28px] bg-bg-secondary flex flex-col max-h-[calc(100dvh-96px)] md:max-h-[85dvh]">
            <div className="flex items-center justify-between px-6 pt-6 pb-5 flex-shrink-0">
              <h2 className="text-lg font-semibold tracking-[-0.5px] text-text-primary">
                {t('people.addPerson')}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-primary hover:bg-primary/10"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-6 pb-6">
              <AddPersonForm
                isPro={isPro}
                onSuccess={handleSuccess}
                onCancel={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
