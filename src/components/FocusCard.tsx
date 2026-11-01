import { useRef, useState } from 'react'
import { CheckIcon, ChevronIcon, Chip, ClockIcon, PrimaryButton } from './ui'
import type { Task } from '../data/types'

interface FocusCardProps {
  task: Task
  stopName: string
  remainingInStop: number
  totalInStop: number
  /** e.g. "Was due Saturday." when overdue. */
  overdue: string | null
  onDone: (taskId: string) => void
  onToggleStep: (taskId: string, step: number) => void
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** ONE task. Re-key by task id so each new task slides in fresh. */
export function FocusCard({
  task,
  stopName,
  remainingInStop,
  totalInStop,
  overdue,
  onDone,
  onToggleStep,
}: FocusCardProps) {
  const [leaving, setLeaving] = useState(false)
  const [stepsOpen, setStepsOpen] = useState(false)
  const fired = useRef(false)

  const steps = task.steps ?? []
  const stepsDone = new Set(task.stepsDone ?? [])
  const allStepsDone = steps.length > 0 && stepsDone.size === steps.length

  const markDone = () => {
    // Guard double clicks: the card is already on its way out.
    if (fired.current) return
    fired.current = true
    setLeaving(true)
    window.setTimeout(() => onDone(task.id), prefersReducedMotion() ? 0 : 260)
  }

  return (
    <article
      aria-labelledby={`task-${task.id}`}
      className={`relative rounded-card bg-paper px-6 pb-7 pt-6 shadow-card sm:px-10 sm:pb-9 sm:pt-8 ${
        leaving ? 'animate-card-out' : 'animate-card-in'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-leaf-deep">
          {stopName}
        </span>
        <Chip>
          <ClockIcon className="size-3" />
          {task.minutes} min
        </Chip>
      </div>

      <div className="mx-auto mt-6 max-w-md text-center sm:mt-7">
        <h2
          id={`task-${task.id}`}
          className="text-balance text-[22px] font-semibold leading-snug tracking-tight text-ink sm:text-[26px]"
        >
          {task.title}
        </h2>
        <p className="mt-2 text-pretty text-[15px] text-ink-soft">{task.why}</p>

        {overdue && (
          <p className="mx-auto mt-4 inline-flex rounded-full bg-amber-soft px-3.5 py-1.5 text-[13px] font-medium text-amber">
            {overdue} No worries, it only takes {task.minutes} min.
          </p>
        )}
      </div>

      {steps.length > 0 && (
        <div className="mx-auto mt-5 max-w-sm">
          <button
            type="button"
            onClick={() => setStepsOpen((o) => !o)}
            aria-expanded={stepsOpen}
            aria-controls={`steps-${task.id}`}
            className="mx-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-leaf-deep transition hover:bg-sage"
          >
            {stepsOpen ? 'Hide steps' : `${steps.length} quick steps`}
            {stepsDone.size > 0 && !stepsOpen && (
              <span className="text-ink-muted">
                · {stepsDone.size} of {steps.length}
              </span>
            )}
            <ChevronIcon open={stepsOpen} className="size-3.5" />
          </button>
          <div className="expand" data-open={stepsOpen} id={`steps-${task.id}`}>
            <div>
              <ol className="mt-3 space-y-1 rounded-2xl bg-cream/70 p-2">
                {steps.map((label, i) => {
                  const checked = stepsDone.has(i)
                  return (
                    <li key={i}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition hover:bg-paper">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={checked}
                          onChange={() => onToggleStep(task.id, i)}
                          tabIndex={stepsOpen ? 0 : -1}
                        />
                        <span
                          aria-hidden="true"
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full transition duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-leaf ${
                            checked ? 'bg-leaf text-paper' : 'bg-paper ring-1 ring-sage-deep'
                          }`}
                        >
                          {checked && <CheckIcon className="size-3" />}
                        </span>
                        <span className={checked ? 'text-ink-muted line-through decoration-ink-muted/40' : 'text-ink'}>
                          {label}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-col items-center gap-3">
        <PrimaryButton
          onClick={markDone}
          disabled={leaving}
          className={allStepsDone ? 'ring-4 ring-sage' : ''}
        >
          Mark done
        </PrimaryButton>
        <p className="text-xs text-ink-muted">
          {remainingInStop} of {totalInStop} left in this stop
        </p>
      </div>
    </article>
  )
}
