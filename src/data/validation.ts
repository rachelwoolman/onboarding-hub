/**
 * Friendly, specific validators. Each returns a message to show, or null when valid.
 * Messages talk to the person ("That phone number looks short"), never at them.
 */

export type Check = (value: string) => string | null

export const digitsOnly = (v: string) => v.replace(/\D/g, '')

export function required(message: string): Check {
  return (v) => (v.trim() ? null : message)
}

export function phone(v: string): string | null {
  const d = digitsOnly(v)
  if (!v.trim()) return 'We need a mobile number so IT can reach you.'
  if (/[a-z]/i.test(v)) return 'Just numbers, please. Spaces and dashes are fine.'
  const national = d.length === 11 && d.startsWith('1') ? d.slice(1) : d
  if (national.length < 10) return 'That phone number looks short.'
  if (national.length > 10) return 'That phone number looks a little long.'
  return null
}

/** Formats 10 digits as (555) 010-1234 for display. */
export function formatPhone(v: string): string {
  let d = digitsOnly(v)
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1)
  if (d.length !== 10) return v.trim()
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

export function email(v: string): string | null {
  const t = v.trim()
  if (!t) return 'We need a personal email for your welcome details.'
  if (!t.includes('@')) return 'That email is missing an @.'
  if (/\s/.test(t)) return 'Emails can’t have spaces.'
  if (!/^[^@]+@[^@]+\.[a-z]{2,}$/i.test(t)) return 'That email doesn’t look complete yet.'
  return null
}
