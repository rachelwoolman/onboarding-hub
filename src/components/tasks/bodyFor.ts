import type { Task } from '../../data/types'
import { HandoffBody } from './HandoffBody'
import { ContactBody, ReadBody, RequestBody, SimpleBody, StepsBody } from './TaskBodies'

/** Picks the in-place body for a task by its kind (forms by key). */
export function bodyFor(task: Task) {
  switch (task.kind) {
    case 'form':
      return task.key === 'confirm-details' ? ContactBody : SimpleBody
    case 'steps':
      return StepsBody
    case 'read':
      return ReadBody
    case 'request':
      return RequestBody
    case 'handoff':
      return HandoffBody
    default:
      return SimpleBody
  }
}
