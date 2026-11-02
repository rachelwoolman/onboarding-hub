import { useState } from 'react'
import { fill } from '../data/copy'
import { dayLabel, weekday } from '../data/dates'
import {
  finishedSummary,
  gardenOrder,
  gardenStatusLine,
  isDone,
  isOverdue,
  managerPlantStage,
  pendingApprovals,
  phaseIsOpen,
  progressPercent,
  startLabel,
  taskDue,
  tasksFor,
  waitingFor,
} from '../data/selectors'
import type { AccessRequest, AppState, Hire } from '../data/types'
import { useStore } from '../state/store'
import { Plant } from '../components/Plant'
import { ChevronIcon } from '../components/ui'
import { useToast } from '../components/useToast'

const firstName = (state: AppState, hireId: string) => state.hires.find((h) => h.id === hireId)?.firstName ?? 'They'

/**
 * Mateo's page. In the demo, Chloe is the only person who can need him: her dev tools
 * request shows in a slim strip and on her card. Everyone else is calm and on track.
 */
export function MateoPage() {
  const { state, actions } = useStore()
  const toast = useToast()
  const approvals = pendingApprovals(state)
  const hires = gardenOrder(state)

  const approve = (r: AccessRequest) => {
    // The reducer ignores repeats, so a double click approves once.
    if (r.status !== 'waitingOnManager') return
    actions.approveRequest(r.id)
    toast.show(`Approved. ${firstName(state, r.hireId)} has been notified.`)
  }
  const decline = (r: AccessRequest, reason: string) => {
    actions.declineRequest(r.id, reason)
    toast.show(`Sent back to ${firstName(state, r.hireId)} with your note.`)
  }

  const subline = approvals.length
    ? `${approvals.length} thing${approvals.length === 1 ? '' : 's'} need${approvals.length === 1 ? 's' : ''} you.`
    : hires.length
      ? `${hires.length} new hire${hires.length === 1 ? '' : 's'} onboarding.`
      : 'No new hires right now.'

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pt-8 sm:px-8 sm:pt-14">
      <header>
        <h1
          className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-balance text-ink sm:text-[56px]"
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 96' }}
        >
          Good morning, <span className="font-semibold">Mateo</span>{' '}
          <span className="text-[0.8em]" aria-hidden="true">🌱</span>
        </h1>
        <p className="mt-3 text-[17px] text-ink-soft sm:text-lg">{subline}</p>
      </header>

      {/* Needs you: only while something is waiting on him. */}
      <section aria-label="Needs you" className="mt-6">
        {approvals.length > 0 ? (
          <div className="animate-fade-up flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-amber-soft/70 px-4 py-3 sm:px-5">
            <p className="min-w-0 flex-1 text-[15px] text-ink">
              <span className="font-semibold">{firstName(state, approvals[0].hireId)}</span> is waiting on your approval:{' '}
              {approvals[0].resource.toLowerCase()}
            </p>
            {approvals.length > 1 && (
              <span className="rounded-full bg-paper/80 px-2.5 py-1 text-[12px] font-medium text-amber">
                +{approvals.length - 1} more
              </span>
            )}
            <ApproveDecline
              key={approvals[0].id}
              idPrefix="strip"
              request={approvals[0]}
              name={firstName(state, approvals[0].hireId)}
              onApprove={approve}
              onDecline={decline}
            />
          </div>
        ) : (
          <p className="text-[13px] text-ink-muted">Nothing needs you right now 🌱</p>
        )}
      </section>

      <section aria-labelledby="hires-title" className="mt-10">
        <h2 id="hires-title" className="text-[13px] font-medium text-ink-muted">
          New hires
        </h2>
        {hires.length === 0 ? (
          <p className="mt-3 text-[15px] text-ink-muted">No new hires right now.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {hires.map((h) => (
              <HireCard
                key={h.id}
                hire={h}
                state={state}
                primary={h.id === state.primaryHireId}
                onApprove={approve}
                onDecline={decline}
              />
            ))}
          </ul>
        )}
      </section>
      {toast.node}
    </main>
  )
}

/** Approve, plus a quiet Decline link that asks for a short, required reason inline. */
function ApproveDecline({
  idPrefix,
  request,
  name,
  onApprove,
  onDecline,
}: {
  idPrefix: string
  request: AccessRequest
  name: string
  onApprove: (r: AccessRequest) => void
  onDecline: (r: AccessRequest, reason: string) => void
}) {
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const missing = tried && !reason.trim()
  const inputId = `${idPrefix}-decline-reason`

  if (!declining) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDeclining(true)}
          className="rounded-full px-2.5 py-1.5 text-[13px] text-ink-muted underline decoration-ink-muted/30 underline-offset-4 transition hover:text-ink"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => onApprove(request)}
          className="rounded-full bg-leaf px-4 py-2 text-[14px] font-semibold text-paper shadow-button transition hover:bg-leaf-deep active:scale-[0.98]"
        >
          Approve
        </button>
      </div>
    )
  }

  return (
    <form
      noValidate
      className="w-full animate-fade-up"
      onSubmit={(e) => {
        e.preventDefault()
        setTried(true)
        if (reason.trim()) onDecline(request, reason.trim())
      }}
    >
      <label htmlFor={inputId} className="text-[13px] font-medium text-ink">
        What should {name} change?
      </label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <input
          id={inputId}
          autoFocus
          value={reason}
          maxLength={140}
          onChange={(e) => setReason(e.target.value)}
          aria-invalid={missing || undefined}
          aria-describedby={`${inputId}-note`}
          placeholder="e.g. Add the cloud console too"
          className={`h-11 min-w-0 flex-1 rounded-xl px-3.5 text-[15px] text-ink ring-1 placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-leaf ${
            missing ? 'bg-amber-soft ring-amber/50' : 'bg-paper ring-line'
          }`}
        />
        <button type="submit" className="rounded-full bg-ink px-4 text-[14px] font-semibold text-paper transition hover:bg-ink-soft">
          Send back
        </button>
        <button
          type="button"
          onClick={() => {
            setDeclining(false)
            setTried(false)
          }}
          className="rounded-full px-3 text-[13px] text-ink-muted transition hover:text-ink"
        >
          Cancel
        </button>
      </div>
      <p id={`${inputId}-note`} aria-live="polite" className={`text-[13px] text-amber ${missing ? 'mt-1.5' : 'sr-only'}`}>
        {missing && `Add a short reason so ${name} knows what to change.`}
      </p>
    </form>
  )
}

function HireCard({
  hire,
  state,
  primary,
  onApprove,
  onDecline,
}: {
  hire: Hire
  state: AppState
  primary: boolean
  onApprove: (r: AccessRequest) => void
  onDecline: (r: AccessRequest, reason: string) => void
}) {
  const [tasksOpen, setTasksOpen] = useState(false)
  const pct = progressPercent(state, hire.id)
  const pending = state.requests.find((r) => r.hireId === hire.id && r.status === 'waitingOnManager')
  const summary = primary ? finishedSummary(state, hire.id) : null
  const copy = { day: weekday(hire.startDate), manager: hire.managerName }

  // Every task from phases that have opened, plus anything waiting on others.
  const rows = [
    ...tasksFor(state, hire.id)
      .filter((t) => phaseIsOpen(hire, t.phase, state.today))
      .sort((a, b) => a.order - b.order)
      .map((t) => {
        const overdue = isOverdue(hire, t, state.today)
        const waitingOnMe = pending?.taskId === t.id
        return {
          id: t.id,
          title: fill(t.title, copy),
          owner: waitingOnMe ? 'You' : hire.firstName,
          status: waitingOnMe ? 'Needs your approval' : isDone(t) ? 'Done' : overdue ? 'Overdue' : 'To do',
          due: dayLabel(taskDue(hire, t), state.today),
          warn: overdue || waitingOnMe,
        }
      }),
    ...waitingFor(state, hire.id).map((w) => ({
      id: w.item.id,
      title: w.item.title,
      owner: w.item.owner,
      status: w.blocked ? 'Blocked' : 'In progress',
      due: dayLabel(w.item.readyOn, state.today),
      warn: w.blocked,
    })),
  ]

  const tone = pending
    ? 'bg-amber-soft/45 ring-amber/25'
    : primary
      ? 'bg-paper/80 ring-line/70'
      : 'bg-paper/45 ring-line/50'

  return (
    <li className={`rounded-card px-4 py-4 ring-1 transition-colors duration-500 sm:px-5 ${tone}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <Plant
          stage={managerPlantStage(state, hire.id)}
          className={`size-16 shrink-0 sm:size-20 ${primary ? '' : 'opacity-80'}`}
          title={`${hire.firstName}'s plant`}
        />
        <div className="min-w-0 flex-1 pt-1">
          <p className="flex items-baseline gap-2">
            <span className={`text-[16px] font-semibold ${primary ? 'text-ink' : 'text-ink-soft'}`}>{hire.name}</span>
            <span className="text-[12px] tabular-nums text-ink-muted">{pct}%</span>
          </p>
          <p className="text-[13px] text-ink-muted">
            {hire.title} · {startLabel(hire, state.today)}
          </p>
          <p className={`mt-1 text-[14px] ${pending ? 'font-medium text-amber' : primary ? 'text-ink-soft' : 'text-ink-muted'}`}>
            {gardenStatusLine(state, hire.id)}
          </p>
          {summary && (summary.done.length > 0 || summary.open) && (
            <p className="mt-1 text-[13px] text-ink-muted">
              {summary.done.length > 0 && <>Done: {summary.done.join(', ')}</>}
              {summary.done.length > 0 && summary.open && ' · '}
              {summary.open && <>Open: {summary.open}</>}
            </p>
          )}
          {pending && (
            <div className="mt-3">
              <ApproveDecline
                key={pending.id}
                idPrefix={`card-${hire.id}`}
                request={pending}
                name={hire.firstName}
                onApprove={onApprove}
                onDecline={onDecline}
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setTasksOpen((o) => !o)}
            aria-expanded={tasksOpen}
            aria-controls={`tasks-${hire.id}`}
            className="-ml-1 mt-2 inline-flex items-center gap-1 rounded-full px-1 py-1 text-[13px] text-ink-muted transition hover:text-ink"
          >
            Tasks
            <ChevronIcon open={tasksOpen} className="size-3" />
          </button>
        </div>
      </div>

      <div className="expand" data-open={tasksOpen} id={`tasks-${hire.id}`}>
        <div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-ink-muted">
                <tr>
                  <th className="py-1.5 pr-3 font-medium">Task</th>
                  <th className="py-1.5 pr-3 font-medium">Owner</th>
                  <th className="py-1.5 pr-3 font-medium">Status</th>
                  <th className="py-1.5 font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {rows.map((r) => (
                  <tr key={r.id} className={r.warn ? 'text-amber' : 'text-ink-soft'}>
                    <td className="py-1.5 pr-3">{r.title}</td>
                    <td className="whitespace-nowrap py-1.5 pr-3">{r.owner}</td>
                    <td className="whitespace-nowrap py-1.5 pr-3">{r.status}</td>
                    <td className="whitespace-nowrap py-1.5">{r.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </li>
  )
}
