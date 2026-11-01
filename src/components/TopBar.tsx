import { useStore } from '../state/store'
import type { View } from '../data/types'

const OPTIONS: { value: View; label: string }[] = [
  { value: 'hire', label: 'New hire' },
  { value: 'manager', label: 'Manager' },
]

export function TopBar() {
  const { state, actions } = useStore()
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 pt-5 sm:px-8 sm:pt-7">
      <span className="text-[15px] tracking-tight text-ink">
        BrightPath <span className="font-semibold">Start</span>
      </span>

      <div
        role="radiogroup"
        aria-label="View as"
        className="flex items-center gap-0.5 rounded-full p-0.5 text-[12px] ring-1 ring-line/80"
      >
        <span className="hidden pl-2.5 pr-1 text-[12px] text-ink-muted/80 sm:inline">View as</span>
        {OPTIONS.map((o) => {
          const active = state.view === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => actions.setView(o.value)}
              className={`rounded-full px-2.5 py-1 transition duration-200 ${
                active ? 'bg-sage/80 text-ink-soft' : 'text-ink-muted hover:text-ink-soft'
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
