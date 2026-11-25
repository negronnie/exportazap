// The Redaction of CONTEXT.md: aliases, number masks and hidden messages, applied the same way on
// screen and in every output, so no original name or number leaks into what is shared.

/**
 * Phone numbers as people write them: international with a plus sign, or Brazilian with a
 * separator before the last four digits. Dates, times and WhatsApp file names do not match.
 */
const PHONE = /\+\d[\d\s().-]{7,}\d|\(?\b\d{2}\)?[\s.-]?9?\d{4}[\s.-]\d{4}\b/g

/** `+55 48 99999-0000` → `+•• •• •••••-0000`: every digit but the last four is masked. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').length
  let seen = 0
  return phone.replace(/\d/g, (digit) => (++seen > digits - 4 ? digit : '•'))
}

export const maskPhones = (text: string) => text.replace(PHONE, maskPhone)

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export interface RedactionSettings {
  /** Alias by original participant name. */
  aliases: Record<string, string>
  maskNumbers: boolean
}

export interface Redactor {
  /** How a participant is called: the alias, or the name with its number masked when asked. */
  name(participant: string): string
  /** Free text with the aliased names swapped and, when asked, the numbers masked. */
  text(text: string): string
}

export function makeRedactor({ aliases, maskNumbers }: RedactionSettings): Redactor {
  const named = Object.entries(aliases).sort(([a], [b]) => b.length - a.length)
  // Whole names only: an alias for "Sol" must not touch "Solange".
  const pattern = named.length
    ? new RegExp(named.map(([original]) => `(?<![\\p{L}\\p{N}])${escape(original)}(?![\\p{L}\\p{N}])`).join('|'), 'gu')
    : null
  const lookup = new Map(named)

  const text = (value: string) => {
    let result = pattern ? value.replace(pattern, (found) => lookup.get(found) ?? found) : value
    if (maskNumbers) result = maskPhones(result)
    return result
  }
  return {
    name: (participant) => aliases[participant] ?? (maskNumbers ? maskPhones(participant) : participant),
    text,
  }
}

export interface RedactionSummary {
  aliases: [original: string, alias: string][]
  maskNumbers: boolean
  hidden: number
}

/** What was redacted, for the cover page of the PDF (ADR 0005). */
export function summarizeRedaction(settings: RedactionSettings, hidden: number[]): RedactionSummary {
  return { aliases: Object.entries(settings.aliases), maskNumbers: settings.maskNumbers, hidden: hidden.length }
}
