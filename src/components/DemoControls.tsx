import { addDays, daysBetween, weekday } from '../data/dates'
import { getHire, getNextLockedPhase } from '../data/selectors'
import { useStore } from '../state/store'

/** Tiny, deliberately quiet footer for driving the demo. */
export function DemoControls() {
  const { state, actions } = useStore()
  const hire = getHire(state, state.primaryHireId)
  if (!hire) return null

  const day = daysBetween(hire.startDate, state.today)
  const next = getNextLockedPhase(state, hire.id)
  const beforeStart = day < 0

  let jumpLabel: string | null
  if (beforeStart) jumpLabel = `Jump to ${weekday(hire.startDate)}`
  else if (next) jumpLabel = `Jump to day ${daysBetween(hire.startDate, next.opensOn) + 1}`
  else jumpLabel = day < 30 ? 'Jump to day 30' : null

  const clock = beforeStart
    ? `${weekday(state.today)}, ${-day} day${day === -1 ? '' : 's'} before start`
    : `${weekday(state.today)}, day ${day + 1}`

  const btn =
    'rounded-full px-3 py-1.5 font-medium text-ink-soft ring-1 ring-line transition hover:bg-paper hover:text-ink'

  return (
    <footer className="mx-auto mt-auto w-full max-w-5xl px-5 pb-6 pt-16 sm:px-8">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-line pt-4 text-xs text-ink-muted">
        <span className="font-semibold uppercase tracking-[0.08em]">Demo</span>
        <span aria-live="polite">{clock}</span>
        {jumpLabel && (
          <button
            type="button"
            className={btn}
            onClick={() => (beforeStart ? actions.jumpToStartDay() : actions.jumpToNextPhase())}
          >
            {jumpLabel}
          </button>
        )}
        <button
          type="button"
          className={btn}
          onClick={() => actions.moveStartDate(hire.id, addDays(hire.startDate, 1))}
        >
          Move start +1 day
        </button>
        <button type="button" className={btn} onClick={actions.resetData}>
          Reset data
        </button>
      </div>
    </footer>
  )
}
