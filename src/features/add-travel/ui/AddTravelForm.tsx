'use client'
import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { MapPin, Bell, Plus, Minus, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Item } from '@/entities/item/model/types'
import {
  useAddTravel,
  getTravelCity,
  getTravelCountry,
  getTravelDate,
  getTravelBudget,
  getTravelPinned,
} from '../model/useAddTravel'
import { getFlagEmoji, searchCountries } from '../model/countries'
import type { TravelFormValues, TravelBudget } from '../model/useAddTravel'

interface AddTravelFormProps {
  personId: string
  categoryId: string
  item?: Item
  isPro: boolean
  onSuccess: (item: Item) => void
  onCancel: () => void
}

interface BudgetSectionProps {
  title: string
  budget: TravelBudget
  onChange: (b: TravelBudget) => void
}

function BudgetSection({ title, budget, onChange }: BudgetSectionProps) {
  const t = useTranslations()
  const fields: Array<{ key: keyof TravelBudget; label: string }> = [
    { key: 'hotel', label: t('travel.budgetHotel') },
    { key: 'transport', label: t('travel.budgetTransport') },
    { key: 'onsite', label: t('travel.budgetOnsite') },
    { key: 'other', label: t('travel.budgetOther') },
  ]
  const total = [budget.hotel, budget.transport, budget.onsite, budget.other]
    .filter((v): v is number => v !== null)
    .reduce((s, v) => s + v, 0)
  const hasTotal = [budget.hotel, budget.transport, budget.onsite, budget.other].some(
    (v) => v !== null
  )

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-bg-input px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
        {title}
      </p>
      {fields.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <span className="text-sm text-text-secondary flex-1">{label}</span>
          <input
            type="number"
            min="0"
            value={budget[key] ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value)
              onChange({ ...budget, [key]: val })
            }}
            placeholder="0"
            className="w-28 h-9 rounded-xl bg-bg-secondary px-3 text-sm text-text-primary text-right placeholder:text-text-muted outline-none transition-colors focus:ring-1 focus:ring-primary/40"
          />
        </div>
      ))}
      {hasTotal && (
        <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
          <span className="text-sm font-semibold text-text-primary">{t('travel.budgetTotal')}</span>
          <span className="text-sm font-semibold text-primary">{total.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

export function AddTravelForm({
  personId,
  categoryId,
  item,
  isPro,
  onSuccess,
  onCancel,
}: AddTravelFormProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isEdit = !!item
  const { isSaving, saveTravel, editTravel } = useAddTravel(personId, categoryId, onSuccess)

  const existingCountry = getTravelCountry(item?.tags ?? null)
  const existingBudget = getTravelBudget(item?.tags ?? null)

  const [city, setCity] = useState(getTravelCity(item?.tags ?? null))
  const [country, setCountry] = useState(existingCountry.name)
  const [countryCode, setCountryCode] = useState(existingCountry.code)
  const [countrySearch, setCountrySearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [sentiment, setSentiment] = useState<'wants' | 'visited'>(
    (item?.sentiment as 'wants' | 'visited' | null) ?? 'wants'
  )
  const [tripDate, setTripDate] = useState(getTravelDate(item?.tags ?? null))
  const [comment, setComment] = useState(item?.description ?? '')
  const [pinned] = useState(getTravelPinned(item?.tags ?? null))

  const hasPlanInit =
    existingBudget.plan.hotel !== null ||
    existingBudget.plan.transport !== null ||
    existingBudget.plan.onsite !== null ||
    existingBudget.plan.other !== null
  const hasActualInit =
    existingBudget.actual.hotel !== null ||
    existingBudget.actual.transport !== null ||
    existingBudget.actual.onsite !== null ||
    existingBudget.actual.other !== null

  const [hasPlanBudget, setHasPlanBudget] = useState(hasPlanInit)
  const [planBudget, setPlanBudget] = useState<TravelBudget>(existingBudget.plan)
  const [hasActualBudget, setHasActualBudget] = useState(hasActualInit)
  const [actualBudget, setActualBudget] = useState<TravelBudget>(existingBudget.actual)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const suggestions = countrySearch.length >= 3 ? searchCountries(countrySearch, locale) : []

  useEffect(() => {
    if (!showDropdown) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDropdown])

  function selectCountry(c: { code: string; en: string; de: string; ru: string }) {
    const name = locale === 'ru' ? c.ru : locale === 'de' ? c.de : c.en
    setCountry(name)
    setCountryCode(c.code)
    setCountrySearch('')
    setShowDropdown(false)
  }

  function clearCountry() {
    setCountry('')
    setCountryCode('')
    setCountrySearch('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!city.trim() && !country.trim()) {
      toast.error(t('travel.cityOrCountryRequired'))
      return
    }
    const values: TravelFormValues = {
      city,
      country,
      countryCode,
      sentiment,
      tripDate: sentiment === 'wants' && isPro ? tripDate : '',
      comment,
      pinned,
      hasPlanBudget,
      planBudget,
      hasActualBudget,
      actualBudget,
    }
    try {
      if (isEdit) {
        await editTravel(item.id, values)
        toast.success(t('travel.updated'))
      } else {
        await saveTravel(values)
        toast.success(t('travel.added'))
      }
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Город */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('travel.city')}
        </label>
        <div className="relative">
          <MapPin
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('travel.cityPlaceholder')}
            className="h-11 w-full rounded-xl bg-bg-input pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:ring-1 focus:ring-primary/40"
            autoFocus={!isEdit}
          />
        </div>
      </div>

      {/* Страна */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('travel.country')}
        </label>
        {country ? (
          <div className="flex items-center gap-2 h-11 rounded-xl bg-bg-input px-4">
            <span className="text-xl">{getFlagEmoji(countryCode)}</span>
            <span className="flex-1 text-sm text-text-primary">{country}</span>
            <button
              type="button"
              onClick={clearCountry}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={t('travel.countryPlaceholder')}
              className="h-11 w-full rounded-xl bg-bg-input px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:ring-1 focus:ring-primary/40"
            />
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-12 left-0 right-0 z-30 rounded-xl bg-bg-secondary border border-border-card shadow-lg overflow-hidden">
                {suggestions.map((c) => {
                  const name = locale === 'ru' ? c.ru : locale === 'de' ? c.de : c.en
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => selectCountry(c)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-hover transition-colors"
                    >
                      <span className="text-lg">{getFlagEmoji(c.code)}</span>
                      <span>{name}</span>
                    </button>
                  )
                })}
              </div>
            )}
            {countrySearch.length > 0 && countrySearch.length < 3 && (
              <p className="mt-1 text-[11px] text-text-muted">{t('travel.countrySearchHint')}</p>
            )}
          </div>
        )}
      </div>

      {/* Статус */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('travel.status')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSentiment('wants')}
            className={`h-9 flex-1 rounded-[20px] px-3 text-[13px] font-medium transition-colors ${
              sentiment === 'wants'
                ? 'bg-wants-bg text-wants'
                : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
            }`}
          >
            ✈️ {t('travel.statusWants')}
          </button>
          <button
            type="button"
            onClick={() => setSentiment('visited')}
            className={`h-9 flex-1 rounded-[20px] px-3 text-[13px] font-medium transition-colors ${
              sentiment === 'visited'
                ? 'bg-loves-bg text-loves'
                : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
            }`}
          >
            ✅ {t('travel.statusVisited')}
          </button>
        </div>
      </div>

      {/* Дата поездки — только для "хочет посетить", Pro */}
      {sentiment === 'wants' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            {t('travel.tripDate')}
            {!isPro && (
              <span className="ml-1.5 rounded-[4px] bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent font-semibold">
                Pro
              </span>
            )}
          </label>
          {isPro ? (
            <>
              <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="h-11 rounded-xl bg-bg-input px-4 text-sm text-text-primary outline-none transition-colors focus:ring-1 focus:ring-primary/40 [color-scheme:dark]"
              />
              {tripDate && (
                <p className="flex items-center gap-1 text-[11px] text-text-muted">
                  <Bell size={11} />
                  {t('travel.tripDateHint')}
                </p>
              )}
            </>
          ) : (
            <div className="h-11 rounded-xl bg-bg-input/40 px-4 flex items-center">
              <p className="text-[13px] text-text-muted">{t('travel.tripDateProHint')}</p>
            </div>
          )}
        </div>
      )}

      {/* Комментарий */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {t('travel.comment')}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder={t('travel.commentPlaceholder')}
          className="rounded-xl bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:ring-1 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* Плановый бюджет — только для "хочет посетить" */}
      {sentiment === 'wants' &&
        (hasPlanBudget ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                {t('travel.planBudget')}
              </label>
              <button
                type="button"
                onClick={() => setHasPlanBudget(false)}
                className="text-text-muted hover:text-text-secondary"
              >
                <Minus size={14} />
              </button>
            </div>
            <BudgetSection
              title={t('travel.planBudget')}
              budget={planBudget}
              onChange={setPlanBudget}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setHasPlanBudget(true)}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
          >
            <Plus size={15} />
            {t('travel.addPlanBudget')}
          </button>
        ))}

      {/* Фактические расходы — только для "был(а)" */}
      {sentiment === 'visited' &&
        (hasActualBudget ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                {t('travel.actualBudget')}
              </label>
              <button
                type="button"
                onClick={() => setHasActualBudget(false)}
                className="text-text-muted hover:text-text-secondary"
              >
                <Minus size={14} />
              </button>
            </div>
            <BudgetSection
              title={t('travel.actualBudget')}
              budget={actualBudget}
              onChange={setActualBudget}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setHasActualBudget(true)}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
          >
            <Plus size={15} />
            {t('travel.addActualBudget')}
          </button>
        ))}

      {/* Кнопки */}
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
          disabled={isSaving || (!city.trim() && !country.trim())}
          className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {isSaving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
