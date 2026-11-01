import { useRef, useState, type KeyboardEvent } from 'react'
import { fill, type CopyContext } from '../data/copy'
import type { ComingUp } from '../data/selectors'
import type { Task } from '../data/types'
import { Chip, ClockIcon } from './ui'
import { useToast } from './useToast'

type Tab = 'monday' | 'week1' | 'month1'

/**
 * "Coming up" on the all-set screen: Monday's itinerary, Week 1 and the first month,
 * all read-only. Nothing here can be checked off; it opens when she gets there.
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
          <div className="animate-fade-up">
            <ol className="divide-y divide-line/70">
              {data.monday.items.map((item) => (
                <li key={item.time} className="flex items-baseline gap-4 py-2.5 text-[15px]">
                  <span className="w-12 shrink-0 text-right text-[13px] font-medium tabular-nums text-ink-muted">
                    {item.time}
                  </span>
                  <span className="flex-1 text-ink-soft">{fill(item.text, copy)}</span>
                  {item.owner && <Chip tone="mist">{item.owner}</Chip>}
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {data.monday.footnote && <p className="text-[13px] text-ink-muted">{data.monday.footnote}</p>}
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
          </div>
        ) : (
          <TaskPreview tasks={tab === 'week1' ? data.week1 : data.month1} copy={copy} showMinutes={tab === 'week1'} />
        )}
      </div>
      {toast.node}
    </section>
  )
}

function TaskPreview({ tasks, copy, showMinutes }: { tasks: Task[]; copy: CopyContext; showMinutes: boolean }) {
  return (
    <div className="animate-fade-up">
      <p className="mb-1 text-[12px] text-ink-muted">Opens when you get there</p>
      <ul className="divide-y divide-line/70">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2.5 text-[15px]">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-sage-deep" />
            <span className="flex-1 text-ink-soft">{fill(t.title, copy)}</span>
            {showMinutes && (
              <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-ink-muted">
                <ClockIcon className="size-3" />
                {t.minutes} min
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
