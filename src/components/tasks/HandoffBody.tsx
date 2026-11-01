import { useEffect, useRef, useState } from 'react'
import type { BodyProps } from './TaskBodies'

type View = 'card' | 'portal'

/**
 * Sensitive paperwork (I-9 and W-4) is finished in BrightPath's secure HR portal, never
 * typed into this app. The card says what it is and what to have ready; "Open secure form"
 * shows a portal-style panel, and "Finish in portal" completes the task and moves her on.
 * The panel's rows are static previews: nothing is entered or stored here.
 */
export function HandoffBody({ task, submit, footer }: BodyProps) {
  const portal = task.portal
  const [view, setView] = useState<View>('card')
  const panelRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLFormElement>(null)
  const moved = useRef(false)

  // Move focus with the view: into the portal when it opens, back to the button on close.
  useEffect(() => {
    if (!moved.current) return
    if (view === 'portal') panelRef.current?.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true })
    else cardRef.current?.querySelector<HTMLButtonElement>('button[type=submit]')?.focus({ preventScroll: true })
  }, [view])

  const go = (next: View) => {
    moved.current = true
    setView(next)
  }

  if (view === 'portal') {
    return (
      <div
        ref={panelRef}
        role="region"
        aria-label="BrightPath HR secure portal"
        onKeyDown={(e) => {
          if (e.key === 'Escape') go('card')
        }}
        className="relative animate-fade-up overflow-hidden rounded-2xl bg-paper text-left ring-1 ring-line"
      >
        <div className="flex items-center gap-2 border-b border-line bg-cream/80 px-4 py-2.5 text-xs text-ink-muted">
          <LockIcon className="size-3.5 text-leaf-deep" />
          <span className="truncate">BrightPath HR · Secure portal</span>
          <button
            type="button"
            onClick={() => go('card')}
            aria-label="Close"
            className="-mr-1 ml-auto rounded-full p-1 text-ink-muted transition hover:bg-paper hover:text-ink"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            submit({ finishedAt: new Date().toISOString() })
          }}
          className="px-5 pb-6 pt-5 sm:px-6"
        >
          <h3 tabIndex={-1} className="text-[18px] font-semibold text-ink focus:outline-none">
            {portal?.formName ?? task.title}
          </h3>
          {portal?.preview && (
            <dl className="mt-4 space-y-2" aria-label="Form preview">
              {portal.preview.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl bg-cream/70 px-3.5 py-2.5">
                  <dt className="text-[13px] text-ink-muted">{row.label}</dt>
                  <dd className="text-[14px] tabular-nums text-ink-muted/80">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {footer({ label: 'Finish in portal' })}
        </form>
      </div>
    )
  }

  return (
    <form
      ref={cardRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        go('portal')
      }}
    >
      {portal && portal.haveReady.length > 0 && (
        <div className="rounded-2xl bg-cream/70 px-5 py-4 text-left">
          <p id={`${task.key}-ready`} className="text-[13px] font-semibold text-ink">
            Have ready
          </p>
          <ul aria-labelledby={`${task.key}-ready`} className="mt-2 space-y-1.5">
            {portal.haveReady.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[15px] text-ink-soft">
                <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-leaf/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {footer({ label: 'Open secure form' })}
    </form>
  )
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`shrink-0 ${className}`} fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
