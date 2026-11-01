import { addDays, daysBetween, dayLabel, weekday } from './dates'
import { PHASE_ORDER, phaseTemplate, type FirstDayGuide } from './templates'
import type {
  AccessRequest,
  AppState,
  Hire,
  ISODate,
  PhaseId,
  PlantStage,
  Task,
  WaitingItem,
} from './types'

// Basics ---------------------------------------------------------------------

export function getHire(state: AppState, hireId: string): Hire | undefined {
  return state.hires.find((h) => h.id === hireId)
}

export function tasksFor(state: AppState, hireId: string): Task[] {
  return state.tasks.filter((t) => t.hireId === hireId)
}

export const isDone = (t: Task) => Boolean(t.doneAt)

export function taskDue(hire: Hire, task: Task): ISODate {
  return addDays(hire.startDate, task.dueOffset)
}

export function isOverdue(hire: Hire, task: Task, today: ISODate): boolean {
  return !isDone(task) && daysBetween(today, taskDue(hire, task)) < 0
}

/** Day (offset from start) that `today` is for this hire. 0 = first day. */
export function dayOfOnboarding(hire: Hire, today: ISODate): number {
  return daysBetween(hire.startDate, today)
}

/** Name to greet the hire by: their preferred name once they've told us. */
export function displayName(state: AppState, hireId: string): string {
  const hire = getHire(state, hireId)
  const details = tasksFor(state, hireId).find((t) => t.key === 'confirm-details')
  const preferred = details?.data?.preferredName
  return (typeof preferred === 'string' && preferred.trim()) || hire?.firstName || 'there'
}

// Phases -----------------------------------------------------------------------

export function phaseIsOpen(hire: Hire, phase: PhaseId, today: ISODate): boolean {
  return dayOfOnboarding(hire, today) >= phaseTemplate(hire.role, phase).opensOn
}

/**
 * The phase the hire should be working on: the earliest open phase that still has
 * unfinished tasks. Finished phases disappear. Returns null when every open phase
 * is finished (either "caught up" or "fully onboarded").
 */
export function getCurrentPhase(state: AppState, hireId: string): PhaseId | null {
  const hire = getHire(state, hireId)
  if (!hire) return null
  const tasks = tasksFor(state, hireId)
  for (const phase of PHASE_ORDER) {
    if (!phaseIsOpen(hire, phase, state.today)) return null
    const inPhase = tasks.filter((t) => t.phase === phase)
    if (inPhase.some((t) => !isDone(t))) return phase
  }
  return null
}

/** Next phase that is not open yet, if any (for "Next due: Tuesday"). */
export function getNextLockedPhase(
  state: AppState,
  hireId: string,
): { phase: PhaseId; opensOn: ISODate } | null {
  const hire = getHire(state, hireId)
  if (!hire) return null
  for (const phase of PHASE_ORDER) {
    if (!phaseIsOpen(hire, phase, state.today)) {
      const offset = phaseTemplate(hire.role, phase).opensOn
      return { phase, opensOn: addDays(hire.startDate, offset) }
    }
  }
  return null
}

export function phaseTasks(state: AppState, hireId: string, phase: PhaseId): Task[] {
  return tasksFor(state, hireId).filter((t) => t.phase === phase)
}

// Focus --------------------------------------------------------------------------

/**
 * "Do this first": tasks that unblock someone else first, then earliest due,
 * then stop order, then template order.
 */
export function compareFocus(a: Task, b: Task): number {
  const ua = a.unblocks ? 0 : 1
  const ub = b.unblocks ? 0 : 1
  if (ua !== ub) return ua - ub
  if (a.dueOffset !== b.dueOffset) return a.dueOffset - b.dueOffset
  if (a.stop !== b.stop) return a.stop - b.stop
  return a.order - b.order
}

export function remainingInPhase(state: AppState, hireId: string): Task[] {
  const phase = getCurrentPhase(state, hireId)
  if (!phase) return []
  return phaseTasks(state, hireId, phase)
    .filter((t) => !isDone(t))
    .sort(compareFocus)
}

export function getFocusTask(state: AppState, hireId: string): Task | null {
  return remainingInPhase(state, hireId)[0] ?? null
}

/** Remaining tasks after the focus task, in the order they will come up. */
export function getUpNext(state: AppState, hireId: string): Task[] {
  return remainingInPhase(state, hireId).slice(1)
}

export interface StopSummary {
  index: number
  name: string
  total: number
  remaining: number
  minutesLeft: number
  done: boolean
  current: boolean
}

export function getStops(state: AppState, hireId: string): StopSummary[] {
  const hire = getHire(state, hireId)
  const phase = getCurrentPhase(state, hireId)
  if (!hire || !phase) return []
  const tpl = phaseTemplate(hire.role, phase)
  const tasks = phaseTasks(state, hireId, phase)
  const current = getCurrentStop(state, hireId)
  return tpl.stops.map((s, index) => {
    const inStop = tasks.filter((t) => t.stop === index)
    const open = inStop.filter((t) => !isDone(t))
    return {
      index,
      name: s.name,
      total: inStop.length,
      remaining: open.length,
      minutesLeft: open.reduce((m, t) => m + t.minutes, 0),
      done: open.length === 0,
      current: index === current,
    }
  })
}

/** Index of the stop the focus task belongs to. */
export function getCurrentStop(state: AppState, hireId: string): number | null {
  return getFocusTask(state, hireId)?.stop ?? null
}

// Progress -----------------------------------------------------------------------

export function minutesLeft(state: AppState, hireId: string): number {
  return remainingInPhase(state, hireId).reduce((m, t) => m + t.minutes, 0)
}

/** "2 of 7 done" for the phase on screen. */
export function phaseCounts(state: AppState, hireId: string): { done: number; total: number } {
  const phase = getCurrentPhase(state, hireId)
  if (!phase) return { done: 0, total: 0 }
  const tasks = phaseTasks(state, hireId, phase)
  return { done: tasks.filter(isDone).length, total: tasks.length }
}

/**
 * Overall onboarding progress, 0..100.
 * Before day 1 it measures the pre-start plan (what matters right now);
 * from day 1 on it measures the whole plan.
 */
export function progressPercent(state: AppState, hireId: string): number {
  const hire = getHire(state, hireId)
  if (!hire) return 0
  const all = tasksFor(state, hireId)
  const scope =
    dayOfOnboarding(hire, state.today) < 0 ? all.filter((t) => t.phase === 'preStart') : all
  if (scope.length === 0) return 0
  return Math.round((scope.filter(isDone).length / scope.length) * 100)
}

export function stageForPercent(pct: number): PlantStage {
  if (pct >= 100) return 'bloom'
  if (pct >= 60) return 'leafy'
  if (pct > 0) return 'sprout'
  return 'seed'
}

/** Plant on the hire's own page follows the phase on screen. */
export function plantStage(state: AppState, hireId: string): PlantStage {
  const phase = getCurrentPhase(state, hireId)
  if (!phase) return tasksFor(state, hireId).length ? 'bloom' : 'seed'
  const { done, total } = phaseCounts(state, hireId)
  const stage = stageForPercent(total ? (done / total) * 100 : 0)
  // Once anything is finished overall, never fall back to a bare seed.
  if (stage === 'seed' && tasksFor(state, hireId).some(isDone)) return 'sprout'
  return stage
}

// Waiting on others ----------------------------------------------------------

export function isWaitingReady(w: WaitingItem, today: ISODate): boolean {
  return w.autoReady && daysBetween(w.readyOn, today) >= 0
}

export function isWaitingBlocked(w: WaitingItem, today: ISODate): boolean {
  return !isWaitingReady(w, today) && daysBetween(w.readyOn, today) > 0
}

export interface WaitingRow {
  item: WaitingItem
  text: string
  blocked: boolean
  daysWaiting: number
}

export function waitingFor(state: AppState, hireId: string): WaitingRow[] {
  const tasks = tasksFor(state, hireId)
  return state.waiting
    .filter((w) => w.hireId === hireId && !isWaitingReady(w, state.today))
    .map((item) => {
      const unblocked =
        item.unblockedBy && tasks.some((t) => t.key === item.unblockedBy && isDone(t))
      const raw = unblocked && item.detailUnblocked ? item.detailUnblocked : item.detail
      return {
        item,
        text: raw.replace('{day}', weekday(item.readyOn)),
        blocked: isWaitingBlocked(item, state.today),
        daysWaiting: Math.max(0, daysBetween(item.since, state.today)),
      }
    })
}

export function requestsFor(state: AppState, hireId: string): AccessRequest[] {
  return state.requests.filter((r) => r.hireId === hireId && r.status !== 'ready')
}

/** Count shown in "1 waiting on others". Ready requests drop off. */
export function waitingCount(state: AppState, hireId: string): number {
  return waitingFor(state, hireId).length + requestsFor(state, hireId).length
}

// Page state for the hire ---------------------------------------------------------

export type HirePageState =
  | { kind: 'empty' }
  | { kind: 'focus'; phase: PhaseId }
  | { kind: 'allSetForStart' }
  | { kind: 'caughtUp'; nextOpens: ISODate }
  | { kind: 'fullyOnboarded' }

export function hirePageState(state: AppState, hireId: string): HirePageState {
  if (tasksFor(state, hireId).length === 0) return { kind: 'empty' }
  const phase = getCurrentPhase(state, hireId)
  if (phase) return { kind: 'focus', phase }
  const next = getNextLockedPhase(state, hireId)
  if (!next) return { kind: 'fullyOnboarded' }
  if (next.phase === 'day1') return { kind: 'allSetForStart' }
  return { kind: 'caughtUp', nextOpens: next.opensOn }
}

export function overdueLabel(hire: Hire, task: Task, today: ISODate): string | null {
  if (!isOverdue(hire, task, today)) return null
  return `Was due ${dayLabel(taskDue(hire, task), today)}.`
}

// Manager -------------------------------------------------------------------------

export type HireStatus = 'needsApproval' | 'blocked' | 'notStarted' | 'onTrack' | 'done'

export function hireStatus(state: AppState, hireId: string): HireStatus {
  if (state.requests.some((r) => r.hireId === hireId && r.status === 'waitingOnManager'))
    return 'needsApproval'
  if (waitingFor(state, hireId).some((w) => w.blocked)) return 'blocked'
  const tasks = tasksFor(state, hireId)
  if (tasks.length && tasks.every(isDone)) return 'done'
  if (!tasks.some(isDone)) return 'notStarted'
  return 'onTrack'
}

export interface AttentionItem {
  kind: 'approval' | 'blocked' | 'notStarted'
  hireId: string
  requestId?: string
  waitingId?: string
}

/**
 * Everything a manager might act on, most urgent first:
 * approvals (only the manager can unblock), then blocked hires, then hires who
 * have not started their pre-start tasks.
 */
export function needsAttention(state: AppState): AttentionItem[] {
  const items: AttentionItem[] = []
  for (const r of state.requests) {
    if (r.status === 'waitingOnManager')
      items.push({ kind: 'approval', hireId: r.hireId, requestId: r.id })
  }
  for (const hire of state.hires) {
    const blocked = waitingFor(state, hire.id).find((w) => w.blocked)
    if (blocked) items.push({ kind: 'blocked', hireId: hire.id, waitingId: blocked.item.id })
  }
  for (const hire of state.hires) {
    if (hireStatus(state, hire.id) === 'notStarted')
      items.push({ kind: 'notStarted', hireId: hire.id })
  }
  return items
}

/** Approvals waiting on the manager, oldest first. */
export function pendingApprovals(state: AppState): AccessRequest[] {
  return state.requests
    .filter((r) => r.status === 'waitingOnManager')
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
}

const ATTENTION_RANK: Record<HireStatus, number> = { blocked: 0, needsApproval: 1, notStarted: 2, onTrack: 3, done: 4 }

/**
 * Mateo's garden, most attention first (blocked, waiting on him, not started, on track).
 * Ties go to whoever starts sooner.
 */
export function gardenOrder(state: AppState): Hire[] {
  return [...state.hires].sort(
    (a, b) =>
      ATTENTION_RANK[hireStatus(state, a.id)] - ATTENTION_RANK[hireStatus(state, b.id)] ||
      a.startDate.localeCompare(b.startDate),
  )
}

/** "started 3 days ago", "starts in 2 days", "starts Monday". */
export function startLabel(hire: Hire, today: ISODate): string {
  const diff = daysBetween(today, hire.startDate)
  if (diff < -1) return `started ${-diff} days ago`
  if (diff === -1) return 'started yesterday'
  if (diff === 0) return 'starts today'
  if (diff === 1) return 'starts tomorrow'
  if (diff === 2) return 'starts in 2 days'
  if (diff <= 6) return `starts ${weekday(hire.startDate)}`
  return `starts in ${diff} days`
}

/** The one status line on a garden card. */
export function gardenStatusLine(state: AppState, hireId: string): string {
  switch (hireStatus(state, hireId)) {
    case 'blocked': {
      const w = waitingFor(state, hireId).find((x) => x.blocked)!
      return `Blocked: waiting on ${w.item.title}, ${w.daysWaiting} day${w.daysWaiting === 1 ? '' : 's'}.`
    }
    case 'needsApproval': {
      const r = state.requests.find((x) => x.hireId === hireId && x.status === 'waitingOnManager')!
      return `Waiting on your approval: ${r.resource.toLowerCase()}.`
    }
    case 'notStarted':
      return 'Hasn’t started yet.'
    case 'onTrack':
      return 'On track.'
    case 'done':
      return 'Fully onboarded.'
  }
}

// Coming up (all-set screen) --------------------------------------------------------

export interface ComingUp {
  /** The first-day welcome note from the role template. */
  guide: FirstDayGuide | null
  /** Read-only previews of the hire's own generated plan. */
  week1: Task[]
  month1: Task[]
}

/** What's ahead, read-only. Comes from the role template and generated plan, so roles differ. */
export function comingUp(state: AppState, hireId: string): ComingUp {
  const hire = getHire(state, hireId)
  if (!hire) return { guide: null, week1: [], month1: [] }
  const byOrder = (a: Task, b: Task) => a.order - b.order
  return {
    guide: phaseTemplate(hire.role, 'day1').guide ?? null,
    week1: phaseTasks(state, hireId, 'week1').sort(byOrder),
    month1: phaseTasks(state, hireId, 'month1').sort(byOrder),
  }
}

/** The access request still in progress (hidden once it's ready). */
export function activeRequest(state: AppState, hireId: string): AccessRequest | null {
  return state.requests.find((r) => r.hireId === hireId && r.status !== 'ready') ?? null
}

/** Day number a task is due on, counting the start date as day 1 ("by day 30"). */
export function dueDay(task: Task): number {
  return task.dueOffset + 1
}
