import { useState } from 'react'
import type { WaitingRow } from '../data/selectors'
import type { AccessRequest, Task } from '../data/types'
import { CheckIcon, ChevronIcon, ClockIcon } from './ui'

interface FooterLineProps {
  done: Task[]
  waiting: WaitingRow[]
  requests: AccessRequest[]
  managerName: string
  onUndo: (taskId: string) => void
  onResubmit: (requestId: string) => void
}

type Panel = 'done' | 'waiting' | null

/** "2 done · 1 waiting on others". Each part expands in place. */
export function FooterLine({ done, waiting, requests, managerName, onUndo, onResubmit }: FooterLineProps) {
  const [open, setOpen] = useState<Panel>(null)
  const live = requests.filter((r) => r.status !== 'ready')
  const waitingCount = waiting.length + live.length
  const showWaiting = waitingCount > 0 || requests.length > 0
  if (done.length === 0 && !showWaiting) return null

  const toggle = (p: Panel) => setOpen((cur) => (cur === p ? null : p))
  const part = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition hover:bg-paper hover:text-ink'

  return (
    <section aria-label="Progress details" className="text-center">
      <div className="flex flex-wrap items-center justify-center gap-x-1 text-[13px] text-ink-muted">
        {done.length > 0 && (
          <button
            type="button"
            className={`${part} ${open === 'done' ? 'bg-paper text-ink' : ''}`}
            aria-expanded={open === 'done'}
            onClick={() => toggle('done')}
          >
            {done.length} done
            <ChevronIcon open={open === 'done'} className="size-3" />
          </button>
        )}
        {done.length > 0 && showWaiting && <span aria-hidden="true">·</span>}
        {showWaiting && (
          <button
            type="button"
            className={`${part} ${open === 'waiting' ? 'bg-paper text-ink' : ''}`}
            aria-expanded={open === 'waiting'}
            onClick={() => toggle('waiting')}
          >
            {waitingCount > 0 ? `${waitingCount} waiting on others` : 'Requests'}
            <ChevronIcon open={open === 'waiting'} className="size-3" />
          </button>
        )}
      </div>

      <div className="expand mx-auto max-w-lg text-left" data-open={open === 'done'}>
        <div>
          <ul className="mt-3 space-y-0.5 rounded-card bg-paper/70 p-2">
            {done.map((t) => (
              <li key={t.id} className="group flex items-center gap-3 rounded-xl px-3 py-2 text-[14px]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sage text-leaf">
                  <CheckIcon className="size-3" />
                </span>
                <span className="flex-1 text-ink-muted line-through decoration-ink-muted/40">{t.title}</span>
                <button
                  type="button"
                  onClick={() => onUndo(t.id)}
                  tabIndex={open === 'done' ? 0 : -1}
                  className="rounded-full px-2 py-0.5 text-xs text-ink-muted opacity-70 transition hover:bg-sage hover:text-ink hover:opacity-100"
                >
                  Undo
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="expand mx-auto max-w-lg text-left" data-open={open === 'waiting'}>
        <div>
          <ul className="mt-3 space-y-2 rounded-card bg-mist-soft/60 p-2">
            {waiting.map((w) => (
              <li key={w.item.id} className="flex gap-3 rounded-xl px-3 py-2.5 text-[14px]">
                <ClockIcon className="mt-0.5 size-4 shrink-0 text-mist" />
                <p className="text-mist">
                  <span className="font-semibold text-ink-soft">{w.item.title}:</span> {w.text}
                </p>
              </li>
            ))}
            {requests.map((r) => (
              <li key={r.id}>
                <RequestTracker
                  request={r}
                  managerName={managerName}
                  onResubmit={onResubmit}
                  focusable={open === 'waiting'}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

const STEP_LABELS = (manager: string) => ['Requested', `Waiting on ${manager}`, 'Approved', 'Ready']

function RequestTracker({
  request,
  managerName,
  onResubmit,
  focusable,
}: {
  request: AccessRequest
  managerName: string
  onResubmit: (id: string) => void
  focusable: boolean
}) {
  const [open, setOpen] = useState(false)
  const label = request.resource === 'production repo' ? 'Repo access' : request.resource
  const declined = request.status === 'declined'
  const reached = { waitingOnManager: 1, approved: 2, ready: 3, declined: 1 }[request.status]

  const pill = {
    waitingOnManager: { text: `waiting on ${managerName}`, cls: 'bg-paper text-mist' },
    approved: { text: 'approved, IT is setting it up', cls: 'bg-sage text-leaf-deep' },
    ready: { text: 'ready', cls: 'bg-sage text-leaf-deep' },
    declined: { text: 'needs a change', cls: 'bg-amber-soft text-amber' },
  }[request.status]

  const caption = {
    waitingOnManager: `${managerName} has your request. He usually responds within a day.`,
    approved: `${managerName} approved it. IT is setting it up now.`,
    ready: 'All set. It’ll be there when you log in.',
    declined: `${managerName} asked for a change.`,
  }[request.status]

  return (
    <div className="rounded-xl px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        tabIndex={focusable ? 0 : -1}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ring-black/5 transition ${pill.cls}`}
      >
        {request.status === 'ready' ? <CheckIcon className="size-3.5" /> : <ClockIcon className="size-3.5" />}
        <span>
          <span className="font-semibold">{label}:</span> {pill.text}
        </span>
        <ChevronIcon open={open} className="size-3" />
      </button>

      <div className="expand" data-open={open}>
        <div>
          <ol className="mt-4 grid grid-cols-4 gap-1 px-1" aria-label={`${label} progress`}>
            {STEP_LABELS(managerName).map((step, i) => {
              const isDecline = declined && i === 1
              const doneStep = !declined ? i <= reached : i === 0
              const now = request.status !== 'ready' && i === reached
              return (
                <li key={step} className="flex flex-col items-center text-center">
                  <span className="relative flex w-full items-center justify-center">
                    {i > 0 && (
                      <span
                        aria-hidden="true"
                        className={`absolute right-1/2 top-1/2 h-px w-full ${doneStep ? 'bg-leaf/60' : 'bg-mist/25'}`}
                      />
                    )}
                    <span
                      className={`relative flex size-5 items-center justify-center rounded-full transition duration-500 ${
                        isDecline
                          ? 'bg-amber-soft ring-1 ring-amber/40'
                          : doneStep && !now
                            ? 'bg-leaf text-paper'
                            : now
                              ? 'bg-paper ring-2 ring-leaf'
                              : 'bg-paper ring-1 ring-mist/30'
                      }`}
                    >
                      {doneStep && !now && <CheckIcon className="size-3" />}
                      {now && !isDecline && <span className="size-1.5 rounded-full bg-leaf" />}
                    </span>
                  </span>
                  <span
                    className={`mt-1.5 text-[11px] leading-tight ${
                      isDecline ? 'font-semibold text-amber' : now ? 'font-semibold text-ink' : 'text-mist'
                    }`}
                  >
                    {isDecline ? 'Needs a change' : step}
                  </span>
                </li>
              )
            })}
          </ol>
          <p className="mt-3 px-1 text-[13px] text-mist">{caption}</p>
          {declined && (
            <div className="mt-3 rounded-xl bg-amber-soft/70 px-3.5 py-3 text-[13px]">
              <p className="text-amber">
                <span className="font-semibold">{managerName}:</span> “{request.note}”
              </p>
              <button
                type="button"
                onClick={() => onResubmit(request.id)}
                className="mt-2.5 rounded-full bg-paper px-3.5 py-1.5 text-[13px] font-semibold text-ink ring-1 ring-line transition hover:ring-leaf"
              >
                Fix and resubmit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
