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
} from './selectors'
import { parseState } from './storage'
import { account, email, githubUsername, i9Documents, isValidRouting, phone, routing, zip } from './validation'
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

const PRE_START_OPEN = ['confirm-details', 'i9-w4', 'direct-deposit', 'slack-invite', 'welcome-guide', 'repo-access']

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
  it('shows 2 of 8 done, 35 minutes, 25%, sprout', () => {
    const s = seed()
    expect(phaseCounts(s, C)).toEqual({ done: 2, total: 8 })
    expect(minutesLeft(s, C)).toBe(35)
    expect(progressPercent(s, C)).toBe(25)
    expect(plantStage(s, C)).toBe('sprout')
  })

  it('focuses the task that unblocks IT first, then earliest due, then stop order', () => {
    let s = seed()
    expect(getFocusTask(s, C)?.key).toBe('confirm-details')
    expect(getCurrentStop(s, C)).toBe(0)
    s = completeKeys(s, C, ['confirm-details'])
    expect(minutesLeft(s, C)).toBe(33)
    expect(getFocusTask(s, C)?.key).toBe('i9-w4')
    expect(getCurrentStop(s, C)).toBe(1)
    s = completeKeys(s, C, ['i9-w4', 'direct-deposit'])
    expect(getFocusTask(s, C)?.key).toBe('slack-invite')
  })

  it('summarises stops with remaining minutes', () => {
    const stops = getStops(seed(), C)
    expect(stops.map((x) => [x.name, x.minutesLeft])).toEqual([
      ['Quick start', 2],
      ['Paperwork', 20],
      ['Get connected', 13],
    ])
    expect(stops[0].current).toBe(true)
  })

  it('grows the plant with progress', () => {
    expect(stageForPercent(0)).toBe('seed')
    expect(stageForPercent(1)).toBe('sprout')
    expect(stageForPercent(60)).toBe('leafy')
    expect(stageForPercent(100)).toBe('bloom')
    const s = completeKeys(seed(), C, ['confirm-details', 'i9-w4', 'direct-deposit'])
    expect(plantStage(s, C)).toBe('leafy') // 5 of 8
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
    s = completeKeys(s, C, ['repo-access', 'repo-access'])
    expect(s.requests).toHaveLength(1)
    expect(s.requests[0].status).toBe('waitingOnManager')
    expect(hireStatus(s, C)).toBe('needsApproval')
    expect(needsAttention(s)[0]).toMatchObject({ kind: 'approval', hireId: C })
  })

  it('runs the approval flow, including decline and resubmit', () => {
    let s = completeKeys(seed(), C, ['repo-access'])
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
    let s = completeKeys(seed(), C, ['repo-access'])
    s = reducer(s, { type: 'undoTask', taskId: `${C}:repo-access` })
    expect(s.requests).toHaveLength(0)
    expect(phaseCounts(s, C).done).toBe(2)
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
    expect(progressPercent(s, 'priya')).toBe(62)
    expect(hireStatus(s, 'priya')).toBe('blocked')
    expect(waitingFor(s, 'priya')[0].daysWaiting).toBe(3)
    expect(progressPercent(s, 'jordan')).toBe(0)
    expect(hireStatus(s, 'jordan')).toBe('notStarted')
    expect(hireStatus(s, C)).toBe('onTrack')
  })
})

describe('generatePlan', () => {
  it('builds different plans per role and copes with an empty plan', () => {
    const eng = generatePlan('Engineering', '2026-11-02', 'a')
    const des = generatePlan('Design', '2026-11-02', 'b')
    expect(eng.tasks.length).toBe(21)
    expect(des.tasks.length).toBeLessThan(eng.tasks.length)
    expect(des.tasks.some((t) => t.key === 'figma-access')).toBe(true)

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
    expect(zip('9411')).toMatch(/5 digits/)
  })
  it('checks ABA routing numbers', () => {
    expect(isValidRouting('011000015')).toBe(true) // Federal Reserve Bank of Boston
    expect(isValidRouting('021000021')).toBe(true)
    expect(isValidRouting('123456789')).toBe(false)
    expect(routing('12345')).toMatch(/9 digits/)
    expect(routing('123456789')).toMatch(/check out/)
    expect(account('12')).toMatch(/short/)
  })
  it('checks GitHub usernames and I-9 documents', () => {
    expect(githubUsername('chloe-z')).toBeNull()
    expect(githubUsername('-chloe')).toMatch(/dash/)
    expect(githubUsername('chloe--z')).toMatch(/dash/)
    expect(i9Documents(['passport'])).toBeNull()
    expect(i9Documents(['license', 'ssn-card'])).toBeNull()
    expect(i9Documents(['license'])).toMatch(/Social Security/)
    expect(i9Documents([])).toMatch(/Pick/)
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
    const id = `${C}:direct-deposit`
    let s = reducer(seed(), {
      type: 'completeTask',
      taskId: id,
      data: { bankName: 'Fake Bank', routing: '011000015', accountType: 'checking', accountLast4: '4321' },
    })
    const counts = phaseCounts(s, C)
    const stage = plantStage(s, C)
    expect(taskSummary(s.tasks.find((t) => t.id === id)!)).toBe('Checking ····4321')
    s = reducer(s, { type: 'updateTaskData', taskId: id, data: { accountType: 'savings', accountLast4: '9876' } })
    expect(taskSummary(s.tasks.find((t) => t.id === id)!)).toBe('Savings ····9876')
    expect(phaseCounts(s, C)).toEqual(counts)
    expect(plantStage(s, C)).toBe(stage)
  })

  it('carries request details and resends a declined request when edited', () => {
    const id = `${C}:repo-access`
    let s = reducer(seed(), { type: 'completeTask', taskId: id, data: { githubUsername: 'chloe-z', repos: ['care-api'] } })
    expect(s.requests[0].details).toMatchObject({ githubUsername: 'chloe-z' })
    s = reducer(s, { type: 'declineRequest', requestId: s.requests[0].id, note: 'Add patient-web too' })
    s = reducer(s, { type: 'updateTaskData', taskId: id, data: { githubUsername: 'chloe-z', repos: ['care-api', 'patient-web'] } })
    expect(s.requests[0].status).toBe('waitingOnManager')
    expect(s.requests[0].details?.repos).toHaveLength(2)
  })

  it('"I\'ll do this later" sends a task to the back of the queue', () => {
    let s = completeKeys(seed(), C, ['confirm-details', 'i9-w4'])
    expect(getFocusTask(s, C)?.key).toBe('direct-deposit')
    s = reducer(s, { type: 'deferTask', taskId: `${C}:direct-deposit` })
    expect(getFocusTask(s, C)?.key).toBe('slack-invite')
    s = completeKeys(s, C, ['slack-invite', 'welcome-guide', 'repo-access'])
    expect(getFocusTask(s, C)?.key).toBe('direct-deposit')
  })
})
