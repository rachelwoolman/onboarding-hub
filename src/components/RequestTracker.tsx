import { useState } from 'react'
import type { AccessRequest } from '../data/types'
import { CheckIcon, ChevronIcon, ClockIcon } from './ui'

const STEP_LABELS = (manager: string) => ['Requested', `With ${manager}`, 'Approved', 'Ready']

/** "With Mateo", "Approved, IT is setting it up"... the short status after "Code access:". */
function requestStatusText(request: AccessRequest, managerName: string): string {
  return {
    waitingOnManager: `with ${managerName}`,
    approved: 'approved, IT is setting it up',
    ready: 'ready',
    declined: 'needs a change',
  }[request.status]
}

/** The 4-step tracker (Requested, With Mateo, Approved, Ready), its caption, and fix-and-resubmit. */
export function TrackerSteps({
  request,
  managerName,
  onResubmit,
}: {
  request: AccessRequest
  managerName: string
  onResubmit: (id: string) => void
}) {
  const label = request.resource
  const declined = request.status === 'declined'
  const reached = { waitingOnManager: 1, approved: 2, ready: 3, declined: 1 }[request.status]
  const caption = {
    waitingOnManager: `${managerName} has your request. He usually responds within a day.`,
    approved: `${managerName} approved it. IT is setting it up now.`,
    ready: 'All set. It’ll be there when you log in.',
    declined: `${managerName} asked for a change.`,
  }[request.status]

  return (
    <>
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
    </>
  )
}

/** Footer version: a status pill ("Code access: with Mateo") that expands the tracker. */
export function RequestTracker({
  request,
  managerName,
  onResubmit,
  focusable,
  defaultOpen,
}: {
  defaultOpen: boolean
  request: AccessRequest
  managerName: string
  onResubmit: (id: string) => void
  focusable: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const cls = {
    waitingOnManager: 'bg-paper text-mist',
    approved: 'bg-sage text-leaf-deep',
    ready: 'bg-sage text-leaf-deep',
    declined: 'bg-amber-soft text-amber',
  }[request.status]

  return (
    <div className="rounded-xl px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        tabIndex={focusable ? 0 : -1}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ring-black/5 transition ${cls}`}
      >
        {request.status === 'ready' ? <CheckIcon className="size-3.5" /> : <ClockIcon className="size-3.5" />}
        <span>
          <span className="font-semibold">{request.resource}:</span> {requestStatusText(request, managerName)}
        </span>
        <ChevronIcon open={open} className="size-3" />
      </button>
      <div className="expand" data-open={open}>
        <div>
          <TrackerSteps request={request} managerName={managerName} onResubmit={onResubmit} />
        </div>
      </div>
    </div>
  )
}
