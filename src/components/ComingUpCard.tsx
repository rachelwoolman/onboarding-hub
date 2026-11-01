import { useRef, useState, type KeyboardEvent } from 'react'
import { fill, type CopyContext } from '../data/copy'
import { dueDay, type ComingUp } from '../data/selectors'
import type { Task } from '../data/types'
import { ClockIcon } from './ui'
import { useToast } from './useToast'

type Tab = 'monday' | 'week1' | 'month1'

/**
 * "Coming up" on the all-set screen: the first-day note, Week 1 and the first month,
 * all read-only. Nothing here can be checked off yet.
 * Content comes from the role template and her generated plan, not this component.
 */
export function ComingUpCard({ data, copy }: { data: ComingUp; copy: CopyContext }) {
  const [tab, setTab] = useState<Tab>('monday')
  const tabs: { id: Tab; label: string }[] = [
    { id: 'monday', label: copy.day },
    { id: 'week1', label: 'Week 1' },
    { id: 'month1', label: 'First month' },
  ]
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({ monday: null, week1: null, month1: null })
  const toast = useToast()

  // Arrow keys move between tabs (standard tablist behaviour).
  const onKey = (e: KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === tab)
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null
    if (next === null) return
    e.preventDefault()
    const t = tabs[(next + tabs.length) % tabs.length].id
    setTab(t)
    refs.current[t]?.focus()
  }

  return (
    <section aria-labelledby="coming-up-title" className="animate-card-in rounded-card bg-paper px-5 pb-6 pt-5 shadow-card sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="coming-up-title" className="text-[13px] font-semibold uppercase tracking-[0.12em] text-leaf-deep">
          Coming up
        </h2>
        <div role="tablist" aria-label="Coming up" onKeyDown={onKey} className="flex gap-1 rounded-full bg-cream/80 p-1">
          {tabs.map((t) => {
            const active = t.id === tab
            return (
              <button
                key={t.id}
                ref={(el) => {
                  refs.current[t.id] = el
                }}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={active}
                aria-controls={`panel-${t.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition duration-200 ${
                  active ? 'bg-paper text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-4" key={tab}>
        {tab === 'monday' ? (
          <article className="animate-fade-up text-left">
            {data.guide ? (
              <>
                <p className="text-[15px] leading-relaxed text-ink-soft">{fill(data.guide.intro, copy)}</p>
                {data.guide.sections.map((sec) => (
                  <section key={sec.title} className="mt-4">
                    <h3 className="font-serif text-[17px] font-semibold text-ink">{sec.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{fill(sec.body, copy)}</p>
                  </section>
                ))}
                <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{fill(data.guide.signoff, copy)}</p>
                <p className="mt-1 text-[14px] text-ink-muted">{data.guide.from}</p>
              </>
            ) : (
              <p className="text-[15px] text-ink-muted">Your first-day note is on its way.</p>
            )}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => toast.show(`Mock only: in production this adds ${copy.day} 9:15 to your calendar.`)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium text-leaf-deep ring-1 ring-sage-deep transition hover:bg-sage"
              >
                <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
                  <rect x="2.5" y="3.5" width="11" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Add to calendar
              </button>
            </div>
          </article>
        ) : (
          <TaskPreview tasks={tab === 'week1' ? data.week1 : data.month1} copy={copy} meta={tab === 'week1' ? 'minutes' : 'due'} />
        )}
      </div>
      {toast.node}
    </section>
  )
}

/** Read-only list. Week 1 shows time estimates; the first month shows "by day N". */
function TaskPreview({ tasks, copy, meta }: { tasks: Task[]; copy: CopyContext; meta: 'minutes' | 'due' }) {
  return (
    <ul className="animate-fade-up divide-y divide-line/70">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-2.5 text-[15px]">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-sage-deep" />
          <span className="flex-1 text-ink-soft">{fill(t.title, copy)}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-ink-muted">
            {meta === 'minutes' ? (
              <>
                <ClockIcon className="size-3" />
                {t.minutes} min
              </>
            ) : (
              <>by day {dueDay(t)}</>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
