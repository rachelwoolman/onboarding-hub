import { useState, type ReactNode } from 'react'
import { email, formatPhone, phone, required } from '../../data/validation'
import type { Hire, Task, TaskData } from '../../data/types'
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
  onToggleStep: (taskId: string, step: number) => void
  /** Contact details HR already has (confirm card). */
  onFile?: Hire['onFile']
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)

// 1. Contact details ---------------------------------------------------------------

type Row = 'name' | 'phone' | 'email'

/**
 * HR already has her name, phone and personal email, so this is a confirmation:
 * the details read-only, a small "Edit" link per row, and one Confirm button.
 */
export function ContactBody({ task, idPrefix, draftKey, submit, footer, mode, onFile }: BodyProps) {
  const saved = task.data ?? {}
  const f = useTaskForm({
    draftKey,
    idPrefix,
    initial: {
      firstName: str(saved.firstName, onFile?.firstName ?? ''),
      lastName: str(saved.lastName, onFile?.lastName ?? ''),
      preferredName: str(saved.preferredName),
      phone: str(saved.phone, onFile?.phone ?? ''),
      email: str(saved.email, onFile?.email ?? ''),
    },
    validate: (v) => ({
      firstName: required('We need your legal first name.')(v.firstName),
      lastName: required('We need your legal last name.')(v.lastName),
      phone: phone(v.phone),
      email: email(v.email),
    }),
  })
  // Rows open for editing: anything she chose to edit, anything HR doesn't have,
  // and anything that needs a fix after she pressed Confirm.
  const [editing, setEditing] = useState<Set<Row>>(
    () => new Set<Row>([...(!f.values.firstName || !f.values.lastName ? ['name' as Row] : []), ...(!f.values.phone ? ['phone' as Row] : []), ...(!f.values.email ? ['email' as Row] : [])]),
  )
  const open = (row: Row) =>
    editing.has(row) ||
    (row === 'name' ? Boolean(f.error('firstName') || f.error('lastName')) : Boolean(f.error(row)))
  const startEdit = (row: Row) => {
    setEditing((s) => new Set(s).add(row))
    const first = row === 'name' ? 'firstName' : row
    window.requestAnimationFrame(() => document.getElementById(f.id(first))?.focus())
  }
  const bind = (name: keyof typeof f.values) => ({
    id: f.id(name),
    value: f.values[name],
    onChange: (v: string) => f.set(name, v),
    onBlur: () => f.touch(name),
    error: f.error(name),
  })
  const preferred = f.values.preferredName.trim()

  const rows: { row: Row; label: string; value: string; extra?: string; edit: ReactNode }[] = [
    {
      row: 'name',
      label: 'Name',
      value: `${f.values.firstName} ${f.values.lastName}`.trim(),
      extra: preferred ? `Goes by ${preferred}` : undefined,
      edit: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Legal first name" autoComplete="given-name" {...bind('firstName')} />
            <TextField label="Legal last name" autoComplete="family-name" {...bind('lastName')} />
          </div>
          <TextField label="Preferred name" optional hint="What should we call you?" autoComplete="nickname" {...bind('preferredName')} />
        </div>
      ),
    },
    {
      row: 'phone',
      label: 'Mobile phone',
      value: formatPhone(f.values.phone),
      edit: <TextField label="Mobile phone" type="tel" inputMode="tel" autoComplete="tel" {...bind('phone')} />,
    },
    {
      row: 'email',
      label: 'Personal email',
      value: f.values.email.trim(),
      edit: <TextField label="Personal email" type="email" inputMode="email" autoComplete="email" {...bind('email')} />,
    },
  ]

  return (
    <form noValidate onSubmit={f.handleSubmit((v) => submit({ ...v, phone: v.phone.trim(), email: v.email.trim() }))}>
      <dl className="divide-y divide-line/70 rounded-2xl bg-cream/60 px-4">
        {rows.map((r) => (
          <div key={r.row} className="py-3.5 text-left">
            {open(r.row) ? (
              <div className="animate-fade-up">{r.edit}</div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <dt className="text-[13px] text-ink-muted">{r.label}</dt>
                  <dd className="mt-0.5 break-words text-[16px] text-ink">{r.value}</dd>
                  {r.extra && <dd className="text-[13px] text-ink-muted">{r.extra}</dd>}
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(r.row)}
                  className="shrink-0 rounded-full px-2.5 py-1 text-[13px] text-leaf-deep underline decoration-leaf/30 underline-offset-4 transition hover:bg-paper"
                >
                  Edit {r.row}
                </button>
              </div>
            )}
          </div>
        ))}
      </dl>
      {footer({ label: mode === 'edit' ? 'Save changes' : 'Confirm' })}
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
                    className={`flex size-5 shrink-0 items-center justify-center rounded-md transition duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-leaf peer-focus-visible:ring-offset-2 ${
                      checked ? 'bg-ink-muted/60 text-paper' : 'bg-paper ring-1 ring-sage-deep'
                    }`}
                  >
                    {checked && <CheckIcon className="size-3.5" />}
                  </span>
                  {/* Done steps go quiet grey, never struck through. */}
                  <span className={`transition-colors duration-300 ${checked ? 'text-ink-muted' : 'text-ink'}`}>{label}</span>
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

// 6. Access request ------------------------------------------------------------------------

/** "Request your dev tools": tick what she needs, one request goes to the manager. */
export function RequestBody({ task, idPrefix, draftKey, submit, footer, mode, managerName }: BodyProps) {
  const saved = task.data ?? {}
  const choices = task.choices ?? []
  const f = useTaskForm({
    draftKey,
    idPrefix,
    // Nothing pre-ticked: she picks what she actually needs.
    initial: { tools: Array.isArray(saved.tools) ? saved.tools : ([] as string[]) },
    validate: (v) => ({ tools: choices.length && v.tools.length === 0 ? 'Pick at least one tool.' : null }),
  })
  return (
    <form noValidate onSubmit={f.handleSubmit((v) => submit({ tools: v.tools }))}>
      {choices.length > 0 && (
        <CheckboxGroup
          id={f.id('tools')}
          legend="What do you need?"
          options={choices}
          value={f.values.tools}
          onChange={(v) => f.set('tools', v)}
          onBlur={() => f.touch('tools')}
          error={f.error('tools')}
        />
      )}
      {footer({ label: mode === 'edit' ? 'Update request' : `Send to ${managerName}` })}
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
