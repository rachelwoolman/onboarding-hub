import { useEffect, useRef, useState } from 'react'
import { weekday } from '../data/dates'
import {
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
} from '../data/selectors'
import type { Hire, PhaseId, PlantStage } from '../data/types'
import { useStore } from '../state/store'
import { FocusCard } from '../components/FocusCard'
import { FooterLine } from '../components/FooterLine'
import { JourneyPath } from '../components/JourneyPath'
import { Plant } from '../components/Plant'
import { Bloom, Chip, LeafIcon } from '../components/ui'

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
  const counts = phaseCounts(state, hireId)
  const minutes = minutesLeft(state, hireId)
  const upNext = getUpNext(state, hireId)
  const waiting = waitingFor(state, hireId)
  const allRequests = state.requests.filter((r) => r.hireId === hireId)
  const doneTasks =
    page.kind === 'focus' ? phaseTasks(state, hireId, page.phase).filter(isDone) : []

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
  const currentStop = focus ? stops[focus.stop] : undefined

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pt-8 sm:px-8 sm:pt-14">
      {hire.previousStartDate && (
        <StartMovedBanner hire={hire} onDismiss={() => actions.dismissStartMoved(hire.id)} />
      )}

      {/* Header ------------------------------------------------------------ */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 pt-2 sm:pt-4">
          <Headline page={page} hire={hire} />
          <p className="mt-3 text-pretty text-[17px] leading-relaxed text-ink-soft sm:text-lg">
            <Subline page={page} minutes={minutes} startDay={startDay} started={state.today >= hire.startDate} />
          </p>
        </div>
        <figure className="relative -mr-2 flex shrink-0 flex-col items-center sm:mr-0">
          <Plant stage={stage} className="size-24 sm:size-32" />
          {bloomKey > 0 && <Bloom key={bloomKey} />}
          {counts.total > 0 && (
            <figcaption className="-mt-1 text-xs text-ink-muted">
              {counts.done} of {counts.total} done
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

          <div className="mt-2">
            <FocusCard
              key={focus.id}
              task={focus}
              stopName={currentStop.name}
              remainingInStop={currentStop.remaining}
              totalInStop={currentStop.total}
              overdue={overdueLabel(hire, focus, state.today)}
              onDone={actions.completeTask}
              onToggleStep={actions.toggleStep}
            />
          </div>

          {upNext.length > 0 && <UpNext titles={upNext.map((t) => t.short)} />}
        </>
      )}

      {page.kind === 'allSetForStart' && (
        <NextUpCard className="mt-12" label={`Next up: ${startDay} 9:30`} title="Meet your manager" />
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
      {page.kind !== 'empty' && page.kind !== 'fullyOnboarded' && (
        <div className="mt-10 sm:mt-12">
          <FooterLine
            done={doneTasks}
            waiting={waiting}
            requests={allRequests}
            managerName={hire.managerName}
            onUndo={actions.undoTask}
            onResubmit={actions.resubmitRequest}
          />
        </div>
      )}
    </main>
  )
}

function Headline({ page, hire }: { page: ReturnType<typeof hirePageState>; hire: Hire }) {
  const serif = 'font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]'
  const text = {
    focus: (
      <>
        Hi <span className="font-semibold">{hire.firstName}</span>{' '}
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
    empty: <>Hi {hire.firstName}</>,
  }[page.kind]
  return (
    <h1 className={`${serif} text-balance`} style={{ fontVariationSettings: '"SOFT" 100, "opsz" 96' }}>
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

function NextUpCard({ label, title, className = '' }: { label: string; title: string; className?: string }) {
  return (
    <div className={`flex animate-card-in items-center gap-4 rounded-card bg-paper px-6 py-5 shadow-card ${className}`}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sage text-leaf-deep">
        <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
          <rect x="3" y="4.5" width="14" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 8.5h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-leaf-deep">{label}</p>
        <p className="mt-0.5 text-[17px] font-semibold text-ink">{title}</p>
      </div>
    </div>
  )
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
