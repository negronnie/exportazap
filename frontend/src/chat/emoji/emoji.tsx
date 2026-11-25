// Emoji drawn with the bundled Noto images instead of the device font (ADR 0006). The table is
// loaded apart from the main bundle; until it arrives, emoji show as plain text.

import { useEffect, useState, type ReactNode } from 'react'

export type EmojiMap = Record<string, string>

// `v` flag: \p{RGI_Emoji} matches whole sequences (skin tones, families, flags) as one emoji.
const EMOJI = new RegExp(String.raw`\p{RGI_Emoji}`, 'gv')

let loaded: EmojiMap | null = null
const loading = import('./map.json').then((module) => {
  loaded = module.default as EmojiMap
  return loaded
})

export function useEmojiMap(): EmojiMap | null {
  const [map, setMap] = useState(loaded)
  useEffect(() => {
    if (!map) void loading.then(setMap)
  }, [map])
  return map
}

export const emojiSrc = (map: EmojiMap, emoji: string): string | null =>
  map[emoji] ? `/emoji/${map[emoji]}.png` : null

/** True for text made only of one to three emoji, which WhatsApp shows larger. */
export function isEmojiOnly(text: string): boolean {
  const trimmed = text.replace(/\s/g, '')
  const found = trimmed.match(EMOJI)
  return found !== null && found.length <= 3 && found.join('') === trimmed
}

/** Splits text into plain parts and emoji images; the alt text keeps copy and paste working. */
export function withEmoji(text: string, map: EmojiMap | null, keyPrefix: string, large = false): ReactNode[] {
  if (!map) return [text]
  const nodes: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(EMOJI)) {
    const src = emojiSrc(map, match[0])
    if (!src) continue
    if (match.index > last) nodes.push(text.slice(last, match.index))
    nodes.push(
      <img
        key={`${keyPrefix}-${match.index}`}
        src={src}
        alt={match[0]}
        draggable={false}
        className={`inline-block align-[-0.2em] ${large ? 'size-8' : 'size-[1.2em]'}`}
      />,
    )
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}
