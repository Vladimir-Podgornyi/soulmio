'use client'

import { useEffect, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface TimePickerProps {
  value: string          // "HH:MM"  (never empty when rendered)
  onChange: (value: string) => void
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function parseTime(value: string): { h: number; m: number } {
  const [h, m] = value.split(':').map(Number)
  return { h: isNaN(h) ? 12 : h, m: isNaN(m) ? 0 : m }
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const { h, m } = parseTime(value)

  function setH(next: number) {
    const clamped = ((next % 24) + 24) % 24
    onChange(`${pad(clamped)}:${pad(m)}`)
  }

  function setM(next: number) {
    const step = 5
    const snapped = Math.round(next / step) * step
    const clamped = ((snapped % 60) + 60) % 60
    onChange(`${pad(h)}:${pad(clamped)}`)
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <SpinnerColumn
        displayValue={pad(h)}
        max={23}
        onIncrement={() => setH(h + 1)}
        onDecrement={() => setH(h - 1)}
        onChangeRaw={(v) => onChange(`${pad(v)}:${pad(m)}`)}
      />
      <span className="text-lg font-bold text-text-secondary select-none">:</span>
      <SpinnerColumn
        displayValue={pad(m)}
        max={59}
        onIncrement={() => setM(m + 5)}
        onDecrement={() => setM(m - 5)}
        onChangeRaw={(v) => onChange(`${pad(h)}:${pad(v)}`)}
      />
    </div>
  )
}

interface SpinnerColumnProps {
  displayValue: string
  max: number
  onIncrement: () => void
  onDecrement: () => void
  onChangeRaw: (v: number) => void
}

function SpinnerColumn({ displayValue, max, onIncrement, onDecrement, onChangeRaw }: SpinnerColumnProps) {
  const [draft, setDraft] = useState(displayValue)

  // Sync when external value changes (e.g. from arrow buttons)
  useEffect(() => {
    setDraft(displayValue)
  }, [displayValue])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
    setDraft(raw)
    if (raw.length > 0) {
      const num = parseInt(raw, 10)
      if (!isNaN(num) && num <= max) onChangeRaw(num)
    }
  }

  function handleBlur() {
    const num = parseInt(draft, 10)
    const clamped = isNaN(num) ? 0 : Math.min(Math.max(num, 0), max)
    onChangeRaw(clamped)
    setDraft(pad(clamped))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') { e.preventDefault(); onIncrement() }
    if (e.key === 'ArrowDown') { e.preventDefault(); onDecrement() }
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onIncrement}
        className="flex h-7 w-14 items-center justify-center rounded-lg bg-bg-hover text-text-muted hover:bg-bg-input hover:text-text-primary transition-colors"
      >
        <ChevronUp size={16} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={(e) => e.target.select()}
        maxLength={2}
        className="flex h-11 w-14 items-center justify-center rounded-xl bg-bg-card text-xl font-bold tracking-[-0.5px] text-text-primary tabular-nums text-center outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
      />

      <button
        type="button"
        onClick={onDecrement}
        className="flex h-7 w-14 items-center justify-center rounded-lg bg-bg-hover text-text-muted hover:bg-bg-input hover:text-text-primary transition-colors"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  )
}
