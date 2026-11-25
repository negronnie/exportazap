import { describe, expect, it } from 'vitest'
import { parseExport } from '../import/parseExport.ts'
import { fullRange, inRange, isFull, rangeBetween, withEnd, withStart } from './range.ts'

const { entries } = parseExport(
  [
    '14/10/2023 09:00 - Ana: um',
    '14/10/2023 09:00 - Lucas: dois',
    '14/10/2023 21:00 - Ana: três',
    '15/10/2023 08:00 - Lucas: quatro',
    '16/10/2023 08:00 - Ana: cinco',
  ].join('\n'),
)

describe('range', () => {
  it('starts covering the whole chat', () => {
    expect(fullRange(entries)).toEqual({ start: 0, end: 4 })
    expect(isFull(fullRange(entries), entries)).toBe(true)
  })

  it('keeps the start before the end when one end moves past the other', () => {
    expect(withStart({ start: 0, end: 2 }, 3)).toEqual({ start: 3, end: 3 })
    expect(withEnd({ start: 2, end: 4 }, 1)).toEqual({ start: 1, end: 1 })
    expect(withStart({ start: 0, end: 4 }, 1)).toEqual({ start: 1, end: 4 })
  })

  it('takes every entry between two moments, both ends included', () => {
    expect(rangeBetween(entries, '2023-10-14T09:00:00', '2023-10-15T08:00:00')).toEqual({ start: 0, end: 3 })
    expect(rangeBetween(entries, '2023-10-14T12:00:00', '2023-10-15T23:59:59')).toEqual({ start: 2, end: 3 })
  })

  it('finds no range when nothing falls between the moments', () => {
    expect(rangeBetween(entries, '2023-10-14T10:00:00', '2023-10-14T11:00:00')).toBeNull()
    expect(rangeBetween(entries, '2024-01-01T00:00:00', '2024-12-31T00:00:00')).toBeNull()
  })

  it('tells whether an entry is inside', () => {
    expect([0, 1, 2, 3, 4].map((index) => inRange({ start: 1, end: 3 }, index))).toEqual([false, true, true, true, false])
  })
})
