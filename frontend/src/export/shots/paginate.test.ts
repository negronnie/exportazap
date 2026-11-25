import { describe, expect, it } from 'vitest'
import { paginate } from './paginate.ts'

const rows = (...heights: number[]) => heights.map((height) => ({ height }))

describe('paginate', () => {
  it('fills each page with whole rows', () => {
    expect(paginate(rows(40, 40, 40, 40, 40), 100)).toEqual([[0, 1], [2, 3], [4]])
  })

  it('leaves less room on the first page when it carries the header', () => {
    expect(paginate(rows(40, 40, 40, 40), 100, 50)).toEqual([[0], [1, 2], [3]])
  })

  it('gives a row taller than a page a page of its own', () => {
    expect(paginate(rows(30, 250, 30), 100)).toEqual([[0], [1], [2]])
  })

  it('moves a date chip that would end a page to the next one, with its messages', () => {
    const measured = [{ height: 40 }, { height: 40 }, { height: 10, sticky: true }, { height: 40 }]
    expect(paginate(measured, 100)).toEqual([[0, 1], [2, 3]])
  })

  it('keeps a lone date chip when it is all the page has', () => {
    expect(paginate([{ height: 10, sticky: true }, { height: 200 }], 100)).toEqual([[0], [1]])
  })
})
