// Numbers for the contact and group info screen, and the gallery of media, links and documents.

import type { Entry, LocalDateTime, Message } from './model.ts'
import { isVisualMedia } from './media.ts'

export interface ActivityStats {
  messages: number
  attachments: number
  first?: LocalDateTime
  last?: LocalDateTime
  /** Messages per hour of the day, 0 to 23. */
  hours: number[]
}

const emptyStats = (): ActivityStats => ({ messages: 0, attachments: 0, hours: Array.from({ length: 24 }, () => 0) })

function add(stats: ActivityStats, message: Message) {
  stats.messages++
  if (message.attachment) stats.attachments++
  stats.first ??= message.at
  stats.last = message.at
  stats.hours[Number(message.at.slice(11, 13))]++
}

export function chatStats(entries: Entry[]): { all: ActivityStats; byAuthor: Map<string, ActivityStats> } {
  const all = emptyStats()
  const byAuthor = new Map<string, ActivityStats>()
  for (const entry of entries) {
    if (entry.kind !== 'message') continue
    add(all, entry)
    let author = byAuthor.get(entry.author)
    if (!author) byAuthor.set(entry.author, (author = emptyStats()))
    add(author, entry)
  }
  return { all, byAuthor }
}

const URL_PATTERN = /https?:\/\/[^\s<>]+[^\s<>.,;:!?)\]'"]/g

export interface Gallery {
  media: Message[]
  links: { message: Message; url: string }[]
  documents: Message[]
}

/** Media, links and documents, newest first as in WhatsApp; only media whose file came with the export. */
export function gallery(entries: Entry[], hasFile: (fileName: string) => boolean): Gallery {
  const result: Gallery = { media: [], links: [], documents: [] }
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i]
    if (entry.kind !== 'message') continue
    const attachment = entry.attachment
    if (attachment?.fileName && hasFile(attachment.fileName)) {
      if (isVisualMedia(attachment.kind)) result.media.push(entry)
      else if (attachment.kind === 'document') result.documents.push(entry)
    }
    for (const url of entry.text.match(URL_PATTERN) ?? []) result.links.push({ message: entry, url })
  }
  return result
}
