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
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-s-text-secondary">
          {t('people.name')}
        </label>
        <input
          {...register('name')}
          type="text"
          autoFocus
          placeholder="Anna"
          className="h-11 rounded-xl bg-s-bg-input px-4 text-sm text-s-text-primary placeholder:text-s-text-muted outline-none transition-colors focus:bg-s-bg-input-focus focus:ring-1 focus:ring-s-primary/40"
        />
        {errors.name && (
          <span className="text-xs text-red-500">{errors.name.message}</span>
        )}
      </div>

      {/* Relation pills */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-s-text-secondary">
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
                  ? 'bg-s-primary text-white'
                  : 'bg-s-bg-input text-s-text-secondary hover:bg-s-bg-hover'
              }`}
            >
              {t(`people.relations.${rel}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-s-text-secondary">
          {t('people.notes')}
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="..."
          className="rounded-xl bg-s-bg-input px-4 py-3 text-sm text-s-text-primary placeholder:text-s-text-muted outline-none transition-colors focus:bg-s-bg-input-focus focus:ring-1 focus:ring-s-primary/40 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 flex-1 rounded-xl border border-s-border text-sm font-medium text-s-text-secondary transition-colors hover:bg-s-bg-hover"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="h-11 flex-1 rounded-xl bg-s-primary text-sm font-semibold text-white transition-colors hover:bg-s-primary-dark disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
