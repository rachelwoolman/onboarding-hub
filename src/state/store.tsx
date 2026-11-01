import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { reducer, type Action } from '../data/reducer'
import { clearAllDrafts } from '../data/drafts'
import { loadState, parseState, saveState, STORAGE_KEY } from '../data/storage'
import type { AppState, ISODate, TaskData, View } from '../data/types'

/** How long simulated IT takes to provision after a manager approves. */
export const IT_PROVISION_MS = 3500

interface Actions {
  completeTask: (taskId: string, data?: TaskData) => void
  updateTaskData: (taskId: string, data: TaskData) => void
  deferTask: (taskId: string) => void
  undoTask: (taskId: string) => void
  toggleStep: (taskId: string, step: number) => void
  submitAccessRequest: (taskId: string) => void
  approveRequest: (requestId: string) => void
  declineRequest: (requestId: string, note: string) => void
  resubmitRequest: (requestId: string) => void
  nudgeIT: (waitingId: string) => void
  sendReminder: (hireId: string) => void
  jumpToStartDay: () => void
  jumpToNextPhase: () => void
  moveStartDate: (hireId: string, startDate: ISODate) => void
  dismissStartMoved: (hireId: string) => void
  setView: (view: View) => void
  resetData: () => void
}

interface Store {
  state: AppState
  actions: Actions
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  // Persist every change.
  useEffect(() => saveState(state), [state])

  // Keep other tabs/windows in sync (e.g. Chloe in one tab, Mateo in another).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const next = parseState(e.newValue)
      if (next) dispatch({ type: 'replace', state: next })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Simulated IT: approved requests become ready a moment later.
  const approvedIds = state.requests
    .filter((r) => r.status === 'approved')
    .map((r) => r.id)
    .join('|')
  useEffect(() => {
    if (!approvedIds) return
    const timers = approvedIds
      .split('|')
      .map((id) => window.setTimeout(() => dispatch({ type: 'markRequestReady', requestId: id }), IT_PROVISION_MS))
    return () => timers.forEach(window.clearTimeout)
  }, [approvedIds])

  const actions = useMemo<Actions>(() => {
    const d = (a: Action) => dispatch(a)
    return {
      completeTask: (taskId, data) => d({ type: 'completeTask', taskId, data }),
      updateTaskData: (taskId, data) => d({ type: 'updateTaskData', taskId, data }),
      deferTask: (taskId) => d({ type: 'deferTask', taskId }),
      undoTask: (taskId) => d({ type: 'undoTask', taskId }),
      toggleStep: (taskId, step) => d({ type: 'toggleStep', taskId, step }),
      submitAccessRequest: (taskId) => d({ type: 'submitAccessRequest', taskId }),
      approveRequest: (requestId) => d({ type: 'approveRequest', requestId }),
      declineRequest: (requestId, note) => d({ type: 'declineRequest', requestId, note }),
      resubmitRequest: (requestId) => d({ type: 'resubmitRequest', requestId }),
      nudgeIT: (waitingId) => d({ type: 'nudgeIT', waitingId }),
      sendReminder: (hireId) => d({ type: 'sendReminder', hireId }),
      jumpToStartDay: () => d({ type: 'jumpToStartDay' }),
      jumpToNextPhase: () => d({ type: 'jumpToNextPhase' }),
      moveStartDate: (hireId, startDate) => d({ type: 'moveStartDate', hireId, startDate }),
      dismissStartMoved: (hireId) => d({ type: 'dismissStartMoved', hireId }),
      setView: (view) => d({ type: 'setView', view }),
      resetData: () => {
        clearAllDrafts()
        d({ type: 'resetData' })
      },
    }
  }, [])

  const value = useMemo(() => ({ state, actions }), [state, actions])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}
