import { describe, expect, it } from 'vitest'
import { parseExport } from '../import/parseExport.ts'
import { chatStats, gallery } from './stats.ts'

const { entries } = parseExport(
  [
    '14/10/2023 09:00 - Bia criou o grupo',
    '14/10/2023 09:01 - Ana: oi, olha https://exemplo.com.br/a.',
    '14/10/2023 21:02 - Ana: IMG-20231014-WA0001.jpg (arquivo anexado)',
    '15/10/2023 21:03 - Lucas: Cardápio.pdf (arquivo anexado)',
    '15/10/2023 21:04 - Lucas: VID-20231015-WA0002.mp4 (arquivo anexado)',
  ].join('\n'),
)

describe('chatStats', () => {
  const { all, byAuthor } = chatStats(entries)

  it('counts messages, attachments and the hours of activity', () => {
    expect(all).toMatchObject({ messages: 4, attachments: 3, first: '2023-10-14T09:01:00', last: '2023-10-15T21:04:00' })
    expect(all.hours[9]).toBe(1)
    expect(all.hours[21]).toBe(3)
  })

  it('splits the numbers by author, leaving notices out', () => {
    expect([...byAuthor.keys()]).toEqual(['Ana', 'Lucas'])
    expect(byAuthor.get('Lucas')).toMatchObject({ messages: 2, attachments: 2, first: '2023-10-15T21:03:00' })
  })
})

describe('gallery', () => {
  it('lists media, links and documents newest first, only media that came with the export', () => {
    const result = gallery(entries, (fileName) => fileName !== 'VID-20231015-WA0002.mp4')
    expect(result.media.map((message) => message.attachment?.fileName)).toEqual(['IMG-20231014-WA0001.jpg'])
    expect(result.documents.map((message) => message.attachment?.fileName)).toEqual(['Cardápio.pdf'])
    expect(result.links.map((link) => link.url)).toEqual(['https://exemplo.com.br/a'])
  })
})
