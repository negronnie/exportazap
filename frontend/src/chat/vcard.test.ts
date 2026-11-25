import { describe, expect, it } from 'vitest'
import { parseVCard } from './vcard.ts'

describe('parseVCard', () => {
  it('reads the name and the numbers WhatsApp writes', () => {
    const card = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Souza;Ana;;;',
      'FN:Ana Souza',
      'item1.TEL;waid=5548999990000:+55 48 99999-0000',
      'item1.X-ABLabel:Celular',
      'TEL;TYPE=WORK:+55 48 3333-0000',
      'END:VCARD',
    ].join('\r\n')
    expect(parseVCard(card)).toEqual({ name: 'Ana Souza', phones: ['+55 48 99999-0000', '+55 48 3333-0000'] })
  })

  it('falls back to the structured name and unfolds long lines', () => {
    expect(parseVCard('BEGIN:VCARD\nN:Lima;Bruno\nTEL:+55 11 9\n 8888-7777\nEND:VCARD')).toEqual({
      name: 'Bruno Lima',
      phones: ['+55 11 98888-7777'],
    })
  })
})
