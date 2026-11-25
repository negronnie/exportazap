import type { ReactNode } from 'react'
import type { EmojiMap } from '../../chat/emoji/emoji.tsx'
import type { ExportDocument } from '../document.ts'
import type { StaticMedia } from '../staticMedia.ts'
import { StaticBubble, StaticDateChip } from './StaticChat.tsx'

/** The rows of the range, one by one: a date chip (keyed `d<day>`) whenever the day changes, then each entry. */
export function staticRows(doc: ExportDocument, media: Map<number, StaticMedia>, emoji: EmojiMap | null): ReactNode[] {
  const rows: ReactNode[] = []
  let day = ''
  for (const entry of doc.entries) {
    if (entry.at.slice(0, 10) !== day) {
      day = entry.at.slice(0, 10)
      rows.push(<StaticDateChip key={`d${day}`} at={entry.at} />)
    }
    rows.push(<StaticBubble key={entry.index} entry={entry} media={media.get(entry.index)} isGroup={doc.isGroup} emoji={emoji} />)
  }
  return rows
}
