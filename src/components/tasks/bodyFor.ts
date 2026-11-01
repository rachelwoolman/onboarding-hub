import type { Task } from '../../data/types'
import { HandoffBody } from './HandoffBody'
import { SanityCheckBody } from './SanityCheckBody'
import { ContactBody, RequestBody, SimpleBody, StepsBody } from './TaskBodies'

/** Picks the in-place body for a task by its kind (forms by key). */
export function bodyFor(task: Task) {
  switch (task.kind) {
    case 'form':
      return task.key === 'confirm-details' ? ContactBody : SimpleBody
    case 'steps':
      return task.key === 'monday-check' ? SanityCheckBody : StepsBody
    case 'request':
      return RequestBody
    case 'handoff':
      return HandoffBody
    default:
      return SimpleBody
  }
}
