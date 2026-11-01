import { addDays } from './dates'
import { TEMPLATES } from './templates'
import type { ISODate, Role, Task, WaitingItem } from './types'

export interface Plan {
  tasks: Task[]
  waiting: WaitingItem[]
}

/**
 * Builds a person's onboarding plan from their role template.
 * Tasks keep their offsets (not dates), so moving a start date moves every deadline.
 */
export function generatePlan(role: Role, startDate: ISODate, hireId: string): Plan {
  const template = TEMPLATES[role]
  const tasks: Task[] = []
  let order = 0
  for (const phase of template.phases) {
    phase.stops.forEach((stop, stopIndex) => {
      for (const t of stop.tasks) {
        tasks.push({
          ...t,
          steps: t.steps ? [...t.steps] : undefined,
          id: `${hireId}:${t.key}`,
          hireId,
          phase: phase.id,
          stop: stopIndex,
          order: order++,
        })
      }
    })
  }
  const waiting: WaitingItem[] = template.waiting.map((w) => ({
    id: `${hireId}:wait:${w.key}`,
    hireId,
    key: w.key,
    title: w.title,
    owner: w.owner,
    readyOn: addDays(startDate, w.readyOffset),
    since: startDate,
    autoReady: true,
    anchoredToStart: true,
    detail: w.detail,
    detailUnblocked: w.detailUnblocked,
    unblockedBy: w.unblockedBy,
  }))
  return { tasks, waiting }
}
