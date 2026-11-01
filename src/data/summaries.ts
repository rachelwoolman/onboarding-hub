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
    case 'repo-access': {
      const repos = Array.isArray(d.repos) ? d.repos.length : 0
      return `@${str(d.githubUsername)} · ${repos} repo${repos === 1 ? '' : 's'}`
    }
    default:
      return null
  }
}
