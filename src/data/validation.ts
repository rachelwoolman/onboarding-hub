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

export function zip(v: string): string | null {
  if (!v.trim()) return 'Add your ZIP code.'
  return /^\d{5}(-\d{4})?$/.test(v.trim()) ? null : 'ZIP codes are 5 digits, like 94110.'
}

/** ABA routing number checksum: 3·(d1+d4+d7) + 7·(d2+d5+d8) + (d3+d6+d9) ≡ 0 (mod 10). */
export function isValidRouting(v: string): boolean {
  if (!/^\d{9}$/.test(v)) return false
  const d = v.split('').map(Number)
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])
  return sum % 10 === 0
}

export function routing(v: string): string | null {
  const d = digitsOnly(v)
  if (!v.trim()) return 'Add your bank’s routing number.'
  if (d.length !== 9) return `Routing numbers are 9 digits. This one has ${d.length}.`
  if (!isValidRouting(d)) return 'That routing number doesn’t check out. Mind looking again?'
  return null
}

export function account(v: string): string | null {
  const d = digitsOnly(v)
  if (!v.trim()) return 'Add your account number.'
  if (d.length < 4) return 'That account number looks short.'
  if (d.length > 17) return 'That account number looks a little long.'
  return null
}

export function githubUsername(v: string): string | null {
  const t = v.trim().replace(/^@/, '')
  if (!t) return 'Add your GitHub username so Mateo knows who to add.'
  if (t.length > 39) return 'GitHub usernames are 39 characters or fewer.'
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d]))*$/i.test(t))
    return 'Usernames use letters, numbers and single dashes, and don’t start or end with a dash.'
  return null
}

// I-9 documents ----------------------------------------------------------------

export interface DocOption {
  id: string
  label: string
  list: 'A' | 'B' | 'C'
}

/** A simplified version of the I-9 acceptable documents lists. */
export const I9_DOCUMENTS: DocOption[] = [
  { id: 'passport', label: 'U.S. passport or passport card', list: 'A' },
  { id: 'green-card', label: 'Permanent resident card', list: 'A' },
  { id: 'license', label: 'Driver’s license or state ID', list: 'B' },
  { id: 'ssn-card', label: 'Social Security card', list: 'C' },
  { id: 'birth-cert', label: 'Birth certificate', list: 'C' },
]

export function i9Documents(ids: string[]): string | null {
  const lists = new Set(I9_DOCUMENTS.filter((d) => ids.includes(d.id)).map((d) => d.list))
  if (ids.length === 0) return 'Pick what you’ll bring so HR can check it on day 1.'
  if (lists.has('A')) return null
  if (lists.has('B') && lists.has('C')) return null
  if (lists.has('B')) return 'Add a Social Security card or birth certificate to go with your ID.'
  return 'Add a photo ID, like a driver’s license, to go with that.'
}
