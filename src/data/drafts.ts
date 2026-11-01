import type { TaskData } from './types'

/** Unsent form drafts, one localStorage entry per task, so a refresh keeps what was typed. */
const PREFIX = 'bp-start:draft:'

export function loadDraft(taskId: string): TaskData | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + taskId)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as TaskData) : null
  } catch {
    return null
  }
}

export function saveDraft(taskId: string, data: TaskData): void {
  try {
    window.localStorage.setItem(PREFIX + taskId, JSON.stringify(data))
  } catch {
    // Non-fatal: the form still works, it just won't survive a refresh.
  }
}

export function clearDraft(taskId: string): void {
  try {
    window.localStorage.removeItem(PREFIX + taskId)
  } catch {
    // ignore
  }
}

export function clearAllDrafts(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k?.startsWith(PREFIX)) keys.push(k)
    }
    keys.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    // ignore
  }
}
