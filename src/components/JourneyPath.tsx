import type { StopSummary } from '../data/selectors'
import { CheckIcon } from './ui'

/**
 * Three stops joined by a line that fills green up to the current stop.
 */
export function JourneyPath({ stops }: { stops: StopSummary[] }) {
  if (stops.length === 0) return null
  const currentIndex = stops.findIndex((s) => s.current)
  // How far the green line reaches: up to the current stop, or the end if all done.
  const reach = currentIndex === -1 ? stops.length - 1 : currentIndex
  const segments = stops.length - 1
  const fill = segments ? reach / segments : 0

  return (
    <nav aria-label="Your journey" className="relative">
      {/* Track spans from the first circle centre to the last. */}
      <div className="absolute left-[16.667%] right-[16.667%] top-4 h-px bg-line" aria-hidden="true">
        <div
          className="h-[2px] -translate-y-[0.5px] rounded-full bg-leaf/70 transition-[width] duration-700 ease-(--ease-soft)"
          style={{ width: `${fill * 100}%` }}
        />
      </div>

      <ol className="relative grid grid-cols-3">
        {stops.map((stop) => {
          const state = stop.done ? 'done' : stop.current ? 'current' : 'upcoming'
          return (
            <li
              key={stop.index}
              className="flex flex-col items-center text-center"
              aria-current={stop.current ? 'step' : undefined}
            >
              <span
                className={`relative flex size-8 items-center justify-center rounded-full text-xs font-semibold transition duration-500 ${
                  state === 'done'
                    ? 'bg-sage-deep text-leaf-deep'
                    : state === 'current'
                      ? 'bg-leaf text-paper ring-[6px] ring-sage'
                      : 'bg-paper text-ink-muted ring-1 ring-line'
                }`}
              >
                {state === 'done' ? <CheckIcon className="size-3.5" /> : stop.index + 1}
              </span>
              <span
                className={`mt-3 text-[13px] font-semibold leading-tight sm:text-sm ${
                  state === 'current' ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                {stop.name}
              </span>
              <span
                className={`mt-0.5 text-xs ${state === 'current' ? 'text-leaf-deep' : 'text-ink-muted'}`}
              >
                {stop.done ? 'Done' : `${stop.minutesLeft} min`}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
