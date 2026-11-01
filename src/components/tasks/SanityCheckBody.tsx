import { fill } from '../../data/copy'
import type { BodyProps } from './TaskBodies'
import { CheckIcon } from '../ui'
import { useToast } from '../useToast'

/**
 * "Your Monday sanity check": four one-line facts she taps to confirm ("Got it").
 * Progress saves as she goes (same as steps). No article to read.
 */
export function SanityCheckBody({ task, submit, footer, onToggleStep, startDay, managerName }: BodyProps) {
  const ctx = { day: startDay, manager: managerName }
  const rows = (task.steps ?? []).map((t) => fill(t, ctx))
  const done = new Set(task.stepsDone ?? [])
  const all = rows.length > 0 && done.size === rows.length
  const toast = useToast()

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (all) submit()
      }}
    >
      <p className="mb-2 text-center text-[13px] text-ink-muted" aria-live="polite">
        {done.size} of {rows.length} confirmed
      </p>
      <ul className="space-y-2">
        {rows.map((label, i) => {
          const got = done.has(i)
          return (
            <li key={i}>
              <button
                type="button"
                data-autofocus={i === 0 ? true : undefined}
                aria-pressed={got}
                onClick={() => onToggleStep(task.id, i)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] transition duration-300 ${
                  got ? 'bg-sage/70 text-ink-soft' : 'bg-cream/70 text-ink hover:bg-sage/40'
                }`}
              >
                <span className="flex-1">{label}</span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold transition duration-300 ${
                    got ? 'bg-leaf text-paper' : 'bg-paper text-leaf-deep ring-1 ring-sage-deep'
                  }`}
                >
                  {got && <CheckIcon className="size-3" />}
                  Got it
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {footer({
        label: `I’m ready for ${startDay}`,
        disabled: !all,
        disabledHint: 'Tap each line to confirm it.',
        secondary: (
          <button
            type="button"
            onClick={() => toast.show(`Mock only: in production this adds ${startDay} 9:15 to your calendar.`)}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium text-leaf-deep ring-1 ring-sage-deep transition hover:bg-sage"
          >
            <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
              <rect x="2.5" y="3.5" width="11" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Add to calendar
          </button>
        ),
      })}
      {toast.node}
    </form>
  )
}
