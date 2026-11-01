import { useEffect, useRef, useState } from 'react'
import { loadDraft, saveDraft } from '../../data/drafts'
import type { BodyProps } from './TaskBodies'
import { CheckIcon } from '../ui'

type View = 'card' | 'portal'

/**
 * Sensitive paperwork (I-9 and W-4) is finished in BrightPath's secure HR
 * portal, never typed into this app. The card says what it is and what to have ready,
 * opens the portal (a clearly labeled mock here), then asks her to confirm she finished.
 */
export function HandoffBody({ task, mode, idPrefix, draftKey, submit, footer }: BodyProps) {
  const portal = task.portal
  const editing = mode === 'edit'
  const [view, setView] = useState<View>('card')
  // Whether she has come back from the portal. Saved, so a refresh keeps it.
  const [returned, setReturned] = useState(() => loadDraft(draftKey)?.returned === true)
  const portalRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const moved = useRef(false)

  // Move focus with the view: into the portal when it opens, back to the
  // confirm button when she returns.
  useEffect(() => {
    if (!moved.current) return
    if (view === 'portal') portalRef.current?.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true })
    else formRef.current?.querySelector<HTMLButtonElement>('button[type=submit]')?.focus({ preventScroll: true })
  }, [view])

  const open = () => {
    moved.current = true
    setView('portal')
  }
  const back = (finished: boolean) => {
    moved.current = true
    if (finished) {
      setReturned(true)
      saveDraft(draftKey, { returned: true })
    }
    setView('card')
  }

  if (view === 'portal') {
    return (
      <div
        ref={portalRef}
        role="region"
        aria-label="Mock secure HR portal"
        onKeyDown={(e) => {
          if (e.key === 'Escape') back(false)
        }}
        className="animate-fade-up overflow-hidden rounded-2xl bg-paper ring-1 ring-line"
      >
        <div className="flex items-center gap-2 border-b border-line bg-cream/80 px-4 py-2.5 text-xs text-ink-muted">
          <LockIcon className="size-3.5 text-leaf-deep" />
          <span className="truncate">hr.brightpath.example</span>
          <span className="ml-auto shrink-0 rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber">
            Mock screen
          </span>
        </div>
        <div className="px-5 py-6 text-center sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-leaf-deep">BrightPath HR portal</p>
          <h3 tabIndex={-1} className="mt-2 text-[19px] font-semibold text-ink focus:outline-none">
            {portal?.formName ?? task.title}
          </h3>
          <p className="mx-auto mt-3 max-w-xs text-pretty text-[15px] leading-relaxed text-ink-soft">
            In production this opens BrightPath’s secure HR portal. Nothing you enter there is stored in this app.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => back(true)}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper transition hover:bg-ink-soft active:scale-[0.98]"
            >
              Done in portal
            </button>
            <button
              type="button"
              onClick={() => back(false)}
              className="rounded-full px-3 py-1.5 text-[13px] text-ink-muted transition hover:text-ink"
            >
              Back without finishing
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (returned) submit({ finishedAt: new Date().toISOString() })
        else open()
      }}
    >
      {portal && portal.haveReady.length > 0 && (
        <div className="rounded-2xl bg-cream/70 px-5 py-4 text-left">
          <p id={`${idPrefix}-ready`} className="text-[13px] font-semibold text-ink">
            Have ready
          </p>
          <ul aria-labelledby={`${idPrefix}-ready`} className="mt-2 space-y-1.5">
            {portal.haveReady.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[15px] text-ink-soft">
                <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-leaf/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {returned && (
        <p role="status" className="mt-4 flex items-center justify-center gap-2 text-[14px] text-leaf-deep">
          <CheckIcon className="size-4" /> Back from the portal
        </p>
      )}

      {footer({
        label: returned ? (editing ? 'Done' : 'I’ve finished it') : 'Open secure form',
        secondary: returned ? (
          <button type="button" onClick={open} className={linkCls}>
            Open it again
          </button>
        ) : undefined,
      })}
    </form>
  )
}

const linkCls =
  'rounded-full px-3 py-1.5 text-[13px] text-ink-muted underline decoration-ink-muted/30 underline-offset-4 transition hover:text-ink'

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`shrink-0 ${className}`} fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
