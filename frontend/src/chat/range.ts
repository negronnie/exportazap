// The Range of CONTEXT.md: the stretch of the chat between a first and a last entry that goes to the
// outputs. It starts covering the whole chat.

import type { Entry, LocalDateTime } from './model.ts'

/** First and last entry index, both included. */
export interface Range {
  start: number
  end: number
}

export const fullRange = (entries: Entry[]): Range => ({ start: 0, end: Math.max(0, entries.length - 1) })

export const isFull = (range: Range, entries: Entry[]) => range.start === 0 && range.end >= entries.length - 1

export const inRange = (range: Range, index: number) => index >= range.start && index <= range.end

/** Moves one end, keeping the start before the end: a start after the end becomes the new end too. */
export function withStart(range: Range, start: number): Range {
  return { start, end: Math.max(start, range.end) }
}

export function withEnd(range: Range, end: number): Range {
  return { start: Math.min(range.start, end), end }
}

/**
 * The range between two moments: from the first entry at or after `from` to the last one at or
 * before `to`. Null when no entry falls between them.
 */
export function rangeBetween(entries: Entry[], from: LocalDateTime, to: LocalDateTime): Range | null {
  const start = entries.findIndex((entry) => entry.at >= from)
  let end = -1
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].at <= to) {
      end = i
      break
    }
  }
  return start === -1 || end === -1 || start > end ? null : { start, end }
}
