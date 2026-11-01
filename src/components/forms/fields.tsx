import type { InputHTMLAttributes, ReactNode } from 'react'
import { CheckIcon } from '../ui'

/** Amber, never red: a gentle note about what to fix. */
export function FieldNote({ id, message }: { id: string; message: string | null }) {
  return (
    <p id={id} aria-live="polite" className={`text-[13px] leading-snug text-amber ${message ? 'mt-1.5' : 'sr-only'}`}>
      {message && (
        <>
          <span aria-hidden="true" className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-amber/70" />
          {message}
        </>
      )}
    </p>
  )
}

const inputShape =
  'block h-12 w-full rounded-xl px-4 text-[16px] text-ink ring-1 transition duration-200 placeholder:text-ink-muted/70 focus:bg-paper focus:outline-none focus:ring-2 focus:ring-leaf'
const inputBase = `${inputShape} bg-cream/60 ring-line hover:ring-sage-deep`
const inputWarn = `${inputShape} bg-amber-soft/60 ring-amber/50`

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'id'> {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error: string | null
  hint?: string
  optional?: boolean
  prefix?: string
}

export function TextField({ id, label, value, onChange, error, hint, optional, prefix, className = '', ...rest }: TextFieldProps) {
  const noteId = `${id}-note`
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-[14px] font-medium text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-ink-muted">Optional</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[16px] text-ink-muted">
            {prefix}
          </span>
        )}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, noteId].filter(Boolean).join(' ')}
          className={`${error ? inputWarn : inputBase} ${prefix ? 'pl-8' : ''}`}
          {...rest}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[13px] text-ink-muted">
          {hint}
        </p>
      )}
      <FieldNote id={noteId} message={error} />
    </div>
  )
}

interface ChoiceOption {
  value: string
  label: string
  hint?: string
}

function ChoiceMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md transition duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-leaf peer-focus-visible:ring-offset-2 ${
        checked ? 'bg-leaf text-paper' : 'bg-paper ring-1 ring-sage-deep'
      }`}
    >
      {checked && <CheckIcon className="size-3" />}
    </span>
  )
}

function ChoiceGroup({
  id,
  legend,
  options,
  error,
  children,
  hint,
}: {
  id: string
  legend: string
  options: ChoiceOption[]
  error: string | null
  hint?: string
  children: (o: ChoiceOption, i: number) => ReactNode
}) {
  return (
    <fieldset aria-describedby={`${id}-note`}>
      <legend className="mb-1.5 text-[14px] font-medium text-ink">{legend}</legend>
      {hint && <p className="-mt-0.5 mb-2 text-[13px] text-ink-muted">{hint}</p>}
      <div className={`space-y-1 rounded-2xl p-1.5 transition ${error ? 'bg-amber-soft/50' : 'bg-cream/60'}`}>
        {options.map((o, i) => children(o, i))}
      </div>
      <FieldNote id={`${id}-note`} message={error} />
    </fieldset>
  )
}

const choiceRow = 'flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-[15px] text-ink transition hover:bg-paper'

export function CheckboxGroup(props: {
  id: string
  legend: string
  options: ChoiceOption[]
  value: string[]
  onChange: (v: string[]) => void
  onBlur?: () => void
  error: string | null
  hint?: string
}) {
  const { id, value, onChange, onBlur } = props
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <ChoiceGroup {...props}>
      {(o, i) => (
        <label key={o.value} className={choiceRow}>
          <input
            id={i === 0 ? id : undefined}
            type="checkbox"
            checked={value.includes(o.value)}
            onChange={() => toggle(o.value)}
            onBlur={onBlur}
            className="peer sr-only"
          />
          <ChoiceMark checked={value.includes(o.value)} />
          <span>
            {o.label}
            {o.hint && <span className="block text-[13px] text-ink-muted">{o.hint}</span>}
          </span>
        </label>
      )}
    </ChoiceGroup>
  )
}
