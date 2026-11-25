// The chat as the rows of the scrolling list: a date chip whenever the day changes, then notices
// and messages. Consecutive messages from the same author on the same day form a run; only the
// first one gets the tail and, in groups, the author name.

import type { Entry, LocalDateTime, Message, SystemNotice } from './model.ts'

export type Row =
  | { kind: 'date'; key: string; day: LocalDateTime }
  | { kind: 'notice'; key: string; notice: SystemNotice }
  | { kind: 'message'; key: string; message: Message; outgoing: boolean; firstOfRun: boolean }

const dayOf = (at: LocalDateTime) => at.slice(0, 10)

export function buildRows(entries: Entry[], self: string | null): Row[] {
  const rows: Row[] = []
  let day = ''
  let previousAuthor: string | null = null
  for (const entry of entries) {
    if (dayOf(entry.at) !== day) {
      day = dayOf(entry.at)
      rows.push({ kind: 'date', key: `d${day}`, day: entry.at })
      previousAuthor = null
    }
    if (entry.kind === 'notice') {
      rows.push({ kind: 'notice', key: `e${entry.index}`, notice: entry })
      previousAuthor = null
      continue
    }
    rows.push({
      kind: 'message',
      key: `e${entry.index}`,
      message: entry,
      outgoing: entry.author === self,
      firstOfRun: entry.author !== previousAuthor,
    })
    previousAuthor = entry.author
  }
  return rows
}
