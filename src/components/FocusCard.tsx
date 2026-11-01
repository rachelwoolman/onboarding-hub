import { createElement, useEffect, useRef, useState } from 'react'
import { clearDraft } from '../data/drafts'
import { taskSummary } from '../data/summaries'
import type { Task, TaskData } from '../data/types'
import { bodyFor } from './tasks/bodyFor'
import { SimpleBody, type FooterOpts } from './tasks/TaskBodies'
import { CheckIcon, Chip, ClockIcon, PrimaryButton } from './ui'

/** Feels real without being slow. */
export const SAVING_MS = 400
const SAVED_FLASH_MS = 700
const LEAVE_MS = 260

type Phase = 'idle' | 'saving' | 'saved' | 'leaving'

interface FocusCardProps {
  task: Task
  mode?: 'focus' | 'edit'
  stopName: string
  remainingInStop: number
  totalInStop: number
  overdue: string | null
  managerName: string
  startDay?: string
  /** Move focus into the card when it appears (not on first page load). */
  autoFocus?: boolean
  canDefer?: boolean
  onComplete: (taskId: string, data?: TaskData) => void
  onSaveEdit?: (taskId: string, data: TaskData) => void
  onCancelEdit?: () => void
  onDefer?: (taskId: string) => void
  onToggleStep: (taskId: string, step: number) => void
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** ONE task, done in place. Re-key by task id so each new task slides in fresh. */
export function FocusCard({
  task,
  mode = 'focus',
  stopName,
  remainingInStop,
  totalInStop,
  overdue,
  managerName,
  startDay = 'Monday',
  autoFocus = false,
  canDefer = false,
  onComplete,
  onSaveEdit,
  onCancelEdit,
  onDefer,
  onToggleStep,
}: FocusCardProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [savedLine, setSavedLine] = useState<string | null>(null)
  const busy = useRef(false)
  const cardRef = useRef<HTMLElement>(null)
  const timers = useRef<number[]>([])
  const editing = mode === 'edit'
  const idPrefix = `${editing ? 'edit' : 'task'}-${task.key}`
  const draftKey = editing ? `${task.id}:edit` : task.id

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  // Focus the first field when the card opens after an interaction.
  useEffect(() => {
    if (!autoFocus || !cardRef.current) return
    const target = cardRef.current.querySelector<HTMLElement>(
      'input:not([type=hidden]):not([disabled]), textarea, select, [role=region][tabindex]',
    )
    // Cards without fields (handoffs) focus their primary button instead.
    const fallback = cardRef.current.querySelector<HTMLElement>('button[type=submit]:not([disabled])')
    ;(target ?? fallback ?? cardRef.current.querySelector<HTMLElement>('h2'))?.focus({ preventScroll: false })
  }, [autoFocus])

  // All timers are tracked, so nothing fires after the card unmounts (e.g. Reset mid-save).
  const later = (fn: () => void, ms: number, shortenForReducedMotion = true) => {
    const wait = shortenForReducedMotion && reducedMotion() ? Math.min(ms, 50) : ms
    timers.current.push(window.setTimeout(fn, wait))
  }

  const submit = (data?: TaskData) => {
    // One submission only, however many clicks or Enter presses.
    if (busy.current) return
    busy.current = true
    setPhase('saving')
    later(() => {
      clearDraft(draftKey)
      const line = data ? taskSummary({ ...task, data }) : null
      setSavedLine(line)
      setPhase('saved')
      later(() => {
        if (editing) {
          onSaveEdit?.(task.id, data ?? {})
          return
        }
        setPhase('leaving')
        later(() => onComplete(task.id, data), LEAVE_MS)
      }, line || task.kind === 'request' ? SAVED_FLASH_MS : 250)
    }, SAVING_MS, false)
  }

  const savedLabel = task.kind === 'request' && !editing ? `Sent to ${managerName}` : 'Saved'

  const footer = ({ label, disabled, disabledHint, secondary, demoHint }: FooterOpts) => (
    <div className="mt-8 flex flex-col items-center gap-3">
      {phase === 'saved' || phase === 'leaving' ? (
        <div className="flex min-h-12 flex-col items-center justify-center gap-1" role="status">
          <span className="inline-flex items-center gap-2 rounded-full bg-sage px-5 py-3 text-[15px] font-semibold text-leaf-deep">
            <CheckIcon className="size-4" /> {savedLabel}
          </span>
          {savedLine && <span className="text-[13px] text-ink-muted">{savedLine}</span>}
        </div>
      ) : (
        <PrimaryButton type="submit" disabled={disabled || phase !== 'idle'} aria-disabled={disabled || phase !== 'idle'}>
          {phase === 'saving' ? (
            <>
              <Spinner /> Saving…
            </>
          ) : (
            label
          )}
        </PrimaryButton>
      )}
      {disabled && disabledHint && phase === 'idle' && <p className="text-xs text-ink-muted">{disabledHint}</p>}
      {editing ? (
        <button
          type="button"
          onClick={onCancelEdit}
          disabled={phase !== 'idle'}
          className="rounded-full px-3 py-1.5 text-[13px] text-ink-muted transition hover:text-ink"
        >
          Cancel
        </button>
      ) : (
        <>
          {phase === 'idle' && secondary}
          <p className="text-xs text-ink-muted">
            {remainingInStop} of {totalInStop} left in this stop
          </p>
        </>
      )}
      {demoHint && <p className="text-[11px] tracking-wide text-ink-muted/80">Demo: use fake info</p>}
    </div>
  )

  const Body = bodyFor(task)
  const isForm = Body !== SimpleBody

  return (
    <article
      ref={cardRef}
      aria-labelledby={`${idPrefix}-title`}
      className={`relative rounded-card bg-paper px-5 pb-7 pt-6 shadow-card sm:px-10 sm:pb-9 sm:pt-8 ${
        phase === 'leaving' ? 'animate-card-out' : 'animate-card-in'
      } ${editing ? 'ring-2 ring-sage-deep' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-leaf-deep">
          {editing ? `Editing · ${stopName}` : stopName}
        </span>
        {!editing && (
          <Chip>
            <ClockIcon className="size-3" />
            {task.minutes} min
          </Chip>
        )}
      </div>

      <div className="mx-auto mt-5 max-w-md text-center sm:mt-6">
        <h2
          id={`${idPrefix}-title`}
          tabIndex={-1}
          className="text-balance text-[22px] font-semibold leading-snug tracking-tight text-ink focus:outline-none sm:text-[26px]"
        >
          {task.title}
        </h2>
        <p className="mt-2 text-pretty text-[15px] text-ink-soft">{task.why}</p>
        {overdue && !editing && (
          <p className="mx-auto mt-4 inline-flex rounded-full bg-amber-soft px-3.5 py-1.5 text-[13px] font-medium text-amber">
            {overdue} No worries, it only takes {task.minutes} min.
          </p>
        )}
      </div>

      <div className={`mx-auto max-w-md ${isForm ? 'mt-7' : 'mt-2'}`}>
        {/* submit reads refs only when called from an event, never during render. */}
        {/* eslint-disable-next-line react/refs */}
        {createElement(Body, {
          task,
          mode,
          managerName,
          startDay,
          idPrefix,
          draftKey,
          submit,
          footer,
          onToggleStep,
          onDefer: canDefer && onDefer ? () => onDefer(task.id) : undefined,
        })}
      </div>
    </article>
  )
}

function Spinner() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 animate-spin" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
