import { useState, type ReactNode } from 'react'
import { fill } from '../data/copy'
import { dayLabel, weekday } from '../data/dates'
import {
  gardenOrder,
  gardenStatusLine,
  hireStatus,
  isDone,
  isOverdue,
  pendingApprovals,
  phaseCounts,
  phaseIsOpen,
  progressPercent,
  stageForPercent,
  startLabel,
  taskDue,
  tasksFor,
  waitingFor,
  type HireStatus,
} from '../data/selectors'
import { taskSummary } from '../data/summaries'
import { PHASE_ORDER } from '../data/templates'
import type { AccessRequest, AppState, Hire } from '../data/types'
import { useStore } from '../state/store'
import { Plant } from '../components/Plant'
import { ChevronIcon } from '../components/ui'
import { useToast } from '../components/useToast'

const firstName = (state: AppState, hireId: string) => state.hires.find((h) => h.id === hireId)?.firstName ?? 'They'

/** "just now" for the first minute after an action, so the button can say "Nudged IT just now ✓". */
const isRecent = (iso?: string) => Boolean(iso) && Date.now() - Date.parse(iso!) < 60_000

export function MateoPage() {
  const { state, actions } = useStore()
  const toast = useToast()
  const approvals = pendingApprovals(state)
  const garden = gardenOrder(state)
  const growing = garden.filter((h) => hireStatus(state, h.id) !== 'done').length

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
    : growing
      ? `Your garden: ${growing} new hire${growing === 1 ? '' : 's'} growing.`
      : 'Your garden is resting.'

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

      {/* Needs you: only when something is waiting on him. */}
      <section aria-label="Needs you" className="mt-8">
        {approvals.length > 0 ? (
          <NeedsYouStrip
            key={approvals[0].id}
            request={approvals[0]}
            more={approvals.length - 1}
            state={state}
            onApprove={approve}
            onDecline={decline}
          />
        ) : (
          <p className="text-[15px] text-ink-muted">Nothing needs you right now 🌱</p>
        )}
      </section>

      <section aria-labelledby="garden-title" className="mt-12">
        <h2 id="garden-title" className="text-[13px] font-semibold uppercase tracking-[0.12em] text-leaf-deep">
          Your garden
        </h2>
        {garden.length === 0 ? (
          <p className="mt-4 text-[15px] text-ink-muted">No new hires right now.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {garden.map((h) => (
              <GardenCard
                key={h.id}
                hire={h}
                state={state}
                onApprove={approve}
                onNudge={(waitingId, what) => {
                  actions.nudgeIT(waitingId)
                  toast.show(`IT has been nudged about ${h.firstName}’s ${what}.`)
                }}
                onRemind={() => {
                  actions.sendReminder(h.id)
                  toast.show(`Reminder sent to ${h.firstName}.`)
                }}
              />
            ))}
          </ul>
        )}
      </section>
      {toast.node}
    </main>
  )
}

function NeedsYouStrip({
  request,
  more,
  state,
  onApprove,
  onDecline,
}: {
  request: AccessRequest
  more: number
  state: AppState
  onApprove: (r: AccessRequest) => void
  onDecline: (r: AccessRequest, reason: string) => void
}) {
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const name = firstName(state, request.hireId)
  const task = state.tasks.find((t) => t.id === request.taskId)
  const summary = task ? taskSummary(task) : null
  const missing = tried && !reason.trim()

  return (
    <div className="animate-fade-up rounded-2xl bg-amber-soft/70 px-4 py-3.5 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="min-w-0 flex-1 text-[15px] text-ink">
          <span className="font-semibold">{name}</span> is waiting on your approval: {request.resource.toLowerCase()}
          {summary && <span className="block text-[13px] text-ink-muted">{summary}</span>}
        </p>
        {!declining && (
          <div className="flex items-center gap-2">
            {more > 0 && (
              <span className="rounded-full bg-paper/80 px-2.5 py-1 text-[12px] font-medium text-amber">+{more} more</span>
            )}
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
        )}
      </div>

      {declining && (
        <form
          noValidate
          className="mt-3 animate-fade-up"
          onSubmit={(e) => {
            e.preventDefault()
            setTried(true)
            if (reason.trim()) onDecline(request, reason.trim())
          }}
        >
          <label htmlFor="decline-reason" className="text-[13px] font-medium text-ink">
            What should {name} change?
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <input
              id="decline-reason"
              autoFocus
              value={reason}
              maxLength={140}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={missing || undefined}
              aria-describedby="decline-note"
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
          <p id="decline-note" aria-live="polite" className={`text-[13px] text-amber ${missing ? 'mt-1.5' : 'sr-only'}`}>
            {missing && `Add a short reason so ${name} knows what to change.`}
          </p>
        </form>
      )}
    </div>
  )
}

const STATUS_TONE: Record<HireStatus, string> = {
  blocked: 'text-amber',
  needsApproval: 'text-amber',
  notStarted: 'text-ink-muted',
  onTrack: 'text-leaf-deep',
  done: 'text-leaf-deep',
}

function GardenCard({
  hire,
  state,
  onApprove,
  onNudge,
  onRemind,
}: {
  hire: Hire
  state: AppState
  onApprove: (r: AccessRequest) => void
  onNudge: (waitingId: string, what: string) => void
  onRemind: () => void
}) {
  const [open, setOpen] = useState(false)
  const [allTasks, setAllTasks] = useState(false)
  const status = hireStatus(state, hire.id)
  const pct = progressPercent(state, hire.id)
  const blocked = waitingFor(state, hire.id).find((w) => w.blocked)
  const request = state.requests.find((r) => r.hireId === hire.id && r.status === 'waitingOnManager')
  const counts = phaseCounts(state, hire.id)
  const copy = { day: weekday(hire.startDate), manager: hire.managerName }

  // One plain line and ONE action fitted to the situation.
  let line: string
  let action: ReactNode = null
  const ghost =
    'rounded-full px-4 py-2 text-[14px] font-semibold ring-1 transition active:scale-[0.98] disabled:cursor-default disabled:opacity-80'
  if (status === 'blocked' && blocked) {
    line = `${hire.firstName}’s been waiting on IT for ${blocked.item.title} for ${blocked.daysWaiting} days.`
    const nudged = blocked.item.nudgedAt
    action = (
      <button
        type="button"
        disabled={Boolean(nudged)}
        onClick={() => onNudge(blocked.item.id, blocked.item.title)}
        className={`${ghost} ${nudged ? 'bg-sage text-leaf-deep ring-sage' : 'bg-paper text-ink ring-line hover:ring-leaf'}`}
      >
        {nudged ? `Nudged IT ${isRecent(nudged) ? 'just now ' : ''}✓` : 'Nudge IT'}
      </button>
    )
  } else if (status === 'needsApproval' && request) {
    const task = state.tasks.find((t) => t.id === request.taskId)
    const what = task ? taskSummary(task) : null
    line = `${hire.firstName} asked for ${request.resource.toLowerCase()}${what ? `: ${what}` : ''}.`
    action = (
      <button
        type="button"
        onClick={() => onApprove(request)}
        className="rounded-full bg-leaf px-4 py-2 text-[14px] font-semibold text-paper shadow-button transition hover:bg-leaf-deep active:scale-[0.98]"
      >
        Approve
      </button>
    )
  } else if (status === 'notStarted') {
    line = `${hire.firstName} ${startLabel(hire, state.today)} and hasn’t started any tasks yet.`
    const reminded = hire.remindedAt
    action = (
      <button
        type="button"
        disabled={Boolean(reminded)}
        onClick={onRemind}
        className={`${ghost} ${reminded ? 'bg-sage text-leaf-deep ring-sage' : 'bg-paper text-ink ring-line hover:ring-leaf'}`}
      >
        {reminded ? `Reminder sent ${isRecent(reminded) ? 'just now ' : ''}✓` : 'Send a reminder'}
      </button>
    )
  } else if (status === 'done') {
    line = `${hire.firstName} is fully onboarded. Nothing to do here.`
  } else {
    line = `${hire.firstName} has done ${counts.done} of ${counts.total} for this stage. Nothing needs you.`
  }

  // "See all tasks": every task from phases that have opened, plus anything waiting on others.
  const rows = [
    ...tasksFor(state, hire.id)
      .filter((t) => PHASE_ORDER.includes(t.phase) && phaseIsOpen(hire, t.phase, state.today))
      .map((t) => {
        const overdue = isOverdue(hire, t, state.today)
        return {
          id: t.id,
          title: fill(t.title, copy),
          owner: hire.firstName,
          status: isDone(t) ? 'Done' : overdue ? 'Overdue' : 'To do',
          due: dayLabel(taskDue(hire, t), state.today),
          warn: overdue,
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

  return (
    <li className="rounded-card bg-paper/70 px-4 py-4 ring-1 ring-line/70 sm:px-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <Plant stage={stageForPercent(pct)} droop={status === 'blocked'} className="size-16 sm:size-20" title={`${hire.firstName}'s plant`} />
          {status === 'blocked' && (
            <span aria-hidden="true" className="absolute right-1 top-2 size-2.5 rounded-full bg-amber ring-2 ring-paper" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="text-[16px] font-semibold text-ink">{hire.name}</span>
            <span className="text-[12px] tabular-nums text-ink-muted">{pct}%</span>
          </p>
          <p className="text-[13px] text-ink-muted">
            {hire.title} · {startLabel(hire, state.today)}
          </p>
          <p className={`mt-0.5 text-[14px] ${STATUS_TONE[status]}`}>{gardenStatusLine(state, hire.id)}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`checkin-${hire.id}`}
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-full px-3 py-1.5 text-[13px] font-medium text-leaf-deep ring-1 ring-sage-deep transition hover:bg-sage"
        >
          Check in
          <ChevronIcon open={open} className="size-3" />
        </button>
      </div>

      <div className="expand" data-open={open} id={`checkin-${hire.id}`}>
        <div>
          <div className="mt-4 border-t border-line/70 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 flex-1 text-[15px] text-ink-soft">{line}</p>
              {action}
            </div>
            <button
              type="button"
              onClick={() => setAllTasks((o) => !o)}
              aria-expanded={allTasks}
              className="mt-3 inline-flex items-center gap-1 rounded-full px-1 py-1 text-[13px] text-ink-muted transition hover:text-ink"
            >
              See all tasks
              <ChevronIcon open={allTasks} className="size-3" />
            </button>
            <div className="expand" data-open={allTasks}>
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
                          <td className="py-1.5 pr-3 whitespace-nowrap">{r.owner}</td>
                          <td className="py-1.5 pr-3 whitespace-nowrap">{r.status}</td>
                          <td className="py-1.5 whitespace-nowrap">{r.due}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
