/** Fills `{day}` and `{manager}` in template copy, so text follows a moved start date. */
export interface CopyContext {
  day: string
  manager: string
}

export function fill(text: string, ctx: CopyContext): string {
  return text.replaceAll('{day}', ctx.day).replaceAll('{manager}', ctx.manager)
}
