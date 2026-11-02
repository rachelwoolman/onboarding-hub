import { addDays, daysBetween } from './dates'
import { createSeed } from './mock'
import { getHire, getNextLockedPhase } from './selectors'
import type { AccessRequest, AppState, ISODate, TaskData, View, WaitingItem } from './types'

export type Action =
  | { type: 'completeTask'; taskId: string; data?: TaskData; at?: string }
  | { type: 'updateTaskData'; taskId: string; data: TaskData; at?: string }
  | { type: 'undoTask'; taskId: string }
  | { type: 'toggleStep'; taskId: string; step: number }
  | { type: 'submitAccessRequest'; taskId: string; at?: string }
  | { type: 'approveRequest'; requestId: string; at?: string }
  | { type: 'markRequestReady'; requestId: string; at?: string }
  | { type: 'declineRequest'; requestId: string; note: string; at?: string }
  | { type: 'resubmitRequest'; requestId: string; at?: string }
  | { type: 'nudgeIT'; waitingId: string; at?: string }
  | { type: 'sendReminder'; hireId: string; at?: string }
  | { type: 'jumpToStartDay' }
  | { type: 'fastForwardPrimary'; at?: string }
  | { type: 'jumpToNextPhase' }
  | { type: 'moveStartDate'; hireId: string; startDate: ISODate }
  | { type: 'dismissStartMoved'; hireId: string }
  | { type: 'setView'; view: View }
  | { type: 'resetData'; realToday?: ISODate }
  | { type: 'replace'; state: AppState }

const nowStamp = () => new Date().toISOString()

function updateTask(state: AppState, taskId: string, patch: (t: AppState['tasks'][number]) => AppState['tasks'][number]): AppState {
  return { ...state, tasks: state.tasks.map((t) => (t.id === taskId ? patch(t) : t)) }
}

function updateRequest(state: AppState, requestId: string, patch: Partial<AccessRequest>): AppState {
  return {
    ...state,
    requests: state.requests.map((r) => (r.id === requestId ? { ...r, ...patch } : r)),
  }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'completeTask': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      // Idempotent: a double click (or a stale tab) can never complete twice.
      if (!task || task.doneAt) return state
      // A steps task is only done once every step is checked.
      if (task.kind === 'steps' && (task.stepsDone?.length ?? 0) < (task.steps?.length ?? 0)) return state
      const at = action.at ?? nowStamp()
      let next = updateTask(state, task.id, (t) => ({
        ...t,
        doneAt: at,
        data: action.data ?? t.data,
      }))
      if (task.approval) next = reducer(next, { type: 'submitAccessRequest', taskId: task.id, at })
      if (task.handoff && !next.waiting.some((w) => w.id === `${task.hireId}:wait:${task.handoff!.key}`)) {
        const item: WaitingItem = {
          id: `${task.hireId}:wait:${task.handoff.key}`,
          hireId: task.hireId,
          key: task.handoff.key,
          title: task.handoff.title,
          owner: task.handoff.owner,
          since: state.today,
          readyOn: addDays(state.today, task.handoff.readyAfterDays),
          autoReady: true,
          detail: `${task.handoff.owner} is setting this up, usually ready {day}.`,
        }
        next = { ...next, waiting: [...next.waiting, item] }
      }
      return next
    }

    case 'updateTaskData': {
      // Editing a finished task changes what it saved, never whether it is done,
      // so progress counts and the plant stay exactly where they were.
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task || !task.doneAt) return state
      let next = updateTask(state, task.id, (t) => ({ ...t, data: action.data }))
      const req = next.requests.find((r) => r.taskId === task.id)
      if (req) {
        const at = action.at ?? nowStamp()
        next = updateRequest(next, req.id, {
          details: action.data,
          updatedAt: at,
          // Fixing a declined request sends it straight back to the manager.
          ...(req.status === 'declined' ? { status: 'waitingOnManager' as const, note: undefined } : {}),
        })
      }
      return next
    }

    case 'undoTask': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task || !task.doneAt) return state
      let next = updateTask(state, task.id, (t) => ({ ...t, doneAt: undefined }))
      // Withdraw a request the manager hasn't approved yet; approved access stays.
      next = {
        ...next,
        requests: next.requests.filter(
          (r) => !(r.taskId === task.id && (r.status === 'waitingOnManager' || r.status === 'declined')),
        ),
      }
      if (task.handoff) {
        const id = `${task.hireId}:wait:${task.handoff.key}`
        next = { ...next, waiting: next.waiting.filter((w) => w.id !== id) }
      }
      return next
    }

    case 'toggleStep': {
      return updateTask(state, action.taskId, (t) => {
        if (!t.steps || action.step < 0 || action.step >= t.steps.length) return t
        const done = new Set(t.stepsDone ?? [])
        if (done.has(action.step)) done.delete(action.step)
        else done.add(action.step)
        return { ...t, stepsDone: [...done].sort((a, b) => a - b) }
      })
    }

    case 'submitAccessRequest': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task?.approval) return state
      // One live request per task.
      if (state.requests.some((r) => r.taskId === task.id && r.status !== 'declined')) return state
      const at = action.at ?? nowStamp()
      const existing = state.requests.find((r) => r.taskId === task.id)
      if (existing) {
        return updateRequest(state, existing.id, {
          status: 'waitingOnManager',
          updatedAt: at,
          note: undefined,
          details: task.data ?? existing.details,
        })
      }
      const request: AccessRequest = {
        id: `req:${task.id}`,
        hireId: task.hireId,
        taskId: task.id,
        resource: task.approval.resource,
        // "requested" is the moment of creation; it is handed to the manager at once.
        status: 'waitingOnManager',
        requestedAt: at,
        updatedAt: at,
        details: task.data,
      }
      return { ...state, requests: [...state.requests, request] }
    }

    case 'approveRequest': {
      const r = state.requests.find((x) => x.id === action.requestId)
      if (!r || r.status !== 'waitingOnManager') return state
      return updateRequest(state, r.id, { status: 'approved', updatedAt: action.at ?? nowStamp(), note: undefined })
    }

    case 'markRequestReady': {
      const r = state.requests.find((x) => x.id === action.requestId)
      if (!r || r.status !== 'approved') return state
      return updateRequest(state, r.id, { status: 'ready', updatedAt: action.at ?? nowStamp() })
    }

    case 'declineRequest': {
      const r = state.requests.find((x) => x.id === action.requestId)
      if (!r || r.status !== 'waitingOnManager') return state
      const note = action.note.trim() || 'Needs a small change.'
      return updateRequest(state, r.id, { status: 'declined', note, updatedAt: action.at ?? nowStamp() })
    }

    case 'resubmitRequest': {
      const r = state.requests.find((x) => x.id === action.requestId)
      if (!r || r.status !== 'declined') return state
      return updateRequest(state, r.id, { status: 'waitingOnManager', updatedAt: action.at ?? nowStamp() })
    }

    case 'nudgeIT': {
      return {
        ...state,
        waiting: state.waiting.map((w) =>
          w.id === action.waitingId ? { ...w, nudgedAt: action.at ?? nowStamp() } : w,
        ),
      }
    }

    case 'sendReminder': {
      return {
        ...state,
        hires: state.hires.map((h) =>
          h.id === action.hireId ? { ...h, remindedAt: action.at ?? nowStamp() } : h,
        ),
      }
    }

    case 'fastForwardPrimary': {
      // Demo shortcut: finish the primary hire's pre-start tasks the way she would,
      // ending with the request to the manager, so the Manager view can be shown quickly.
      const hire = getHire(state, state.primaryHireId)
      if (!hire) return state
      const at = action.at ?? nowStamp()
      const open = state.tasks
        .filter((t) => t.hireId === hire.id && t.phase === 'preStart' && !t.doneAt)
        .sort((a, b) => a.order - b.order)
      let next = state
      for (const t of open) {
        if (t.kind === 'steps' && t.steps) {
          next = updateTask(next, t.id, (x) => ({ ...x, stepsDone: x.steps!.map((_, i) => i) }))
        }
        const data: TaskData | undefined =
          t.key === 'confirm-details' && hire.onFile
            ? { ...hire.onFile, preferredName: '' }
            : t.kind === 'handoff'
              ? { finishedAt: at }
              : t.kind === 'request'
                ? { tools: (t.choices ?? []).slice(0, 2).map((c) => c.value) }
                : undefined
        next = reducer(next, { type: 'completeTask', taskId: t.id, data, at })
      }
      return next
    }

    case 'jumpToStartDay': {
      const hire = getHire(state, state.primaryHireId)
      if (!hire || daysBetween(state.today, hire.startDate) <= 0) return state
      return { ...state, today: hire.startDate }
    }

    case 'jumpToNextPhase': {
      const next = getNextLockedPhase(state, state.primaryHireId)
      const hire = getHire(state, state.primaryHireId)
      if (!hire) return state
      // After the last phase opens, jump to day 30.
      const target = next ? next.opensOn : addDays(hire.startDate, 30)
      if (daysBetween(state.today, target) <= 0) return state
      return { ...state, today: target }
    }

    case 'moveStartDate': {
      const hire = getHire(state, action.hireId)
      if (!hire || hire.startDate === action.startDate) return state
      const delta = daysBetween(hire.startDate, action.startDate)
      return {
        ...state,
        hires: state.hires.map((h) =>
          h.id === hire.id
            ? {
                ...h,
                startDate: action.startDate,
                previousStartDate: h.previousStartDate ?? h.startDate,
              }
            : h,
        ),
        // Task deadlines are offsets, so they follow automatically.
        // Waiting items tied to the start date move too.
        waiting: state.waiting.map((w) =>
          w.hireId === hire.id && w.anchoredToStart
            ? { ...w, readyOn: addDays(w.readyOn, delta), since: addDays(w.since, delta) }
            : w,
        ),
      }
    }

    case 'dismissStartMoved': {
      return {
        ...state,
        hires: state.hires.map((h) =>
          h.id === action.hireId ? { ...h, previousStartDate: undefined } : h,
        ),
      }
    }

    case 'setView':
      return state.view === action.view ? state : { ...state, view: action.view }

    case 'resetData':
      return createSeed(action.realToday)

    case 'replace':
      return action.state
  }
}
