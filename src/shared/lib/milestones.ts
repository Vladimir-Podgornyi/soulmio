export interface MilestoneMatch {
  labelKey: string
  labelParams: Record<string, number>
}

export interface RelationStats {
  totalDays: number
  weeks: number
  months: number
  years: number
}

// Day-based milestones (round significant numbers)
const DAY_MILESTONES = [100, 200, 300, 500, 700, 1000, 1500, 2000, 2500, 3000]

// Month-based milestones: 6m, 1yr, 1.5yr, 2yr, 2.5yr, 3yr, 4yr, 5yr, 7yr, 10yr
const MONTH_MILESTONES = [6, 12, 18, 24, 30, 36, 48, 60, 84, 120]

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDaysToDate(startDateStr: string, n: number): string {
  const d = new Date(startDateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

function addMonthsToDate(startDateStr: string, n: number): string {
  const d = new Date(startDateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + n)
  return toDateStr(d)
}

export function getRelationStats(startDateStr: string): RelationStats {
  const start = new Date(startDateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const totalDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  return {
    totalDays,
    weeks: Math.floor(totalDays / 7),
    months: Math.floor(totalDays / 30.44),
    years: Math.floor(totalDays / 365.25),
  }
}

/**
 * Returns the milestone that falls on today for the given start date,
 * or null if today is not a milestone day.
 */
/**
 * Returns compact relation duration: "2 years 3 months" / "5 months" / "23 days"
 * Uses plain numbers — caller inserts the translated unit labels.
 */
export function getRelationDuration(startDateStr: string): { value: number; unit: 'years' | 'months' | 'days'; secondary?: number } {
  const stats = getRelationStats(startDateStr)
  if (stats.years >= 1) {
    const remainMonths = stats.months - stats.years * 12
    return { value: stats.years, unit: 'years', secondary: remainMonths > 0 ? remainMonths : undefined }
  }
  if (stats.months >= 1) {
    return { value: stats.months, unit: 'months' }
  }
  return { value: stats.totalDays, unit: 'days' }
}

export function getMilestoneToday(startDateStr: string): MilestoneMatch | null {
  const today = toDateStr(new Date())

  // Calendar-based milestones first (more meaningful)
  for (const m of MONTH_MILESTONES) {
    if (addMonthsToDate(startDateStr, m) === today) {
      if (m % 12 === 0) {
        return { labelKey: 'milestones.yearMilestone', labelParams: { years: m / 12 } }
      }
      return { labelKey: 'milestones.monthMilestone', labelParams: { months: m } }
    }
  }

  // Day-based milestones
  for (const d of DAY_MILESTONES) {
    if (addDaysToDate(startDateStr, d) === today) {
      return { labelKey: 'milestones.dayMilestone', labelParams: { days: d } }
    }
  }

  return null
}
