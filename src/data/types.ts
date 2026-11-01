/** Calendar date as `YYYY-MM-DD`. Always handled with pure UTC math (see dates.ts). */
export type ISODate = string

export type Role = 'Engineering' | 'Design'

export type PhaseId = 'preStart' | 'day1' | 'week1' | 'month1'

export type PlantStage = 'seed' | 'sprout' | 'leafy' | 'bloom'

export type Owner = 'IT' | 'manager'

export interface Hire {
  id: string
  name: string
  firstName: string
  /** Job title shown to people, e.g. "Software engineer". */
  title: string
  /** Template family used by generatePlan. */
  role: Role
  startDate: ISODate
  /** Set when the start date moves, so the hire sees a gentle banner. */
  previousStartDate?: ISODate
  managerName: string
  remindedAt?: string
  /** Contact details HR already has; the hire confirms them rather than re-typing. */
  onFile?: { firstName: string; lastName: string; phone: string; email: string }
}

/**
 * How a task is done in place:
 * form (fill and submit), steps (confirm every step),
 * request (ask someone for access), handoff (finish it in a secure external
 * portal, then confirm). Undefined means a plain "Mark done".
 */
export type TaskKind = 'form' | 'steps' | 'request' | 'handoff'

/** A task finished in a secure provider (HR portal), never inside this app. */
export interface PortalHandoff {
  /** Name of the form in the portal, e.g. "Form I-9 and W-4". */
  formName: string
  /** What to have on hand before opening it. */
  haveReady: string[]
  /** Static, read-only rows shown in the portal panel (never real data). */
  preview?: { label: string; value: string }[]
}

/** Values a task saved when it was completed (or edited). Always fake demo data. */
export type TaskData = Record<string, string | string[] | number | boolean>

/** One option on a request task (e.g. a tool to ask for). */
export interface Choice {
  value: string
  label: string
  hint?: string
}

export interface Task {
  id: string
  kind?: TaskKind
  hireId: string
  /** Stable template key, e.g. "confirm-details". */
  key: string
  phase: PhaseId
  /** Index of the stop (0..2) inside its phase. */
  stop: number
  /** Order inside the template; final tie-breaker for focus. */
  order: number
  title: string
  /** Short label for "Up next" chips. */
  short: string
  why: string
  minutes: number
  /** Due date as days relative to start date (negative = before day 1). */
  dueOffset: number
  /** Who this task unblocks, e.g. "IT". Unblocking tasks always go first. */
  unblocks?: string
  steps?: string[]
  stepsDone?: number[]
  /** Request tasks: what she can ask for. */
  choices?: Choice[]
  /** Completing this creates an AccessRequest for the manager. */
  approval?: { resource: string }
  /** Handoff tasks: what the secure portal form is and what to have ready. */
  portal?: PortalHandoff
  /** Completing this creates a waiting item owned by someone else. */
  handoff?: { key: string; title: string; owner: Owner; readyAfterDays: number }
  doneAt?: string
  /** Saved form values. Kept when a done task is edited. */
  data?: TaskData
}

export type RequestStatus = 'waitingOnManager' | 'approved' | 'ready' | 'declined'

export interface AccessRequest {
  id: string
  hireId: string
  taskId: string
  resource: string
  status: RequestStatus
  requestedAt: string
  updatedAt: string
  note?: string
  /** What the hire asked for (e.g. GitHub username, repos, reason). */
  details?: TaskData
}

/** Something the hire is waiting on someone else for. Never has a checkbox. */
export interface WaitingItem {
  id: string
  hireId: string
  key: string
  title: string
  owner: Owner
  /** Day this is expected to be ready. */
  readyOn: ISODate
  /** Day it was handed off (used for "blocked for 3 days"). */
  since: ISODate
  /** When false it stays pending past readyOn, which reads as blocked. */
  autoReady: boolean
  /** True when readyOn is tied to the start date (moves with it). */
  anchoredToStart?: boolean
  /** Copy while pending. `{day}` is replaced with the weekday of readyOn. */
  detail: string
  /** Copy once `unblockedBy` task is done. */
  detailUnblocked?: string
  unblockedBy?: string
  nudgedAt?: string
}

export type View = 'hire' | 'manager'

export interface AppState {
  version: 1
  /** The simulated "today" the whole demo runs on. */
  today: ISODate
  /** Whose page the New hire view shows. */
  primaryHireId: string
  view: View
  hires: Hire[]
  tasks: Task[]
  waiting: WaitingItem[]
  requests: AccessRequest[]
}
