import { formatPhone } from './validation'
import type { Task } from './types'

const str = (v: unknown) => (typeof v === 'string' ? v : '')

/** One quiet line describing what a completed task saved. Never shows sensitive digits. */
export function taskSummary(task: Task): string | null {
  const d = task.data
  if (!d) return null
  if (task.kind === 'handoff') {
    const at = str(d.finishedAt)
    return at ? 'Finished in the secure HR portal' : null
  }
  switch (task.key) {
    case 'confirm-details': {
      const name = str(d.preferredName) || `${str(d.firstName)} ${str(d.lastName)}`.trim()
      return [name, formatPhone(str(d.phone))].filter(Boolean).join(' · ')
    }
    case 'dev-tools':
    case 'design-tools': {
      // "GitHub, Jira": labels of what she asked for.
      const picked = Array.isArray(d.tools) ? d.tools : []
      const labels = picked.map((v) => task.choices?.find((c) => c.value === v)?.label ?? v)
      return labels.length ? labels.join(', ') : null
    }
    default:
      return null
  }
}
