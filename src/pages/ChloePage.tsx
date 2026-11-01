import { useEffect, useRef, useState, type Ref } from 'react'
import { weekday } from '../data/dates'
import {
  displayName,
  getFocusTask,
  getHire,
  getStops,
  getUpNext,
  hirePageState,
  isDone,
  minutesLeft,
  overdueLabel,
  phaseCounts,
  phaseTasks,
  plantStage,
  waitingFor,
  activeRequest,
  comingUp,
} from '../data/selectors'
import { clearDraft, EDITING_KEY } from '../data/drafts'
import { phaseTemplate } from '../data/templates'
import type { Hire, PhaseId, PlantStage, TaskData } from '../data/types'
import { useStore } from '../state/store'
import { FocusCard } from '../components/FocusCard'
import { FooterLine } from '../components/FooterLine'
import { JourneyPath } from '../components/JourneyPath'
import { Plant } from '../components/Plant'
import { Bloom, CheckIcon, ChevronIcon, Chip, ClockIcon, LeafIcon } from '../components/ui'
import { ComingUpCard } from '../components/ComingUpCard'
import { TrackerSteps } from '../components/RequestTracker'
import { fill } from '../data/copy'

interface Moment {
  id: number
  text: string
}

export function ChloePage() {
  const { state, actions } = useStore()
  const hireId = state.primaryHireId
  const hire = getHire(state, hireId)

  const page = hirePageState(state, hireId)
  const focus = getFocusTask(state, hireId)
  const stops = getStops(state, hireId)
  const phaseCount = phaseCounts(state, hireId)
  const minutes = minutesLeft(state, hireId)
  const upNext = getUpNext(state, hireId)
  const waiting = waitingFor(state, hireId)
  const allRequests = state.requests.filter((r) => r.hireId === hireId)
  const listPhase: PhaseId | null =
    page.kind === 'focus' ? page.phase : page.kind === 'allSetForStart' ? 'preStart' : null
  const listTasks = listPhase ? phaseTasks(state, hireId, listPhase) : []
  const doneTasks = listTasks.filter(isDone)
  // On the all-set screen the caption still reads "7 of 7 done", so the number never vanishes.
  const counts = page.kind === 'allSetForStart' ? { done: doneTasks.length, total: listTasks.length } : phaseCount
  const name = displayName(state, hireId)
  const allSet = page.kind === 'allSetForStart'
  const request = activeRequest(state, hireId)
  // All-set screen: one small in-place panel at a time (completed list or tracker).
  const [openPanel, setOpenPanel] = useState<'done' | 'request' | null>(null)

  // Editing a finished task happens in the card slot, one thing at a time.
  // Remembered for this tab, so a refresh mid-edit reopens the same card.
  const [editingId, setEditingIdState] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem(EDITING_KEY)
    } catch {
      return null
    }
  })
  const setEditingId = (id: string | null) => {
    setEditingIdState(id)
    try {
      if (id) window.sessionStorage.setItem(EDITING_KEY, id)
      else window.sessionStorage.removeItem(EDITING_KEY)
    } catch {
      // ignore
    }
  }
  const editing = editingId ? state.tasks.find((t) => t.id === editingId && t.doneAt) : undefined
  // A stale marker (task undone, data reset) must never pop an edit card open later.
  if (editingId && !editing) setEditingId(null)
  // Only move focus after she has done something (never on first page load).
  const interacted = useRef(false)
  const [spotlightRequest, setSpotlightRequest] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const complete = (taskId: string, data?: TaskData) => {
    interacted.current = true
    const task = state.tasks.find((t) => t.id === taskId)
    if (task?.kind === 'request') setSpotlightRequest(`req:${taskId}`)
    actions.completeTask(taskId, data)
  }
  const startEdit = (taskId: string) => {
    interacted.current = true
    setEditingId(taskId)
    window.requestAnimationFrame(() =>
      document.getElementById('task-slot')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }
  const saveEdit = (taskId: string, data: TaskData) => {
    actions.updateTaskData(taskId, data)
    setEditingId(null)
  }
  const cancelEdit = () => {
    if (editingId) clearDraft(`${editingId}:edit`)
    setEditingId(null)
  }

  // When the last pre-start task is done, move focus to the new headline.
  useEffect(() => {
    if (interacted.current && page.kind !== 'focus') headingRef.current?.focus()
  }, [page.kind])

  let stage: PlantStage = plantStage(state, hireId)
  if (page.kind === 'caughtUp') stage = 'sprout'
  if (page.kind === 'empty') stage = 'seed'

  // Celebrate a finished stop, or the whole list, with a short moment + petals.
  const [moment, setMoment] = useState<Moment | null>(null)
  const [bloomKey, setBloomKey] = useState(0)
  const prev = useRef<{ phase: string; doneStops: Set<number>; kind: string } | null>(null)
  const doneStopsKey = stops.filter((s) => s.done).map((s) => s.index).join(',')
  const phaseKey = page.kind === 'focus' ? page.phase : page.kind

  useEffect(() => {
    const doneStops = new Set(doneStopsKey ? doneStopsKey.split(',').map(Number) : [])
    const before = prev.current
    prev.current = { phase: phaseKey, doneStops, kind: page.kind }
    if (!before) return
    if (before.kind === 'focus' && page.kind !== 'focus' && page.kind !== 'empty') {
      setBloomKey((k) => k + 1)
      return
    }
    if (before.phase !== phaseKey) return
    const newlyDone = [...doneStops].find((i) => !before.doneStops.has(i))
    if (newlyDone === undefined) return
    const finished = stops[newlyDone]
    const next = stops.find((s) => s.current)
    if (!finished || !next) return
    setMoment({ id: Date.now(), text: `${finished.name} done! Next: ${next.name}` })
    setBloomKey((k) => k + 1)
    // stops is derived from doneStopsKey/phaseKey, which are the real dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneStopsKey, phaseKey, page.kind])

  useEffect(() => {
    if (!moment) return
    const t = window.setTimeout(() => setMoment(null), 3200)
    return () => window.clearTimeout(t)
  }, [moment])

  if (!hire) return <EmptyPlan name="there" />

  const startDay = weekday(hire.startDate)
  const copy = { day: startDay, manager: hire.managerName }
  const currentStop = focus ? stops[focus.stop] : undefined

  // Rendered inline (not as a nested component type) so it never remounts on re-render.
  const editCard = editing ? (
      <FocusCard
        key={`edit-${editing.id}`}
        task={editing}
        mode="edit"
        stopName={phaseTemplate(hire.role, editing.phase).stops[editing.stop]?.name ?? ''}
        overdue={null}
        managerName={hire.managerName}
        startDay={startDay}
        autoFocus
        onComplete={() => {}}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
        onToggleStep={actions.toggleStep}
      />
    ) : null

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pt-8 sm:px-8 sm:pt-14">
      {hire.previousStartDate && (
        <StartMovedBanner hire={hire} onDismiss={() => actions.dismissStartMoved(hire.id)} />
      )}

      {/* Header ------------------------------------------------------------ */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 pt-2 sm:pt-4">
          <Headline ref={headingRef} page={page} hire={hire} name={name} />
          <p className="mt-3 text-pretty text-[17px] leading-relaxed text-ink-soft sm:text-lg">
            <Subline page={page} minutes={minutes} startDay={startDay} started={state.today >= hire.startDate} />
          </p>
          {allSet && request && (
            <button
              type="button"
              onClick={() => setOpenPanel((p) => (p === 'request' ? null : 'request'))}
              aria-expanded={openPanel === 'request'}
              aria-controls="allset-request"
              className="-ml-2.5 mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[14px] text-mist transition hover:bg-paper hover:text-ink"
            >
              <ClockIcon className="size-3.5" />
              {requestLine(request.resource, request.status, hire.managerName)}
              <ChevronIcon open={openPanel === 'request'} className="size-3" />
            </button>
          )}
        </div>
        <figure className="relative -mr-2 flex shrink-0 flex-col items-center sm:mr-0">
          <Plant stage={stage} className="size-24 sm:size-32" />
          {bloomKey > 0 && <Bloom key={bloomKey} />}
          {counts.total > 0 && (
            <figcaption className="-mt-1 text-xs text-ink-muted">
              {allSet ? (
                <button
                  type="button"
                  onClick={() => setOpenPanel((p) => (p === 'done' ? null : 'done'))}
                  aria-expanded={openPanel === 'done'}
                  aria-controls="allset-done"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition hover:bg-paper hover:text-ink"
                >
                  {counts.done} of {counts.total} done
                  <ChevronIcon open={openPanel === 'done'} className="size-3" />
                </button>
              ) : (
                <>
                  {counts.done} of {counts.total} done
                </>
              )}
            </figcaption>
          )}
        </figure>
      </header>

      {/* Body by state --------------------------------------------------------- */}
      {page.kind === 'focus' && focus && currentStop && (
        <>
          <div className="mt-10 sm:mt-14">
            <JourneyPath stops={stops} />
          </div>

          <div className="mt-6 h-7 text-center sm:mt-8" aria-live="polite">
            {moment && (
              <p
                key={moment.id}
                className="inline-flex animate-fade-up items-center gap-2 text-sm font-medium text-leaf-deep"
              >
                <LeafIcon className="size-3.5 text-leaf-bright" />
                {moment.text}
              </p>
            )}
          </div>

          <div id="task-slot" className="mt-2 scroll-mt-6">
            {editing ? (
              editCard
            ) : (
              <FocusCard
                key={focus.id}
                task={focus}
                stopName={currentStop.name}
                overdue={overdueLabel(hire, focus, state.today)}
                managerName={hire.managerName}
                startDay={startDay}
                autoFocus={interacted.current}
                onComplete={complete}
                onToggleStep={actions.toggleStep}
              />
            )}
          </div>

          {upNext.length > 0 && !editing && <UpNext titles={upNext.map((t) => fill(t.short, { day: startDay, manager: hire.managerName }))} />}
        </>
      )}

      {allSet && (
        <>
          {/* Small in-place details, closed by default. */}
          <div className="expand" data-open={openPanel === 'done'} id="allset-done">
            <div>
              <ul className="mt-6 space-y-0.5 rounded-card bg-paper/70 p-2" aria-label="Finished before day 1">
                {doneTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px]">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sage text-leaf">
                      <CheckIcon className="size-3" />
                    </span>
                    <span className="text-ink-muted line-through decoration-ink-muted/40">{fill(t.title, copy)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {request && (
            <div className="expand" data-open={openPanel === 'request'} id="allset-request">
              <div>
                <div className="mt-6 rounded-card bg-mist-soft/60 px-4 pb-4 pt-1">
                  <TrackerSteps request={request} managerName={hire.managerName} onResubmit={actions.resubmitRequest} />
                </div>
              </div>
            </div>
          )}

          <div id="task-slot" className="mt-10 scroll-mt-6 sm:mt-12">
            {editing ? editCard : <ComingUpCard data={comingUp(state, hireId)} copy={copy} />}
          </div>
        </>
      )}

      {page.kind === 'fullyOnboarded' && (
        <p className="mt-10 text-sm">
          <a
            href="#feedback"
            onClick={(e) => e.preventDefault()}
            className="text-leaf-deep underline decoration-leaf/40 underline-offset-4 hover:decoration-leaf"
          >
            Share feedback
          </a>
        </p>
      )}

      {/* Quiet footer line --------------------------------------------------------- */}
      {page.kind !== 'empty' && page.kind !== 'fullyOnboarded' && !allSet && (
        <div className="mt-10 sm:mt-12">
          <FooterLine
            done={doneTasks}
            waiting={waiting}
            requests={allRequests}
            managerName={hire.managerName}
            onUndo={actions.undoTask}
            onEdit={startEdit}
            editingId={editingId}
            spotlightRequestId={spotlightRequest}
            onResubmit={actions.resubmitRequest}
            startDay={startDay}
          />
        </div>
      )}
    </main>
  )
}

function Headline({
  page,
  hire,
  name,
  ref,
}: {
  page: ReturnType<typeof hirePageState>
  hire: Hire
  name: string
  ref: Ref<HTMLHeadingElement>
}) {
  const serif = 'font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]'
  const text = {
    focus: (
      <>
        Hi <span className="font-semibold">{name}</span>{' '}
        <span className="text-[0.8em]" aria-hidden="true">🌱</span>
      </>
    ),
    allSetForStart: (
      <>
        You’re all set for {weekday(hire.startDate)}! <span className="text-[0.8em]" aria-hidden="true">🌱</span>
      </>
    ),
    caughtUp: <>You’re all caught up for today.</>,
    fullyOnboarded: (
      <>
        You’re fully onboarded <span className="text-[0.8em]" aria-hidden="true">🌱</span>
      </>
    ),
    empty: <>Hi {name}</>,
  }[page.kind]
  return (
    <h1 ref={ref} tabIndex={-1} className={`${serif} text-balance focus:outline-none`} style={{ fontVariationSettings: '"SOFT" 100, "opsz" 96' }}>
      {text}
    </h1>
  )
}

const PHASE_SUBLINE: Record<Exclude<PhaseId, 'preStart'>, string> = {
  day1: 'Welcome to day 1. One thing at a time.',
  week1: 'A few things to settle into your first week.',
  month1: 'Just a few things left for your first month.',
}

function Subline({
  page,
  minutes,
  startDay,
  started,
}: {
  page: ReturnType<typeof hirePageState>
  minutes: number
  startDay: string
  started: boolean
}) {
  const mins = `${minutes} minute${minutes === 1 ? '' : 's'}`
  switch (page.kind) {
    case 'focus':
      if (page.phase === 'preStart' && started)
        return (
          <>
            Welcome! <span className="font-semibold text-ink">{mins}</span> left from before day 1. No rush.
          </>
        )
      return page.phase === 'preStart' ? (
        <>
          <span className="font-semibold text-ink">{mins}</span>{' '}
          and you’re ready for {startDay}.
        </>
      ) : (
        <>{PHASE_SUBLINE[page.phase]}</>
      )
    case 'allSetForStart':
      return <>Nothing left before day 1. Take a breath.</>
    case 'caughtUp':
      return <>Next due: {weekday(page.nextOpens)}.</>
    case 'fullyOnboarded':
      return <>That’s everything. This page has done its job.</>
    case 'empty':
      return <>Your plan is being prepared. Check back soon.</>
  }
}

function UpNext({ titles }: { titles: string[] }) {
  const shown = titles.slice(0, 2)
  const more = titles.length - shown.length
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Up next</span>
      {shown.map((t) => (
        <Chip key={t} tone="muted" className="font-medium">
          {t}
        </Chip>
      ))}
      {more > 0 && (
        <Chip tone="muted" className="font-medium">
          +{more} more
        </Chip>
      )}
    </div>
  )
}

/** One quiet line about an access request still in progress. */
function requestLine(resource: string, status: string, manager: string): string {
  if (status === 'approved') return `${resource} is approved. IT is setting it up.`
  if (status === 'declined') return `${resource} needs a small change.`
  return `${resource} is with ${manager}.`
}

function StartMovedBanner({ hire, onDismiss }: { hire: Hire; onDismiss: () => void }) {
  return (
    <div className="mb-6 flex animate-fade-up items-center gap-3 rounded-2xl bg-sage px-4 py-3 text-sm text-ink-soft">
      <LeafIcon className="size-4 shrink-0 text-leaf" />
      <p className="flex-1">
        Your start date moved to <span className="font-semibold text-ink">{weekday(hire.startDate)}</span>. We
        updated your deadlines.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded-full p-1 text-ink-muted transition hover:bg-paper hover:text-ink"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

function EmptyPlan({ name }: { name: string }) {
  return (
    <main className="mx-auto max-w-[720px] px-5 pt-16 text-center">
      <Plant stage="seed" className="mx-auto size-28" />
      <h1 className="mt-4 font-serif text-4xl text-ink">Hi {name}</h1>
      <p className="mt-3 text-ink-soft">Your plan is being prepared. Check back soon.</p>
    </main>
  )
}
