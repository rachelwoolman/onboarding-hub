import { useState, type ReactNode } from 'react'
import { email, githubUsername, phone, required } from '../../data/validation'
import type { Task, TaskData } from '../../data/types'
import { CheckboxGroup, TextField } from '../forms/fields'
import { useTaskForm } from '../forms/useTaskForm'
import { fill } from '../../data/copy'
import { CheckIcon } from '../ui'

export interface FooterOpts {
  label: string
  disabled?: boolean
  /** Shown under a disabled button, saying what unlocks it. */
  disabledHint?: string
  secondary?: ReactNode
  demoHint?: boolean
}

export interface BodyProps {
  task: Task
  mode: 'focus' | 'edit'
  managerName: string
  /** Weekday of day 1, e.g. "Monday" (it moves when the start date does). */
  startDay: string
  idPrefix: string
  draftKey: string
  submit: (data?: TaskData) => void
  footer: (opts: FooterOpts) => ReactNode
  /** "I'll do this later" (handoff tasks that need things she may not have on hand). */
  onDefer?: () => void
  onToggleStep: (taskId: string, step: number) => void
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
const arr = (v: unknown, fallback: string[] = []) => (Array.isArray(v) ? v : fallback)

// 1. Contact details ---------------------------------------------------------------

export function ContactBody({ task, idPrefix, draftKey, submit, footer, mode }: BodyProps) {
  const saved = task.data ?? {}
  const f = useTaskForm({
    draftKey,
    idPrefix,
    initial: {
      firstName: str(saved.firstName, 'Chloe'),
      lastName: str(saved.lastName, 'Zhang'),
      preferredName: str(saved.preferredName),
      phone: str(saved.phone),
      email: str(saved.email),
    },
    validate: (v) => ({
      firstName: required('We need your legal first name.')(v.firstName),
      lastName: required('We need your legal last name.')(v.lastName),
      phone: phone(v.phone),
      email: email(v.email),
    }),
  })
  // The name is already known, so it's a quick "is this right?" with a way to change it.
  const [editName, setEditName] = useState(false)
  const nameOpen = editName || Boolean(f.error('firstName') || f.error('lastName'))
  const bind = (name: keyof typeof f.values) => ({
    id: f.id(name),
    value: f.values[name],
    onChange: (v: string) => f.set(name, v),
    onBlur: () => f.touch(name),
    error: f.error(name),
  })
  const fullName = `${f.values.firstName} ${f.values.lastName}`.trim()
  return (
    <form noValidate onSubmit={f.handleSubmit((v) => submit({ ...v, phone: v.phone.trim(), email: v.email.trim() }))}>
      <div className="space-y-5">
        {nameOpen ? (
          <div className="space-y-5 rounded-2xl bg-cream/50 p-4 animate-fade-up">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Legal first name" autoComplete="given-name" {...bind('firstName')} />
              <TextField label="Legal last name" autoComplete="family-name" {...bind('lastName')} />
            </div>
            <TextField label="Preferred name" optional hint="What should we call you?" autoComplete="nickname" {...bind('preferredName')} />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-sage/60 px-5 py-4">
            <div className="min-w-0 text-left">
              <p className="text-[13px] font-medium text-leaf-deep">Is this right?</p>
              <p className="mt-0.5 truncate text-[18px] font-semibold text-ink">{fullName || 'Add your name'}</p>
              {f.values.preferredName.trim() && (
                <p className="text-[13px] text-ink-muted">Goes by {f.values.preferredName.trim()}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setEditName(true)
                window.requestAnimationFrame(() => document.getElementById(f.id('firstName'))?.focus())
              }}
              className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium text-leaf-deep underline decoration-leaf/30 underline-offset-4 transition hover:bg-paper"
            >
              Edit name
            </button>
          </div>
        )}
        <TextField label="Mobile phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(555) 010-1234" {...bind('phone')} />
        <TextField label="Personal email" type="email" inputMode="email" autoComplete="email" placeholder="chloe@example.com" {...bind('email')} />
      </div>
      {footer({ label: mode === 'edit' ? 'Save changes' : 'Confirm', demoHint: true })}
    </form>
  )
}

// 4. Slack steps ---------------------------------------------------------------------------

export function StepsBody({ task, submit, footer, onToggleStep, idPrefix, startDay, managerName }: BodyProps) {
  const steps = (task.steps ?? []).map((t) => fill(t, { day: startDay, manager: managerName }))
  const done = new Set(task.stepsDone ?? [])
  const all = done.size === steps.length
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (all) submit()
      }}
    >
      <div className="mx-auto max-w-sm">
        <p className="mb-2 text-center text-[13px] text-ink-muted" aria-live="polite">
          {done.size} of {steps.length} steps
        </p>
        <ol className="space-y-1 rounded-2xl bg-cream/70 p-2">
          {steps.map((label, i) => {
            const checked = done.has(i)
            return (
              <li key={i}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] transition hover:bg-paper">
                  <input
                    id={i === 0 ? `${idPrefix}-step0` : undefined}
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={() => onToggleStep(task.id, i)}
                  />
                  <span
                    aria-hidden="true"
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-leaf peer-focus-visible:ring-offset-2 ${
                      checked ? 'bg-leaf text-paper' : 'bg-paper text-ink-muted ring-1 ring-sage-deep'
                    }`}
                  >
                    {checked ? <CheckIcon className="size-3.5" /> : i + 1}
                  </span>
                  <span className={checked ? 'text-ink-muted line-through decoration-ink-muted/40' : 'text-ink'}>{label}</span>
                </label>
              </li>
            )
          })}
        </ol>
      </div>
      {footer({
        label: 'Mark done',
        disabled: !all,
        disabledHint: `Check all ${steps.length} steps to finish.`,
      })}
    </form>
  )
}

// 6. Repo access request -----------------------------------------------------------------

const MOCK_REPOS = [
  { value: 'patient-web', label: 'brightpath/patient-web', hint: 'The patient app front end' },
  { value: 'care-api', label: 'brightpath/care-api', hint: 'APIs for care teams' },
  { value: 'infra-config', label: 'brightpath/infra-config', hint: 'Deploy and environment config' },
]

export function RequestBody({ task, idPrefix, draftKey, submit, footer, mode, managerName }: BodyProps) {
  const saved = task.data ?? {}
  const isRepo = task.key === 'repo-access'
  const f = useTaskForm({
    draftKey,
    idPrefix,
    initial: {
      githubUsername: str(saved.githubUsername),
      repos: arr(saved.repos, ['patient-web']),
      reason: str(saved.reason, 'Onboarding to the patient app team and pairing on my first PR.'),
    },
    validate: (v) => ({
      githubUsername: isRepo ? githubUsername(v.githubUsername) : null,
      repos: isRepo && v.repos.length === 0 ? 'Pick at least one repo.' : null,
      reason: !v.reason.trim() ? `A few words help ${managerName} approve quickly.` : null,
    }),
  })
  return (
    <form
      noValidate
      onSubmit={f.handleSubmit((v) =>
        submit(isRepo ? { ...v, githubUsername: v.githubUsername.trim().replace(/^@/, '') } : { reason: v.reason.trim() }),
      )}
    >
      <div className="space-y-5">
        {isRepo && (
          <>
            <TextField
              id={f.id('githubUsername')}
              label="GitHub username"
              prefix="@"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="chloe-zhang"
              value={f.values.githubUsername}
              onChange={(v) => f.set('githubUsername', v)}
              onBlur={() => f.touch('githubUsername')}
              error={f.error('githubUsername')}
            />
            <CheckboxGroup
              id={f.id('repos')}
              legend="Which repos?"
              options={MOCK_REPOS}
              value={f.values.repos}
              onChange={(v) => f.set('repos', v)}
              onBlur={() => f.touch('repos')}
              error={f.error('repos')}
            />
          </>
        )}
        <TextField
          id={f.id('reason')}
          label="Reason"
          maxLength={120}
          value={f.values.reason}
          onChange={(v) => f.set('reason', v)}
          onBlur={() => f.touch('reason')}
          error={f.error('reason')}
        />
      </div>
      {footer({ label: mode === 'edit' ? 'Update request' : `Send to ${managerName}`, demoHint: true })}
    </form>
  )
}

// Plain tasks (later phases) --------------------------------------------------------------

export function SimpleBody({ submit, footer }: BodyProps) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {footer({ label: 'Mark done' })}
    </form>
  )
}
