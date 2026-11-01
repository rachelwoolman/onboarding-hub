import { isISODate } from './dates'
import { createSeed } from './mock'
import type { AppState } from './types'

/** v3: I-9/W-4 and direct deposit became portal handoffs. Older saves start fresh. */
export const STORAGE_KEY = 'bp-start:v3'

/** Shape check: anything that doesn't look like our state is treated as corrupt. */
export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const s = value as Record<string, unknown>
  if (s.version !== 1 || !isISODate(s.today) || typeof s.primaryHireId !== 'string') return false
  if (s.view !== 'hire' && s.view !== 'manager') return false
  for (const key of ['hires', 'tasks', 'waiting', 'requests']) {
    if (!Array.isArray(s[key])) return false
  }
  const hires = s.hires as Record<string, unknown>[]
  if (!hires.every((h) => h && typeof h.id === 'string' && isISODate(h.startDate))) return false
  const tasks = s.tasks as Record<string, unknown>[]
  return tasks.every(
    (t) => t && typeof t.id === 'string' && typeof t.hireId === 'string' && typeof t.minutes === 'number',
  )
}

export function parseState(raw: string | null): AppState | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isAppState(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Reads saved state; on missing or corrupt data, returns a fresh seed. */
export function loadState(): AppState {
  try {
    const saved = parseState(window.localStorage.getItem(STORAGE_KEY))
    if (saved) return saved
  } catch {
    // Storage blocked (private mode, sandbox): fall through to a fresh seed.
  }
  return createSeed()
}

export function saveState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Non-fatal: the demo still works in memory.
  }
}
