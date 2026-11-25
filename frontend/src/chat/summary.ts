import type { ImportedChat } from '../import/importExport.ts'
import { partnerFromName } from '../import/guessSelf.ts'
import type { LocalDateTime } from './model.ts'

export interface ChatSummary {
  /** The contact or group name, as the export file names it. */
  title: string
  isGroup: boolean
  first?: LocalDateTime
  last?: LocalDateTime
  messages: number
  attachments: number
  missing: number
}

export function summarize({ source, parsed, missing }: ImportedChat): ChatSummary {
  const messages = parsed.entries.filter((entry) => entry.kind === 'message')
  return {
    title: partnerFromName(source.name) ?? source.name,
    isGroup: parsed.participants.length > 2,
    first: parsed.entries[0]?.at,
    last: parsed.entries[parsed.entries.length - 1]?.at,
    messages: messages.length,
    attachments: messages.filter((message) => message.attachment).length,
    missing: missing.length,
  }
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })
const timeFormat = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' })

/** `2023-10-14T09:03:00` → `14 de outubro de 2023`. The time is read as local, as the export wrote it. */
export const formatDate = (at: LocalDateTime) => dateFormat.format(new Date(at))
export const formatTime = (at: LocalDateTime) => timeFormat.format(new Date(at))
