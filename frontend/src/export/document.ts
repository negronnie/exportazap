// What every Output is made from: the range of the chat with the redaction already applied, so the
// PDF, the screenshots and the HTML package cannot disagree, and no output sees an original name.

import { participantColor } from '../chat/colors.ts'
import type { AttachmentKind, LocalDateTime, Location, Poll } from '../chat/model.ts'
import type { Range } from '../chat/range.ts'
import { makeRedactor, summarizeRedaction, type RedactionSettings, type RedactionSummary } from '../chat/redaction.ts'
import { summarize } from '../chat/summary.ts'
import type { ImportedChat } from '../import/importExport.ts'
import type { Theme } from '../theme.ts'

export interface ExportAttachment {
  kind: AttachmentKind
  /** Redacted, as shown under the attachment. */
  label: string | null
  /** The real file name in the export, to read the file; never shown. */
  sourceFile: string | null
  /** Whether the file came with the export. */
  present: boolean
  pages?: number
  size?: number
}

export type ExportEntry =
  | { kind: 'notice'; index: number; at: LocalDateTime; text: string }
  | { kind: 'hidden'; index: number; at: LocalDateTime; author: string; outgoing: boolean }
  | {
      kind: 'message'
      index: number
      at: LocalDateTime
      author: string
      outgoing: boolean
      /** Set in groups, for the name above incoming bubbles. */
      authorColor?: string
      text: string
      deleted: boolean
      edited: boolean
      attachment?: ExportAttachment
      location?: Location
      poll?: Poll
    }

export interface ExportDocument {
  title: string
  isGroup: boolean
  participants: { name: string; color: string; self: boolean }[]
  entries: ExportEntry[]
  first: LocalDateTime
  last: LocalDateTime
  messageCount: number
  redaction: RedactionSummary
  /** Name of the source export, redacted (it often carries the contact name). */
  sourceName: string
  fingerprint: string
  generatedAt: Date
  theme: Theme
}

export interface ExportInput {
  imported: ImportedChat
  self: string | null
  range: Range
  hidden: number[]
  settings: RedactionSettings
  fingerprint: string
  theme: Theme
  generatedAt: Date
}

export function buildExport({ imported, self, range, hidden, settings, fingerprint, theme, generatedAt }: ExportInput): ExportDocument {
  const redactor = makeRedactor(settings)
  const { parsed, source } = imported
  const summary = summarize(imported)
  const hiddenSet = new Set(hidden)
  const inRange = parsed.entries.slice(range.start, range.end + 1)
  const partner = summary.isGroup ? null : parsed.participants.find((participant) => participant !== self)

  const entries: ExportEntry[] = inRange.map((entry): ExportEntry => {
    if (entry.kind === 'notice') return { kind: 'notice', index: entry.index, at: entry.at, text: redactor.text(entry.text) }
    const outgoing = entry.author === self
    const author = redactor.name(entry.author)
    if (hiddenSet.has(entry.index)) return { kind: 'hidden', index: entry.index, at: entry.at, author, outgoing }
    const attachment = entry.attachment
    const label = attachment ? (attachment.displayName ?? attachment.fileName) : null
    return {
      kind: 'message',
      index: entry.index,
      at: entry.at,
      author,
      outgoing,
      authorColor: summary.isGroup && !outgoing ? participantColor(parsed.participants, entry.author) : undefined,
      text: redactor.text(entry.text),
      deleted: entry.deleted === true,
      edited: entry.edited === true,
      attachment: attachment && {
        kind: attachment.kind,
        label: label && redactor.text(label),
        sourceFile: attachment.fileName,
        present: attachment.fileName !== null && source.files.has(attachment.fileName),
        pages: attachment.pages,
        size: attachment.fileName ? source.files.get(attachment.fileName)?.size : undefined,
      },
      location: entry.location,
      poll: entry.poll && {
        question: redactor.text(entry.poll.question),
        options: entry.poll.options.map((option) => ({ ...option, text: redactor.text(option.text) })),
      },
    }
  })

  return {
    title: partner ? redactor.name(partner) : redactor.text(summary.title),
    isGroup: summary.isGroup,
    participants: parsed.participants.map((participant) => ({
      name: redactor.name(participant),
      color: participantColor(parsed.participants, participant),
      self: participant === self,
    })),
    entries,
    first: inRange[0]?.at ?? '',
    last: inRange[inRange.length - 1]?.at ?? '',
    messageCount: inRange.filter((entry) => entry.kind === 'message').length,
    redaction: summarizeRedaction(settings, hidden.filter((index) => index >= range.start && index <= range.end)),
    sourceName: redactor.text(source.name),
    fingerprint,
    generatedAt,
    theme,
  }
}
