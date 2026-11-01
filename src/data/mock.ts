import { addDays, nextMonday, toISODate } from './dates'
import { generatePlan } from './plan'
import type { AppState, Hire, ISODate, Task, WaitingItem } from './types'

/**
 * Demo seed. Chloe starts on the next Monday after the real date, and the demo clock
 * ("today") is the Friday evening before, matching the story. Everything else is
 * relative to those two dates, so the demo works on any day it is opened.
 */
export function createSeed(realToday: ISODate = toISODate(new Date())): AppState {
  const chloeStart = nextMonday(realToday)
  const today = addDays(chloeStart, -3)

  const hires: Hire[] = [
    {
      id: 'chloe',
      name: 'Chloe Zhang',
      firstName: 'Chloe',
      title: 'Software engineer',
      role: 'Engineering',
      startDate: chloeStart,
      managerName: 'Mateo',
      // Fake details "on file from HR" (555-01xx numbers and example.com are reserved for fiction).
      onFile: { firstName: 'Chloe', lastName: 'Zhang', phone: '(555) 010-1234', email: 'chloe.zhang@example.com' },
    },
    {
      id: 'priya',
      name: 'Priya Nair',
      firstName: 'Priya',
      title: 'Senior engineer',
      role: 'Engineering',
      startDate: addDays(today, -3),
      managerName: 'Mateo',
      onFile: { firstName: 'Priya', lastName: 'Nair', phone: '(555) 010-2468', email: 'priya.nair@example.com' },
    },
    {
      id: 'jordan',
      name: 'Jordan Lee',
      firstName: 'Jordan',
      title: 'Product engineer',
      role: 'Engineering',
      startDate: addDays(today, 2),
      managerName: 'Mateo',
      onFile: { firstName: 'Jordan', lastName: 'Lee', phone: '(555) 010-1357', email: 'jordan.lee@example.com' },
    },
  ]

  const tasks: Task[] = []
  const waiting: WaitingItem[] = []
  const stamp = `${today}T18:00:00.000Z`

  for (const hire of hires) {
    const plan = generatePlan(hire.role, hire.startDate, hire.id)
    tasks.push(...plan.tasks)
    waiting.push(...plan.waiting)
  }

  const markDone = (hireId: string, keys: string[]) => {
    for (const t of tasks) {
      if (t.hireId === hireId && keys.includes(t.key)) t.doneAt = stamp
    }
  }

  // Chloe: nothing done yet; she opens the page fresh.

  // Priya: all of pre-start and day 1 (10 of 18 = 56%), now blocked on GitHub access from IT.
  const priyaDone = tasks
    .filter((t) => t.hireId === 'priya' && (t.phase === 'preStart' || t.phase === 'day1'))
    .map((t) => t.key)
  markDone('priya', priyaDone)
  const priya = hires[1]
  waiting.splice(
    waiting.findIndex((w) => w.hireId === 'priya' && w.key === 'accounts'),
    1,
  )
  waiting.push({
    id: 'priya:wait:github',
    hireId: 'priya',
    key: 'github',
    title: 'GitHub access',
    owner: 'IT',
    since: priya.startDate,
    readyOn: addDays(priya.startDate, 1),
    autoReady: false,
    detail: 'IT is adding you to the BrightPath GitHub org.',
  })

  // Jordan: nothing yet.

  return {
    version: 1,
    today,
    primaryHireId: 'chloe',
    view: 'hire',
    hires,
    tasks,
    waiting,
    requests: [],
  }
}
