import { describe, expect, it } from 'vitest'
import { makeRedactor, maskPhone, maskPhones } from './redaction.ts'

describe('maskPhones', () => {
  it.each([
    ['+55 48 99999-0000', '+•• •• •••••-0000'],
    ['+55 (48) 99999-0000', '+•• (••) •••••-0000'],
    ['(48) 99999-0000', '(••) •••••-0000'],
    ['48 3333-0000', '•• ••••-0000'],
    ['+5548999990000', '+•••••••••0000'],
    ['+1 555-123-4567', '+• •••-•••-4567'],
  ])('masks %s', (phone, masked) => {
    expect(maskPhones(phone)).toBe(masked)
  })

  it('leaves dates, times, money and WhatsApp file names alone', () => {
    const text = 'Em 14/10/2023 às 14:22, R$ 1.500,00, IMG-20231014-WA0001.jpg e 00000012-PHOTO-2023-10-15-14-22-33.jpg'
    expect(maskPhones(text)).toBe(text)
  })

  it('masks numbers inside a sentence', () => {
    expect(maskPhones('liga no 48 99999-0000 depois')).toBe('liga no •• •••••-0000 depois')
    expect(maskPhone('99999-0000')).toBe('•••••-0000')
  })
})

describe('makeRedactor', () => {
  const redactor = makeRedactor({ aliases: { 'Ana Souza': 'Aninha', Sol: 'S.' }, maskNumbers: true })

  it('calls participants by their alias, or masks a participant known only by the number', () => {
    expect(redactor.name('Ana Souza')).toBe('Aninha')
    expect(redactor.name('+55 48 99999-0000')).toBe('+•• •• •••••-0000')
    expect(redactor.name('Bruno')).toBe('Bruno')
  })

  it('swaps aliased names in free text, whole names only', () => {
    expect(redactor.text('Ana Souza adicionou Sol e Solange, @Ana Souza')).toBe('Aninha adicionou S. e Solange, @Aninha')
  })

  it('does nothing without aliases or masks', () => {
    const none = makeRedactor({ aliases: {}, maskNumbers: false })
    expect(none.text('Ana Souza +55 48 99999-0000')).toBe('Ana Souza +55 48 99999-0000')
  })
})
