import { formatPhone } from './validation'
import type { Task } from './types'

const str = (v: unknown) => (typeof v === 'string' ? v : '')

/** One quiet line describing what a completed task saved. Never shows sensitive digits. */
export function taskSummary(task: Task): string | null {
  const d = task.data
  if (!d) return null
  switch (task.key) {
    case 'confirm-details': {
      const name = str(d.preferredName) || `${str(d.firstName)} ${str(d.lastName)}`.trim()
      return [name, formatPhone(str(d.phone))].filter(Boolean).join(' · ')
    }
    case 'i9-w4':
      return 'Section 1 and W-4 submitted'
    case 'direct-deposit':
      return depositMask(task)
    case 'repo-access': {
      const repos = Array.isArray(d.repos) ? d.repos.length : 0
      return `@${str(d.githubUsername)} · ${repos} repo${repos === 1 ? '' : 's'}`
    }
    default:
      return null
  }
}

/** "Checking ····4321" */
export function depositMask(task: Task): string | null {
  const d = task.data
  if (!d || !str(d.accountLast4)) return null
  const type = str(d.accountType) === 'savings' ? 'Savings' : 'Checking'
  return `${type} ····${str(d.accountLast4)}`
}
