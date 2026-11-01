import { useStore } from '../state/store'
import type { View } from '../data/types'
import { SproutMark } from './ui'

const OPTIONS: { value: View; label: string }[] = [
  { value: 'hire', label: 'New hire' },
  { value: 'manager', label: 'Manager' },
]

export function TopBar() {
  const { state, actions } = useStore()
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 pt-5 sm:px-8 sm:pt-7">
      <div className="flex items-center gap-2.5">
        <SproutMark />
        <span className="text-[15px] tracking-tight text-ink">
          BrightPath <span className="font-semibold">Start</span>
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="View as"
        className="flex items-center gap-0.5 rounded-full bg-sage/70 p-1 text-[13px]"
      >
        <span className="hidden pl-2.5 pr-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted sm:inline">
          View as
        </span>
        {OPTIONS.map((o) => {
          const active = state.view === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => actions.setView(o.value)}
              className={`rounded-full px-3 py-1.5 font-medium transition duration-200 ${
                active ? 'bg-paper text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </header>
  )
}
