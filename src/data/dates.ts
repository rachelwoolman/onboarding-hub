import type { ISODate } from './types'

const DAY_MS = 86_400_000
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string' || !ISO_RE.test(value)) return false
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

function toUTC(date: ISODate): number {
  return Date.parse(`${date}T00:00:00Z`)
}

function fromUTC(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Local calendar date of a real Date, as ISO. */
export function toISODate(d: Date): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUTC(toUTC(date) + days * DAY_MS)
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS)
}

export function dueDate(startDate: ISODate, offset: number): ISODate {
  return addDays(startDate, offset)
}

export function weekday(date: ISODate): string {
  return WEEKDAYS[new Date(toUTC(date)).getUTCDay()]
}

/** First Monday strictly after `date`. */
export function nextMonday(date: ISODate): ISODate {
  const dow = new Date(toUTC(date)).getUTCDay()
  const ahead = ((8 - dow) % 7) || 7
  return addDays(date, ahead)
}

/**
 * Human label for a date relative to today: "today", "tomorrow", "yesterday",
 * a weekday within the surrounding week, otherwise "in N days" / "N days ago".
 */
export function dayLabel(date: ISODate, today: ISODate): string {
  const diff = daysBetween(today, date)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  if (Math.abs(diff) <= 6) return weekday(date)
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`
}
