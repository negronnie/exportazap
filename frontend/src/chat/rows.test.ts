import { describe, expect, it } from 'vitest'
import { parseExport } from '../import/parseExport.ts'
import { buildRows } from './rows.ts'

const text = [
  '14/10/2023 09:00 - Bia criou o grupo',
  '14/10/2023 09:01 - Ana: oi',
  '14/10/2023 09:02 - Ana: tudo bem?',
  '14/10/2023 09:03 - Lucas: tudo',
  '15/10/2023 08:00 - Lucas: bom dia',
  '15/10/2023 08:01 - Ana saiu',
  '15/10/2023 08:02 - Lucas: eita',
].join('\n')

describe('buildRows', () => {
  const rows = buildRows(parseExport(text).entries, 'Lucas')

  it('puts a date chip before each day', () => {
    expect(rows.map((row) => row.kind)).toEqual([
      'date',
      'notice',
      'message',
      'message',
      'message',
      'date',
      'message',
      'notice',
      'message',
    ])
    expect(rows[5]).toMatchObject({ kind: 'date', day: '2023-10-15T08:00:00' })
  })

  it('marks your messages as outgoing and the first message of each run', () => {
    const messages = rows.flatMap((row) => (row.kind === 'message' ? [[row.message.text, row.outgoing, row.firstOfRun]] : []))
    expect(messages).toEqual([
      ['oi', false, true],
      ['tudo bem?', false, false],
      ['tudo', true, true],
      // A new day and a notice both start a new run.
      ['bom dia', true, true],
      ['eita', true, true],
    ])
  })

  it('gives every row a stable, unique key', () => {
    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length)
  })
})
