import { useState } from 'react'
import { fill } from '../data/copy'
import { taskSummary } from '../data/summaries'
import type { WaitingRow } from '../data/selectors'
import type { AccessRequest, Task } from '../data/types'
import { RequestTracker } from './RequestTracker'
import { CheckIcon, ChevronIcon, ClockIcon } from './ui'

interface FooterLineProps {
  done: Task[]
  waiting: WaitingRow[]
  requests: AccessRequest[]
  managerName: string
  startDay: string
  onUndo: (taskId: string) => void
  onEdit: (taskId: string) => void
  editingId: string | null
  /** A request that was just sent: open its tracker so she sees it went through. */
  spotlightRequestId: string | null
  onResubmit: (requestId: string) => void
}

type Panel = 'done' | 'waiting' | null

/** "2 done · 1 waiting on others". Each part expands in place. */
export function FooterLine({
  done,
  waiting,
  requests,
  managerName,
  startDay,
  onUndo,
  onEdit,
  editingId,
  spotlightRequestId,
  onResubmit,
}: FooterLineProps) {
  const [open, setOpen] = useState<Panel>(null)
  // Open the tracker once per newly sent request (adjusting state during render, not in an effect).
  const [shownSpotlight, setShownSpotlight] = useState<string | null>(null)
  if (spotlightRequestId && spotlightRequestId !== shownSpotlight && requests.some((r) => r.id === spotlightRequestId)) {
    setShownSpotlight(spotlightRequestId)
    setOpen('waiting')
  }
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
            {done.map((t) => {
              const summary = taskSummary(t)
              const editable = t.kind === 'form' || t.kind === 'request' || t.kind === 'handoff'
              const editLabel = t.kind === 'handoff' ? 'Reopen' : 'Edit'
              const isEditing = editingId === t.id
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px]">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sage text-leaf">
                    <CheckIcon className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-ink-muted line-through decoration-ink-muted/40">
                      {fill(t.title, { day: startDay, manager: managerName })}
                    </span>
                    {summary && <span className="block truncate text-xs text-ink-muted/80">{summary}</span>}
                  </span>
                  {isEditing ? (
                    <span className="px-2 text-xs text-leaf-deep">Editing</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => (editable ? onEdit(t.id) : onUndo(t.id))}
                      tabIndex={open === 'done' ? 0 : -1}
                      aria-label={`${editable ? editLabel : 'Undo'}: ${fill(t.title, { day: startDay, manager: managerName })}`}
                      className="rounded-full px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:bg-sage hover:text-ink"
                    >
                      {editable ? editLabel : 'Undo'}
                    </button>
                  )}
                </li>
              )
            })}
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
                  key={`${r.id}-${spotlightRequestId === r.id}`}
                  defaultOpen={spotlightRequestId === r.id}
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
