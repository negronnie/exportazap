// Search that ignores case and accents ("acao" finds "Ação"), with the matches given as positions
// in the original text so the bubble can mark them.

import type { Entry } from './model.ts'

/** Each character folded on its own, so positions in the folded text map back one to one. */
function foldChar(char: string): string {
  return char.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')
}

function fold(text: string): { folded: string; origin: number[] } {
  let folded = ''
  const origin: number[] = []
  let position = 0
  for (const char of text) {
    const piece = foldChar(char)
    folded += piece
    // One entry per code unit, as indexOf counts them (an emoji takes two).
    for (let unit = 0; unit < piece.length; unit++) origin.push(position)
    position += char.length
  }
  origin.push(position)
  return { folded, origin }
}

export const foldQuery = (query: string) => fold(query.trim()).folded

/** Where the query appears in the text, as [start, end) positions of the original text. */
export function findMatches(text: string, query: string): [number, number][] {
  const needle = foldQuery(query)
  if (!needle) return []
  const { folded, origin } = fold(text)
  const matches: [number, number][] = []
  for (let at = folded.indexOf(needle); at !== -1; at = folded.indexOf(needle, at + needle.length)) {
    matches.push([origin[at], origin[at + needle.length]])
  }
  return matches
}

/** The searchable text of each entry, folded once per chat. */
export function searchIndex(entries: Entry[]): string[] {
  return entries.map((entry) => {
    if (entry.kind === 'notice') return fold(entry.text).folded
    const parts = [entry.text, entry.attachment?.displayName ?? entry.attachment?.fileName ?? '', entry.poll?.question ?? '']
    return fold(parts.join('\n')).folded
  })
}

/** Indexes of the entries that contain the query, in chat order. */
export function search(index: string[], query: string): number[] {
  const needle = foldQuery(query)
  if (needle.length < 2) return []
  const found: number[] = []
  index.forEach((text, i) => {
    if (text.includes(needle)) found.push(i)
  })
  return found
}
