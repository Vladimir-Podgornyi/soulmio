'use client'

import { useTranslations } from 'next-intl'
import type { Person } from '@/entities/person/model/types'
import { useAddPerson } from '../model/useAddPerson'

const RELATIONS = ['partner', 'friend', 'family', 'other'] as const

interface AddPersonFormProps {
  onSuccess: (person: Person) => void
  onCancel: () => void
}

export function AddPersonForm({ onSuccess, onCancel }: AddPersonFormProps) {
  const t = useTranslations()
  const { form, isLoading, onSubmit } = useAddPerson(onSuccess)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = form

  const selectedRelation = watch('relation')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('people.name')}
        </label>
        <input
          {...register('name')}
          type="text"
          autoFocus
          placeholder="Anna"
          className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40"
        />
        {errors.name && (
          <span className="text-xs text-red-500">{errors.name.message}</span>
        )}
      </div>

      {/* Relation pills */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('people.relation')}
        </label>
        <div className="flex flex-wrap gap-2">
          {RELATIONS.map((rel) => (
            <button
              key={rel}
              type="button"
              onClick={() => setValue('relation', selectedRelation === rel ? null : rel)}
              className={`h-9 rounded-[20px] px-4 text-sm font-medium transition-colors ${
                selectedRelation === rel
                  ? 'bg-primary text-white'
                  : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {t(`people.relations.${rel}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('people.notes')}
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="..."
          className="rounded-xl bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-bg-input-focus focus:ring-1 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 flex-1 rounded-xl border border-border text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
