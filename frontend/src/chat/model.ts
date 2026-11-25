// The chat as rebuilt from a source export. Terms follow CONTEXT.md.

/** Wall-clock time as written in the export, `YYYY-MM-DDTHH:mm:ss`. Exports carry no time zone. */
export type LocalDateTime = string

export type Platform = 'android' | 'ios'

export type Language = 'pt' | 'en' | 'es'

/** Order of the date parts in the export lines; it depends on the device region. */
export type DateOrder = 'dmy' | 'mdy' | 'ymd'

export interface ExportFormat {
  platform: Platform
  /** Detected from the fixed texts of the export; undefined when none was found. */
  language?: Language
  dateOrder: DateOrder
  hour12: boolean
  seconds: boolean
}

export type AttachmentKind = 'image' | 'video' | 'audio' | 'voice' | 'sticker' | 'gif' | 'document' | 'contact' | 'unknown'

export interface Attachment {
  kind: AttachmentKind
  /** Name of the file in the export; null when the export only says the media was omitted. */
  fileName: string | null
  /** Name shown by WhatsApp for documents, when it differs from the file name. */
  displayName?: string
  pages?: number
}

export interface Location {
  latitude: number
  longitude: number
  url: string
}

export interface PollOption {
  text: string
  votes: number
}

export interface Poll {
  question: string
  options: PollOption[]
}

export interface Message {
  kind: 'message'
  /** Position in the chat, starting at 0; shared with system notices. */
  index: number
  at: LocalDateTime
  author: string
  /** Text of the message, or the caption of the attachment, without the export markers. */
  text: string
  attachment?: Attachment
  location?: Location
  poll?: Poll
  deleted?: boolean
  edited?: boolean
}

export interface SystemNotice {
  kind: 'notice'
  index: number
  at: LocalDateTime
  text: string
}

export type Entry = Message | SystemNotice
