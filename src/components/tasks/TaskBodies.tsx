import { useEffect, useRef, useState, type ReactNode } from 'react'
import { digitsOnly, email, githubUsername, I9_DOCUMENTS, i9Documents, phone, required, routing, account, zip } from '../../data/validation'
import type { Task, TaskData } from '../../data/types'
import { CheckboxGroup, RadioGroup, SectionHeading, Stepper, TextField } from '../forms/fields'
import { useTaskForm } from '../forms/useTaskForm'
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
  /** Only for direct deposit: "I'll do this later". */
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
  const bind = (name: keyof typeof f.values) => ({
    id: f.id(name),
    value: f.values[name],
    onChange: (v: string) => f.set(name, v),
    onBlur: () => f.touch(name),
    error: f.error(name),
  })
  return (
    <form noValidate onSubmit={f.handleSubmit((v) => submit({ ...v, phone: v.phone.trim(), email: v.email.trim() }))}>
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Legal first name" autoComplete="given-name" {...bind('firstName')} />
          <TextField label="Legal last name" autoComplete="family-name" {...bind('lastName')} />
        </div>
        <TextField label="Preferred name" optional hint="What should we call you?" autoComplete="nickname" {...bind('preferredName')} />
        <TextField label="Mobile phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(555) 010-1234" {...bind('phone')} />
        <TextField label="Personal email" type="email" inputMode="email" autoComplete="email" placeholder="chloe@example.com" {...bind('email')} />
      </div>
      {footer({ label: mode === 'edit' ? 'Save changes' : 'Confirm', demoHint: true })}
    </form>
  )
}

// 2. I-9 and W-4 --------------------------------------------------------------------------

const CITIZENSHIP = [
  { value: 'citizen', label: 'U.S. citizen' },
  { value: 'national', label: 'Noncitizen national of the U.S.' },
  { value: 'resident', label: 'Lawful permanent resident' },
  { value: 'authorized', label: 'Noncitizen authorized to work' },
]

const FILING = [
  { value: 'single', label: 'Single or married filing separately' },
  { value: 'joint', label: 'Married filing jointly' },
  { value: 'head', label: 'Head of household' },
]

export function I9W4Body({ task, idPrefix, draftKey, submit, footer, mode }: BodyProps) {
  const saved = task.data ?? {}
  const f = useTaskForm({
    draftKey,
    idPrefix,
    initial: {
      street: str(saved.street),
      city: str(saved.city),
      state: str(saved.state),
      zip: str(saved.zip),
      citizenship: str(saved.citizenship),
      documents: arr(saved.documents),
      filingStatus: str(saved.filingStatus),
      dependents: typeof saved.dependents === 'number' ? saved.dependents : 0,
    },
    validate: (v) => ({
      street: required('Add your street address.')(v.street),
      city: required('Add your city.')(v.city),
      state: !v.state.trim() ? 'Add your state.' : /^[a-z]{2}$/i.test(v.state.trim()) ? null : 'Use the 2-letter state code, like CA.',
      zip: zip(v.zip),
      citizenship: v.citizenship ? null : 'Pick the option that fits you.',
      documents: i9Documents(v.documents),
      filingStatus: v.filingStatus ? null : 'Pick a filing status. Single is fine if you’re unsure.',
    }),
  })
  const text = (name: 'street' | 'city' | 'state' | 'zip') => ({
    id: f.id(name),
    value: f.values[name],
    onChange: (v: string) => f.set(name, v),
    onBlur: () => f.touch(name),
    error: f.error(name),
  })
  return (
    <form noValidate onSubmit={f.handleSubmit((v) => submit({ ...v, state: v.state.trim().toUpperCase() }))}>
      <div className="space-y-5">
        <SectionHeading step="1">I-9 · Section 1</SectionHeading>
        <TextField label="Home address" autoComplete="street-address" placeholder="123 Fern Street, Apt 4" {...text('street')} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_5rem_7rem]">
          <TextField label="City" autoComplete="address-level2" className="col-span-2 sm:col-span-1" {...text('city')} />
          <TextField label="State" autoComplete="address-level1" maxLength={2} placeholder="CA" {...text('state')} onChange={(v) => f.set('state', v.toUpperCase())} />
          <TextField label="ZIP" inputMode="numeric" autoComplete="postal-code" placeholder="94110" {...text('zip')} />
        </div>
        <RadioGroup
          id={f.id('citizenship')}
          name={`${idPrefix}-citizenship`}
          legend="Citizenship status"
          options={CITIZENSHIP}
          value={f.values.citizenship}
          onChange={(v) => f.set('citizenship', v)}
          onBlur={() => f.touch('citizenship')}
          error={f.error('citizenship')}
        />
        <CheckboxGroup
          id={f.id('documents')}
          legend="Documents I’ll bring on day 1"
          hint="One from the first two, or a photo ID plus one of the last two."
          options={I9_DOCUMENTS.map((d) => ({ value: d.id, label: d.label }))}
          value={f.values.documents}
          onChange={(v) => f.set('documents', v)}
          onBlur={() => f.touch('documents')}
          error={f.error('documents')}
        />

        <div className="pt-3">
          <SectionHeading step="2">W-4</SectionHeading>
        </div>
        <RadioGroup
          id={f.id('filingStatus')}
          name={`${idPrefix}-filing`}
          legend="Filing status"
          options={FILING}
          value={f.values.filingStatus}
          onChange={(v) => f.set('filingStatus', v)}
          onBlur={() => f.touch('filingStatus')}
          error={f.error('filingStatus')}
        />
        <Stepper id={f.id('dependents')} label="Number of dependents" value={f.values.dependents} onChange={(v) => f.set('dependents', v)} />

        <p className="flex items-start gap-2.5 rounded-2xl bg-sage/70 px-4 py-3 text-[13px] text-ink-soft">
          <LockIcon />
          You’ll enter your SSN securely on the official form.
        </p>
      </div>
      {footer({ label: mode === 'edit' ? 'Save changes' : 'Submit forms', demoHint: true })}
    </form>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-px size-4 shrink-0 text-leaf-deep" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

// 3. Direct deposit ------------------------------------------------------------------------

export function DepositBody({ task, idPrefix, draftKey, submit, footer, mode, onDefer }: BodyProps) {
  const saved = task.data ?? {}
  const editing = mode === 'edit'
  const f = useTaskForm({
    draftKey,
    idPrefix,
    // Account numbers are never kept in drafts or saved in full.
    noDraft: ['account', 'accountConfirm'],
    initial: {
      bankName: str(saved.bankName),
      routing: str(saved.routing),
      accountType: str(saved.accountType, 'checking'),
      account: '',
      accountConfirm: '',
    },
    validate: (v) => ({
      bankName: required('Add your bank’s name.')(v.bankName),
      routing: routing(v.routing),
      account: account(v.account),
      accountConfirm: !v.accountConfirm.trim()
        ? 'Type the account number once more.'
        : digitsOnly(v.accountConfirm) !== digitsOnly(v.account)
          ? 'These don’t match yet. Check both numbers.'
          : null,
    }),
  })
  const text = (name: 'bankName' | 'routing' | 'account' | 'accountConfirm') => ({
    id: f.id(name),
    value: f.values[name],
    onChange: (v: string) => f.set(name, v),
    onBlur: () => f.touch(name),
    error: f.error(name),
  })
  return (
    <form
      noValidate
      onSubmit={f.handleSubmit((v) =>
        submit({
          bankName: v.bankName.trim(),
          routing: digitsOnly(v.routing),
          accountType: v.accountType,
          accountLast4: digitsOnly(v.account).slice(-4),
        }),
      )}
    >
      <div className="space-y-5">
        <TextField label="Bank name" autoComplete="off" placeholder="Evergreen Credit Union" {...text('bankName')} />
        <RadioGroup
          id={f.id('accountType')}
          name={`${idPrefix}-type`}
          legend="Account type"
          options={[
            { value: 'checking', label: 'Checking' },
            { value: 'savings', label: 'Savings' },
          ]}
          value={f.values.accountType}
          onChange={(v) => f.set('accountType', v)}
          error={null}
        />
        <TextField
          label="Routing number"
          inputMode="numeric"
          autoComplete="off"
          maxLength={11}
          placeholder="9 digits"
          hint="The first number along the bottom of a check."
          {...text('routing')}
        />
        <TextField label="Account number" inputMode="numeric" autoComplete="off" maxLength={20} {...text('account')} />
        <TextField label="Confirm account number" inputMode="numeric" autoComplete="off" maxLength={20} {...text('accountConfirm')} />
        {editing && (
          <p className="text-[13px] text-ink-muted">
            For your security we only keep the last 4 digits, so please re-enter the account number to save changes.
          </p>
        )}
      </div>
      {footer({
        label: editing ? 'Save changes' : 'Save',
        demoHint: true,
        secondary: onDefer && (
          <button
            type="button"
            onClick={onDefer}
            className="rounded-full px-3 py-1.5 text-[13px] text-ink-muted underline decoration-ink-muted/30 underline-offset-4 transition hover:text-ink"
          >
            I’ll do this later
          </button>
        ),
      })}
    </form>
  )
}

// 4. Slack steps ---------------------------------------------------------------------------

export function StepsBody({ task, submit, footer, onToggleStep, idPrefix }: BodyProps) {
  const steps = task.steps ?? []
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

// 5. Welcome guide ------------------------------------------------------------------------

const guide = (startDay: string, manager: string): { title: string; body: string[] }[] => [
  {
    title: 'Where to arrive, and when',
    body: [
      `Come to BrightPath HQ at 9:15 on ${startDay}. We’re at 240 Fern Street, 4th floor, across from the green café.`,
      `${manager} meets you at the front desk at 9:30. Your first morning is all set-up and hellos, no real work.`,
    ],
  },
  {
    title: 'Parking and badge pickup',
    body: [
      'Visitor parking is free in the garage on Alder Lane. Take a ticket and the front desk will validate it.',
      'Pick up your badge and laptop at the front desk. Bring the I-9 documents you picked, so HR can check them in two minutes.',
    ],
  },
  {
    title: 'What to wear',
    body: [
      'Whatever you feel comfortable in. Most people wear jeans and a sweater. Bring a layer: the 4th floor runs cool.',
    ],
  },
  {
    title: 'Who to ask',
    body: [
      'Your onboarding buddy, Sam Rivera, is your go-to for every small question, big or silly.',
      'For anything about pay, benefits or forms, message Sarah in HR. For your laptop or accounts, post in #it-help.',
    ],
  },
]

export function ReadBody({ submit, footer, idPrefix, startDay, managerName }: BodyProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [read, setRead] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setRead(true)
    }
    check() // Short screens with no scrolling needed.
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (read) submit()
      }}
    >
      <div className="relative">
        <div
          ref={ref}
          id={`${idPrefix}-guide`}
          tabIndex={0}
          role="region"
          aria-label="Day-1 welcome guide"
          onScroll={(e) => {
            const el = e.currentTarget
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setRead(true)
          }}
          className="max-h-72 overflow-y-auto rounded-2xl bg-cream/70 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
        >
          {guide(startDay, managerName).map((s, i) => (
            <section key={s.title} className={i ? 'mt-5' : ''}>
              <h3 className="font-serif text-[18px] font-semibold text-ink">{s.title}</h3>
              {s.body.map((p) => (
                <p key={p} className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </section>
          ))}
          <p className="mt-6 text-center text-[13px] text-leaf-deep">That’s it. See you {startDay} 🌱</p>
        </div>
        {!read && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-2xl bg-gradient-to-t from-paper to-transparent" />
        )}
      </div>
      {footer({ label: 'I’ve read it', disabled: !read, disabledHint: 'Scroll to the end to finish.' })}
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
