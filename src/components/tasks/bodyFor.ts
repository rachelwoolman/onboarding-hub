import type { Task } from '../../data/types'
import { ContactBody, DepositBody, I9W4Body, ReadBody, RequestBody, SimpleBody, StepsBody } from './TaskBodies'

/** Picks the in-place body for a task: specific forms by key, otherwise by kind. */
export function bodyFor(task: Task) {
  switch (task.key) {
    case 'confirm-details':
      return ContactBody
    case 'i9-w4':
      return I9W4Body
    case 'direct-deposit':
      return DepositBody
  }
  switch (task.kind) {
    case 'steps':
      return StepsBody
    case 'read':
      return ReadBody
    case 'request':
      return RequestBody
    default:
      return SimpleBody
  }
}
