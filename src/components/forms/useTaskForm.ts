import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { loadDraft, saveDraft } from '../../data/drafts'
import type { TaskData } from '../../data/types'

type Errors<T> = Partial<Record<keyof T, string | null>>

interface Options<T extends TaskData> {
  /** localStorage draft key; drafts survive a refresh. */
  draftKey: string
  initial: T
  validate: (values: T) => Errors<T>
  /** Fields never written to drafts (e.g. bank account numbers). */
  noDraft?: (keyof T)[]
  /** Prefix for field ids, so focus can find the first invalid field. */
  idPrefix: string
}

/**
 * Small form state helper: values, friendly errors shown after blur or submit,
 * auto-saved drafts, and focus on the first field that needs attention.
 */
export function useTaskForm<T extends TaskData>({ draftKey, initial, validate, noDraft = [], idPrefix }: Options<T>) {
  const [values, setValues] = useState<T>(() => {
    const draft = loadDraft(draftKey)
    if (!draft) return initial
    const merged = { ...initial }
    for (const k of Object.keys(initial) as (keyof T)[]) {
      const v = draft[k as string]
      // Only take draft values with the same shape as the field.
      if (v !== undefined && typeof v === typeof initial[k] && Array.isArray(v) === Array.isArray(initial[k]))
        merged[k] = v as T[keyof T]
    }
    return merged
  })
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  // Fields she has changed. Blurring an untouched empty field shows nothing, so a
  // note never pops in (and shifts the layout) just because focus moved on.
  const [dirty, setDirty] = useState<Partial<Record<keyof T, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const first = useRef(true)

  // Auto-save drafts as she types (skipping the first render and excluded fields).
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const draft: TaskData = { ...values }
    for (const k of noDraft) delete draft[k as string]
    saveDraft(draftKey, draft)
    // noDraft is static per form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, draftKey])

  const allErrors = validate(values)
  const visible = (name: keyof T) =>
    (touched[name] && dirty[name]) || submitted ? (allErrors[name] ?? null) : null

  const set = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((v) => ({ ...v, [name]: value }))
    setDirty((d) => (d[name] ? d : { ...d, [name]: true }))
  }, [])

  const touch = useCallback((name: keyof T) => setTouched((t) => (t[name] ? t : { ...t, [name]: true })), [])

  const handleSubmit = (onValid: (values: T) => void) => (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validate(values)
    const firstBad = (Object.keys(values) as (keyof T)[]).find((k) => errs[k])
    if (firstBad !== undefined) {
      const el = document.getElementById(`${idPrefix}-${String(firstBad)}`)
      el?.focus()
      return
    }
    onValid(values)
  }

  return { values, set, touch, error: visible, handleSubmit, id: (name: keyof T) => `${idPrefix}-${String(name)}` }
}
