import type { ReactNode } from 'react'
import { withEmoji, type EmojiMap } from '../chat/emoji/emoji.tsx'
import { findMatches } from '../chat/search.ts'

/** Text with the search matches marked and the emoji drawn from the package folder. */
export function packagedText(text: string, query: string, emoji: EmojiMap, key: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  for (const [start, end] of query ? findMatches(text, query) : []) {
    nodes.push(...withEmoji(text.slice(last, start), emoji, `${key}-${last}`, false, 'emoji/'))
    nodes.push(
      <mark key={`${key}-m${start}`} className="rounded-sm bg-[#ffd279] text-[#111b21]">
        {withEmoji(text.slice(start, end), emoji, `${key}-${start}`, false, 'emoji/')}
      </mark>,
    )
    last = end
  }
  nodes.push(...withEmoji(text.slice(last), emoji, `${key}-${last}`, false, 'emoji/'))
  return nodes
}
