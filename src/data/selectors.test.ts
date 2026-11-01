import { describe, expect, it } from 'vitest'
import { addDays, dayLabel, daysBetween, nextMonday, weekday } from './dates'
import { createSeed } from './mock'
import { generatePlan } from './plan'
import { reducer } from './reducer'
import {
  getCurrentPhase,
  getCurrentStop,
  getFocusTask,
  getStops,
  hirePageState,
  hireStatus,
  isOverdue,
  minutesLeft,
  needsAttention,
  phaseCounts,
  plantStage,
  progressPercent,
  stageForPercent,
  taskDue,
  waitingFor,
  dueDay,
  gardenOrder,
  gardenStatusLine,
  pendingApprovals,
  startLabel,
  activeRequest,
  comingUp,
} from './selectors'
import { parseState } from './storage'
import { email, phone } from './validation'
import { taskSummary } from './summaries'
import type { AppState } from './types'

// A Sunday, like the day this was written. Chloe starts the next day (Monday).
const REAL_TODAY = '2026-11-01'
const seed = () => createSeed(REAL_TODAY)
const C = 'chloe'

function completeKeys(state: AppState, hireId: string, keys: string[]): AppState {
  return keys.reduce((s, key) => {
    const id = `${hireId}:${key}`
    const task = s.tasks.find((t) => t.id === id)
    // Steps tasks need every step checked first, like in the UI.
    if (task?.kind === 'steps' && !task.doneAt) {
      task.steps?.forEach((_, i) => {
        if (!s.tasks.find((t) => t.id === id)?.stepsDone?.includes(i))
          s = reducer(s, { type: 'toggleStep', taskId: id, step: i })
      })
    }
    return reducer(s, { type: 'completeTask', taskId: id, at: 'x' })
  }, state)
}

const PRE_START_OPEN = ['confirm-details', 'i9-w4', 'slack-invite', 'dev-tools']

describe('dates', () => {
  it('does whole-day math across month ends and DST', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
    expect(daysBetween('2026-11-06', '2026-11-09')).toBe(3)
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2) // US DST change
  })
  it('finds the next Monday strictly after a date', () => {
    expect(nextMonday('2026-11-01')).toBe('2026-11-02') // Sunday
    expect(nextMonday('2026-11-02')).toBe('2026-11-09') // Monday -> next week
    expect(weekday('2026-11-02')).toBe('Monday')
  })
  it('labels days relative to today', () => {
    expect(dayLabel('2026-10-30', '2026-10-30')).toBe('today')
    expect(dayLabel('2026-11-01', '2026-10-30')).toBe('Sunday')
    expect(dayLabel('2026-10-31', '2026-11-02')).toBe('Saturday')
  })
})

describe('seed', () => {
  it('puts the demo clock on the Friday before a Monday start', () => {
    const s = seed()
    const chloe = s.hires.find((h) => h.id === C)!
    expect(weekday(chloe.startDate)).toBe('Monday')
    expect(weekday(s.today)).toBe('Friday')
    expect(daysBetween(s.today, chloe.startDate)).toBe(3)
  })
})

describe('Chloe before day 1', () => {
  it('starts at 0 of 4 done, 27 minutes, 0%, seed', () => {
    const s = seed()
    expect(phaseCounts(s, C)).toEqual({ done: 0, total: 4 })
    expect(minutesLeft(s, C)).toBe(27)
    expect(progressPercent(s, C)).toBe(0)
    expect(plantStage(s, C)).toBe('seed')
  })

  it('focuses the task that unblocks IT first, then earliest due, then stop order', () => {
    let s = seed()
    expect(getFocusTask(s, C)?.key).toBe('confirm-details')
    expect(getCurrentStop(s, C)).toBe(0)
    s = completeKeys(s, C, ['confirm-details'])
    expect(minutesLeft(s, C)).toBe(25)
    expect(getFocusTask(s, C)?.key).toBe('i9-w4')
    expect(getCurrentStop(s, C)).toBe(1)
    s = completeKeys(s, C, ['i9-w4'])
    expect(getFocusTask(s, C)?.key).toBe('slack-invite')
  })

  it('summarises stops with remaining minutes', () => {
    const stops = getStops(seed(), C)
    expect(stops.map((x) => [x.name, x.minutesLeft])).toEqual([
      ['Your details', 2],
      ['Paperwork', 15],
      ['Connect with your team', 10],
    ])
    expect(stops[0].current).toBe(true)
  })

  it('grows the plant with progress', () => {
    expect(stageForPercent(0)).toBe('seed')
    expect(stageForPercent(1)).toBe('sprout')
    expect(stageForPercent(60)).toBe('leafy')
    expect(stageForPercent(100)).toBe('bloom')
    expect(plantStage(completeKeys(seed(), C, ['confirm-details']), C)).toBe('sprout') // 1 of 4
    const s = completeKeys(seed(), C, ['confirm-details', 'i9-w4', 'slack-invite'])
    expect(plantStage(s, C)).toBe('leafy') // 3 of 4
  })

  it('is all set for Monday once every pre-start task is done', () => {
    const s = completeKeys(seed(), C, PRE_START_OPEN)
    expect(hirePageState(s, C)).toEqual({ kind: 'allSetForStart' })
    expect(plantStage(s, C)).toBe('bloom')
    expect(minutesLeft(s, C)).toBe(0)
  })

  it('updates the IT accounts row once details are confirmed', () => {
    let s = seed()
    expect(waitingFor(s, C)[0].text).toBe('IT is setting these up, ready Monday morning.')
    s = completeKeys(s, C, ['confirm-details'])
    expect(waitingFor(s, C)[0].text).toBe('IT has what it needs and is setting these up.')
  })
})

describe('reducer safety', () => {
  it('ignores double completes and keeps one access request', () => {
    let s = seed()
    s = completeKeys(s, C, ['dev-tools', 'dev-tools'])
    expect(s.requests).toHaveLength(1)
    expect(s.requests[0].status).toBe('waitingOnManager')
    expect(hireStatus(s, C)).toBe('needsApproval')
    expect(needsAttention(s)[0]).toMatchObject({ kind: 'approval', hireId: C })
  })

  it('runs the approval flow, including decline and resubmit', () => {
    let s = completeKeys(seed(), C, ['dev-tools'])
    const id = s.requests[0].id
    s = reducer(s, { type: 'declineRequest', requestId: id, note: 'Use your work email' })
    expect(s.requests[0]).toMatchObject({ status: 'declined', note: 'Use your work email' })
    s = reducer(s, { type: 'resubmitRequest', requestId: id })
    s = reducer(s, { type: 'approveRequest', requestId: id })
    s = reducer(s, { type: 'approveRequest', requestId: id }) // double click
    expect(s.requests[0].status).toBe('approved')
    s = reducer(s, { type: 'markRequestReady', requestId: id })
    expect(s.requests[0].status).toBe('ready')
  })

  it('undo withdraws a pending request', () => {
    let s = completeKeys(seed(), C, ['dev-tools'])
    s = reducer(s, { type: 'undoTask', taskId: `${C}:dev-tools` })
    expect(s.requests).toHaveLength(0)
    expect(phaseCounts(s, C).done).toBe(0)
  })

  it('rejects corrupt saved data', () => {
    expect(parseState('{not json')).toBeNull()
    expect(parseState(JSON.stringify({ version: 1 }))).toBeNull()
    expect(parseState(JSON.stringify(seed()))).not.toBeNull()
  })
})

describe('start date moves', () => {
  it('shifts every deadline and start-anchored waiting item', () => {
    const s = seed()
    const chloe = s.hires.find((h) => h.id === C)!
    const tuesday = addDays(chloe.startDate, 1)
    const moved = reducer(s, { type: 'moveStartDate', hireId: C, startDate: tuesday })
    const movedChloe = moved.hires.find((h) => h.id === C)!
    expect(movedChloe.previousStartDate).toBe(chloe.startDate)
    for (const t of moved.tasks.filter((x) => x.hireId === C)) {
      expect(daysBetween(taskDue(chloe, t), taskDue(movedChloe, t))).toBe(1)
    }
    expect(waitingFor(moved, C)[0].text).toBe('IT is setting these up, ready Tuesday morning.')
  })
})

describe('later phases', () => {
  it('shows overdue pre-start tasks on Monday, then Day 1', () => {
    let s = reducer(seed(), { type: 'jumpToStartDay' })
    const chloe = s.hires.find((h) => h.id === C)!
    expect(getCurrentPhase(s, C)).toBe('preStart')
    expect(isOverdue(chloe, getFocusTask(s, C)!, s.today)).toBe(true)
    s = completeKeys(s, C, PRE_START_OPEN)
    expect(getCurrentPhase(s, C)).toBe('day1')
    expect(waitingFor(s, C)).toHaveLength(0) // accounts are ready Monday
  })

  it('is caught up when the next phase has not opened yet', () => {
    let s = reducer(seed(), { type: 'jumpToStartDay' })
    s = completeKeys(s, C, [...PRE_START_OPEN, 'laptop-badge', 'meet-manager', 'meet-buddy', 'security-training'])
    expect(hirePageState(s, C)).toMatchObject({ kind: 'caughtUp' })
  })
})

describe('manager view data', () => {
  it('matches the garden story', () => {
    const s = seed()
    expect(progressPercent(s, 'priya')).toBe(50)
    expect(hireStatus(s, 'priya')).toBe('blocked')
    expect(waitingFor(s, 'priya')[0].daysWaiting).toBe(3)
    expect(progressPercent(s, 'jordan')).toBe(0)
    expect(hireStatus(s, 'jordan')).toBe('notStarted')
    // Chloe hasn't done anything yet; one task later she's on track.
    expect(hireStatus(s, C)).toBe('notStarted')
    expect(hireStatus(completeKeys(s, C, ['confirm-details']), C)).toBe('onTrack')
  })
})

describe('generatePlan', () => {
  it('builds different plans per role and copes with an empty plan', () => {
    const eng = generatePlan('Engineering', '2026-11-02', 'a')
    const des = generatePlan('Design', '2026-11-02', 'b')
    expect(eng.tasks.length).toBe(16)
    expect(eng.tasks.some((t) => t.key === 'offer-letter')).toBe(false)
    expect(eng.tasks.some((t) => t.key === 'monday-check')).toBe(false)
    expect(eng.tasks.some((t) => t.key === 'direct-deposit')).toBe(false)
    expect(des.tasks.length).toBeLessThan(eng.tasks.length)
    expect(des.tasks.some((t) => t.key === 'design-tools')).toBe(true)

    const empty = { ...seed(), tasks: seed().tasks.filter((t) => t.hireId !== C) }
    expect(hirePageState(empty, C)).toEqual({ kind: 'empty' })
    expect(getFocusTask(empty, C)).toBeNull()
    expect(minutesLeft(empty, C)).toBe(0)
  })
})

describe('validation', () => {
  it('gives specific phone and email messages', () => {
    expect(phone('555 0101')).toBe('That phone number looks short.')
    expect(phone('(555) 010-1234')).toBeNull()
    expect(phone('+1 555 010 1234')).toBeNull()
    expect(phone('')).toMatch(/mobile number/)
    expect(email('chloe.example.com')).toBe('That email is missing an @.')
    expect(email('chloe@example')).toMatch(/complete/)
    expect(email('chloe@example.com')).toBeNull()
  })
})

describe('doing tasks', () => {
  it('only completes the Slack task once every step is checked', () => {
    let s = reducer(seed(), { type: 'completeTask', taskId: `${C}:slack-invite` })
    expect(s.tasks.find((t) => t.key === 'slack-invite' && t.hireId === C)?.doneAt).toBeUndefined()
    s = completeKeys(s, C, ['slack-invite'])
    expect(s.tasks.find((t) => t.key === 'slack-invite' && t.hireId === C)?.doneAt).toBeTruthy()
  })

  it('saves form data, and editing keeps progress and the plant', () => {
    const id = `${C}:confirm-details`
    let s = reducer(seed(), {
      type: 'completeTask',
      taskId: id,
      data: { firstName: 'Chloe', lastName: 'Zhang', preferredName: '', phone: '5550101234', email: 'chloe@example.com' },
    })
    const counts = phaseCounts(s, C)
    const stage = plantStage(s, C)
    expect(taskSummary(s.tasks.find((t) => t.id === id)!)).toBe('Chloe Zhang · (555) 010-1234')
    s = reducer(s, {
      type: 'updateTaskData',
      taskId: id,
      data: { firstName: 'Chloe', lastName: 'Zhang', preferredName: 'Chlo', phone: '5550109999', email: 'chloe@example.com' },
    })
    expect(taskSummary(s.tasks.find((t) => t.id === id)!)).toBe('Chlo · (555) 010-9999')
    expect(phaseCounts(s, C)).toEqual(counts)
    expect(plantStage(s, C)).toBe(stage)
  })

  it('hands sensitive paperwork off to the HR portal instead of collecting it', () => {
    const s = seed()
    const handoff = s.tasks.find((x) => x.hireId === C && x.key === 'i9-w4')!
    expect(handoff.kind).toBe('handoff')
    expect(handoff.portal?.haveReady.length).toBeGreaterThan(0)
    const id = `${C}:i9-w4`
    let done = reducer(s, { type: 'completeTask', taskId: id, data: { finishedAt: '2026-11-06T18:00:00Z' } })
    expect(taskSummary(done.tasks.find((t) => t.id === id)!)).toBe('Finished in the secure HR portal')
    // Reopening and finishing again keeps it done and the count unchanged.
    const before = phaseCounts(done, C)
    done = reducer(done, { type: 'updateTaskData', taskId: id, data: { finishedAt: '2026-11-07T10:00:00Z' } })
    expect(phaseCounts(done, C)).toEqual(before)
  })

  it('carries request details and resends a declined request when edited', () => {
    const id = `${C}:dev-tools`
    let s = reducer(seed(), { type: 'completeTask', taskId: id, data: { tools: ['github', 'jira'] } })
    expect(s.requests[0]).toMatchObject({ resource: 'Dev tools', details: { tools: ['github', 'jira'] } })
    expect(taskSummary(s.tasks.find((t) => t.id === id)!)).toBe('GitHub, Jira')
    expect(activeRequest(s, C)?.status).toBe('waitingOnManager')
    s = reducer(s, { type: 'declineRequest', requestId: s.requests[0].id, note: 'Add the cloud console too' })
    s = reducer(s, { type: 'updateTaskData', taskId: id, data: { tools: ['github', 'jira', 'cloud'] } })
    expect(s.requests[0].status).toBe('waitingOnManager')
    expect(s.requests[0].details?.tools).toHaveLength(3)
    s = reducer(s, { type: 'approveRequest', requestId: s.requests[0].id })
    s = reducer(s, { type: 'markRequestReady', requestId: s.requests[0].id })
    expect(activeRequest(s, C)).toBeNull()
  })

  it('counts each stop from its own tasks', () => {
    let s = seed()
    expect(getStops(s, C).map((x) => [x.name, x.remaining, x.total])).toEqual([
      ['Your details', 1, 1],
      ['Paperwork', 1, 1],
      ['Connect with your team', 2, 2],
    ])
    s = completeKeys(s, C, ['confirm-details', 'i9-w4', 'slack-invite'])
    expect(getStops(s, C)[2]).toMatchObject({ remaining: 1, total: 2, current: true })
    expect(phaseCounts(s, C)).toEqual({ done: 3, total: 4 })
  })
})

describe('coming up', () => {
  it('previews Monday, Week 1 and the first month from the plan, per role', () => {
    const s = seed()
    const eng = comingUp(s, C)
    expect(eng.guide?.sections.map((x) => x.title)).toEqual(['Arriving', 'Parking and your badge', 'What to wear', 'Who to ask'])
    expect(eng.guide?.from).toBe('Sarah, People team')
    const words = [eng.guide!.intro, ...eng.guide!.sections.map((x) => x.body), eng.guide!.signoff].join(' ').split(/\s+/).length
    expect(words).toBeGreaterThan(150)
    expect(words).toBeLessThan(250)
    expect(eng.week1.map((t) => t.title)).toEqual([
      'Set up your dev environment',
      'Clone the repos and run the app',
      'Read the architecture overview',
      'Review the employee handbook',
      'Complete compliance training',
    ])
    expect(eng.month1.map((t) => t.key)).toEqual(['check-in-30', 'first-pr', 'onboarding-feedback'])
    expect(eng.month1.map(dueDay)).toEqual([30, 14, 30])

    // A designer starting the same day sees different content.
    const plan = generatePlan('Design', s.hires[0].startDate, 'dana')
    const withDesigner: AppState = {
      ...s,
      hires: [...s.hires, { ...s.hires[0], id: 'dana', name: 'Dana Fox', firstName: 'Dana', title: 'Product designer', role: 'Design' }],
      tasks: [...s.tasks, ...plan.tasks],
    }
    const des = comingUp(withDesigner, 'dana')
    expect(des.week1.map((t) => t.key)).toEqual(['design-system', 'meet-pms', 'research-library'])
    expect(des.guide?.sections[3].body).toMatch(/Alex Kim/)
    expect(eng.guide?.sections[3].body).toMatch(/Sam Rivera/)
  })

  it('runs Day 1 tasks in itinerary order', () => {
    const s = reducer(completeKeys(seed(), C, PRE_START_OPEN), { type: 'jumpToStartDay' })
    expect(getFocusTask(s, C)?.key).toBe('meet-manager')
  })
})

describe('time estimates', () => {
  it('only uses 1, 2, 5, 10, 15, 20 or 30 minutes', () => {
    const allowed = new Set([1, 2, 5, 10, 15, 20, 30])
    for (const role of ['Engineering', 'Design'] as const) {
      for (const t of generatePlan(role, '2026-11-09', 'x').tasks) expect(allowed.has(t.minutes), `${role} ${t.key} ${t.minutes}`).toBe(true)
    }
  })
})

describe("Mateo's garden", () => {
  it('orders by attention and labels each hire', () => {
    const s = seed()
    expect(gardenOrder(s).map((h) => h.id)).toEqual(['priya', 'jordan', 'chloe'])
    expect(gardenStatusLine(s, 'priya')).toBe('Blocked: waiting on GitHub access, 3 days.')
    expect(gardenStatusLine(s, 'jordan')).toBe('Hasn’t started yet.')
    const label = (id: string) => startLabel(s.hires.find((h) => h.id === id)!, s.today)
    expect([label('priya'), label('jordan'), label('chloe')]).toEqual(['started 3 days ago', 'starts in 2 days', 'starts Monday'])
  })

  it('moves Chloe up while her request waits on Mateo, and back once approved', () => {
    let s = completeKeys(seed(), C, ['confirm-details', 'dev-tools'])
    expect(pendingApprovals(s)).toHaveLength(1)
    expect(gardenOrder(s).map((h) => h.id)).toEqual(['priya', 'chloe', 'jordan'])
    expect(gardenStatusLine(s, C)).toBe('Waiting on your approval: dev tools.')
    s = reducer(s, { type: 'approveRequest', requestId: s.requests[0].id })
    s = reducer(s, { type: 'approveRequest', requestId: s.requests[0].id }) // double click
    expect(pendingApprovals(s)).toHaveLength(0)
    expect(gardenStatusLine(s, C)).toBe('On track.')
  })

  it('records nudges and reminders, and a reset clears requests', () => {
    let s = reducer(seed(), { type: 'nudgeIT', waitingId: 'priya:wait:github', at: '2026-11-06T18:00:00Z' })
    s = reducer(s, { type: 'sendReminder', hireId: 'jordan', at: '2026-11-06T18:00:00Z' })
    expect(s.waiting.find((w) => w.id === 'priya:wait:github')?.nudgedAt).toBeTruthy()
    expect(s.hires.find((h) => h.id === 'jordan')?.remindedAt).toBeTruthy()
    s = completeKeys(s, C, ['dev-tools'])
    s = reducer(s, { type: 'approveRequest', requestId: s.requests[0].id })
    s = reducer(s, { type: 'resetData', realToday: REAL_TODAY })
    expect(s.requests).toHaveLength(0)
    // A late "IT is ready" timer after reset finds nothing to change.
    expect(reducer(s, { type: 'markRequestReady', requestId: 'req:chloe:dev-tools' })).toBe(s)
  })
})
