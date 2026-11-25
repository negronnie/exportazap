import { describe, expect, it } from 'vitest'
import { parseExport } from '../import/parseExport.ts'
import { findMatches, search, searchIndex } from './search.ts'

describe('findMatches', () => {
  it('ignores case and accents and points into the original text', () => {
    const text = 'Ação e AÇÃO, depois acao'
    const matches = findMatches(text, 'acao')
    expect(matches.map(([start, end]) => text.slice(start, end))).toEqual(['Ação', 'AÇÃO', 'acao'])
  })

  it('keeps positions right after emoji, which take two code units', () => {
    const text = '🎉 Parabéns 🎉 parabens'
    expect(findMatches(text, 'parabéns').map(([start, end]) => text.slice(start, end))).toEqual(['Parabéns', 'parabens'])
  })

  it('finds nothing for an empty query', () => {
    expect(findMatches('oi', '  ')).toEqual([])
  })
})

describe('search', () => {
  const { entries } = parseExport(
    [
      '14/10/2023 09:00 - Bia criou o grupo',
      '14/10/2023 09:01 - Ana: Vamos à praia?',
      '14/10/2023 09:02 - Lucas: Cardápio.pdf • 2 páginas (arquivo anexado)',
      '14/10/2023 09:03 - Lucas: PRAIA sim',
    ].join('\n'),
  )
  const index = searchIndex(entries)

  it('lists the matching entries in chat order', () => {
    expect(search(index, 'praia')).toEqual([1, 3])
  })

  it('searches notices and document names too', () => {
    expect(search(index, 'grupo')).toEqual([0])
    expect(search(index, 'cardapio')).toEqual([2])
  })

  it('waits for at least two letters', () => {
    expect(search(index, 'p')).toEqual([])
  })
})
