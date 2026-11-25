// Reads the .txt of a WhatsApp source export into chat entries. See "Export Format" in CONTEXT.md:
// the line layout depends on the platform (Android or iOS) and on the device language and region.

import type {
  Attachment,
  AttachmentKind,
  DateOrder,
  Entry,
  ExportFormat,
  Language,
  LocalDateTime,
  Message,
  Platform,
  Poll,
} from '../chat/model.ts'
import { ANDROID_ATTACHED, DELETED, IOS_ATTACHED, NOTICE_WORDS, OMITTED, OMITTED_KIND, POLL, POLL_OPTION } from './markers.ts'

export interface ParsedExport {
  format: ExportFormat
  /**
   * True when nothing in the export tells the day from the month (every day is 12 or less):
   * `format.dateOrder` is then only a guess, and the person importing must confirm it.
   */
  dateOrderAmbiguous: boolean
  entries: Entry[]
  participants: string[]
}

export interface ParseOptions {
  /** Date order confirmed by the person importing; skips the detection. */
  dateOrder?: DateOrder
}

const LRM = '‎'
/** Direction marks and isolates that WhatsApp sprinkles around names and markers. */
const INVISIBLE = /[‎‏‪-‮⁦-⁩]/g

const DATE = String.raw`(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})`
const TIME = String.raw`(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?(?:[\s  ]?([AaPp])\.?\s?[Mm]\.?)?`
const HEADERS: Record<Platform, RegExp> = {
  // [15/10/2023, 14:22:33] Ana: …
  ios: new RegExp(String.raw`^‎?\[${DATE},?\s${TIME}\]\s`),
  // 15/10/2023 14:22 - Ana: …
  android: new RegExp(String.raw`^‎?${DATE},?\s${TIME}\s[-–]\s`),
}

interface Header {
  parts: [number, number, number]
  yearFirst: boolean
  hour: number
  minute: number
  second?: number
  meridiem?: 'a' | 'p'
  length: number
}

function readHeader(line: string, re: RegExp): Header | null {
  const m = line.match(re)
  if (!m) return null
  return {
    parts: [Number(m[1]), Number(m[2]), Number(m[3])],
    yearFirst: m[1].length === 4,
    hour: Number(m[4]),
    minute: Number(m[5]),
    second: m[6] === undefined ? undefined : Number(m[6]),
    meridiem: m[7] === undefined ? undefined : (m[7].toLowerCase() as 'a' | 'p'),
    length: m[0].length,
  }
}

const pad = (n: number, size = 2) => String(n).padStart(size, '0')

function stamp(h: Header, order: DateOrder): LocalDateTime | null {
  const [a, b, c] = h.parts
  let [year, month, day] = order === 'ymd' ? [a, b, c] : order === 'dmy' ? [c, b, a] : [c, a, b]
  if (year < 100) year += 2000
  let hour = h.hour
  if (h.meridiem) {
    if (hour < 1 || hour > 12) return null
    hour = (hour % 12) + (h.meridiem === 'p' ? 12 : 0)
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) return null
  if (hour > 23 || h.minute > 59 || (h.second ?? 0) > 59) return null
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(h.minute)}:${pad(h.second ?? 0)}`
}

function countBackwards(headers: Header[], order: DateOrder): number {
  let count = 0
  let previous = ''
  for (const h of headers) {
    const at = stamp(h, order)
    if (at === null) return Number.POSITIVE_INFINITY
    if (at < previous) count++
    previous = at
  }
  return count
}

function detectDateOrder(headers: Header[], language?: Language): { order: DateOrder; ambiguous: boolean } {
  if (headers.some((h) => h.yearFirst)) return { order: 'ymd', ambiguous: false }
  const dayFirst = headers.some((h) => h.parts[0] > 12)
  const monthFirst = headers.some((h) => h.parts[1] > 12)
  if (dayFirst !== monthFirst) return { order: dayFirst ? 'dmy' : 'mdy', ambiguous: false }
  // No part ever passes 12: the order in which time keeps moving forward is the right one.
  const dmy = countBackwards(headers, 'dmy')
  const mdy = countBackwards(headers, 'mdy')
  if (dmy !== mdy) return { order: dmy < mdy ? 'dmy' : 'mdy', ambiguous: false }
  return { order: language === 'en' ? 'mdy' : 'dmy', ambiguous: true }
}

class LanguageVotes {
  private votes = new Map<Language, number>()
  add(language: Language | null | undefined) {
    if (language) this.votes.set(language, (this.votes.get(language) ?? 0) + 1)
  }
  winner(): Language | undefined {
    let best: Language | undefined
    let bestCount = 0
    for (const [language, count] of this.votes) {
      if (count > bestCount) [best, bestCount] = [language, count]
    }
    return best
  }
}

/** What kind of attachment a file is, from the names WhatsApp gives to the files it exports. */
export function attachmentKind(fileName: string): AttachmentKind {
  const name = fileName.toUpperCase()
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : ''
  // Android: IMG-20231015-WA0012.jpg
  const android = name.match(/^(IMG|VID|AUD|PTT|STK|DOC)-\d{8}-WA\d+/)
  if (android) {
    const kinds: Record<string, AttachmentKind> = {
      IMG: 'image',
      VID: 'video',
      AUD: 'audio',
      PTT: 'voice',
      STK: 'sticker',
      DOC: 'document',
    }
    return kinds[android[1]]
  }
  // iOS: 00000012-PHOTO-2023-10-15-14-22-33.jpg
  const ios = name.match(/^\d+-(PHOTO|VIDEO|AUDIO|STICKER|GIF)-\d{4}-/)
  if (ios) {
    if (ios[1] === 'AUDIO') return extension === 'OPUS' ? 'voice' : 'audio'
    const kinds: Record<string, AttachmentKind> = { PHOTO: 'image', VIDEO: 'video', STICKER: 'sticker', GIF: 'gif' }
    return kinds[ios[1]]
  }
  if (extension === 'VCF') return 'contact'
  if (['JPG', 'JPEG', 'PNG', 'HEIC', 'WEBP'].includes(extension)) return 'image'
  if (['MP4', 'MOV', '3GP', 'MKV', 'WEBM'].includes(extension)) return 'video'
  if (extension === 'OPUS') return 'voice'
  if (['MP3', 'M4A', 'AAC', 'OGG', 'WAV', 'AMR'].includes(extension)) return 'audio'
  if (extension === 'GIF') return 'gif'
  return 'document'
}

function omittedKind(words: string): AttachmentKind {
  const text = words.toLowerCase()
  return OMITTED_KIND.find(([start]) => text.startsWith(start))?.[1] ?? 'unknown'
}

/** `relatorio.pdf • 3 páginas` → name and page count, as WhatsApp describes documents. */
function documentLabel(text: string): { name: string; pages?: number } {
  const m = text.match(/^([\s\S]*?)\s*•\s*(\d+)\s+\p{L}+\s*$/u)
  return m ? { name: m[1].trim(), pages: Number(m[2]) } : { name: text.trim() }
}

/** iOS prefixes exported files with a sequence number: `00000036-relatorio.pdf`. */
const withoutIosPrefix = (fileName: string) => fileName.replace(/^\d{8}-/, '')

interface Interpreted {
  notice?: boolean
  text: string
  attachment?: Attachment
  location?: Message['location']
  poll?: Poll
  deleted?: boolean
  edited?: boolean
}

function interpret(rawBody: string, platform: Platform, votes: LanguageVotes): Interpreted {
  let body = rawBody
  const result: Interpreted = { text: '' }

  // `bom dia ‎<Mensagem editada>` (iOS) or `bom dia <Mensagem editada>` (Android).
  const edited = body.match(/\s*‎?<([^<>\n]*)>\s*$/)
  if (edited && /edit/i.test(edited[1])) {
    result.edited = true
    body = body.slice(0, edited.index)
  }

  const special = body.startsWith(LRM)
  const clean = body.replace(INVISIBLE, '').trim()
  const lower = clean.toLowerCase()

  const deleted = DELETED[lower.replace(/\.$/, '')]
  if (deleted) {
    votes.add(deleted)
    return { ...result, deleted: true }
  }

  // iOS: `legenda ‎<anexado: 00000012-PHOTO-2023-10-15-14-22-33.jpg>`
  const iosAttached = body.match(/‎?<([^<>:\n]+): ([^<>\n]+\.[^<>\n.]+)>\s*$/)
  if (iosAttached) {
    votes.add(IOS_ATTACHED[iosAttached[1].replace(INVISIBLE, '').trim().toLowerCase()])
    const fileName = iosAttached[2].trim()
    const before = body.slice(0, iosAttached.index).replace(INVISIBLE, '').trim()
    const label = documentLabel(before)
    // Documents carry their own name, and maybe the page count, where media would carry a caption.
    if (before && label.name.toLowerCase() === withoutIosPrefix(fileName).toLowerCase()) {
      const attachment: Attachment = { kind: 'document', fileName, displayName: label.name }
      if (label.pages !== undefined) attachment.pages = label.pages
      return { ...result, attachment }
    }
    return { ...result, text: before, attachment: { kind: attachmentKind(fileName), fileName } }
  }

  // Android: `IMG-20231015-WA0012.jpg (arquivo anexado)`, with the caption on the next lines.
  const [firstLine, ...otherLines] = clean.split('\n')
  const androidAttached = firstLine.match(/^(.+) \(([^()]+)\)$/)
  if (androidAttached && ANDROID_ATTACHED[androidAttached[2].toLowerCase()]) {
    votes.add(ANDROID_ATTACHED[androidAttached[2].toLowerCase()])
    const label = documentLabel(androidAttached[1])
    const attachment: Attachment = { kind: attachmentKind(label.name), fileName: label.name }
    if (label.pages !== undefined) attachment.pages = label.pages
    return { ...result, text: otherLines.join('\n').trim(), attachment }
  }

  // `<Mídia oculta>` (Android) or `<imagem ocultada> legenda` (exports made in the browser).
  const omittedTag = clean.match(/^<([\p{L} ]+) (\p{L}+)>\s*([\s\S]*)$/u)
  if (omittedTag && omittedTag[2].toLowerCase() in OMITTED) {
    votes.add(OMITTED[omittedTag[2].toLowerCase()])
    const kind = omittedKind(omittedTag[1])
    const rest = omittedTag[3].trim()
    if (kind === 'document' && rest) {
      return { ...result, attachment: { kind, fileName: null, displayName: rest } }
    }
    return { ...result, text: rest, attachment: { kind, fileName: null } }
  }

  // iOS: `‎imagem ocultada`, maybe after a caption: `olha isso ‎imagem ocultada`.
  const omittedTail = body.match(/(?:^|‎)([\p{L} ]+) (\p{L}+)\s*$/u)
  if (omittedTail && omittedTail[2].toLowerCase() in OMITTED && (special || body.includes(LRM))) {
    const kind = omittedKind(omittedTail[1].trim())
    if (kind !== 'unknown') {
      votes.add(OMITTED[omittedTail[2].toLowerCase()])
      const before = body.slice(0, omittedTail.index).replace(INVISIBLE, '').trim()
      return { ...result, text: before, attachment: { kind, fileName: null } }
    }
  }

  // `localização: https://maps.google.com/?q=-27.59,-48.54`
  const location = firstLine.match(/^[\p{L} ]+: (https:\/\/maps\.google\.com\/\?q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?))\s*$/u)
  if (location) {
    return {
      ...result,
      text: otherLines.join('\n').trim(),
      location: { url: location[1], latitude: Number(location[2]), longitude: Number(location[3]) },
    }
  }

  // ENQUETE:\nQual dia?\nOPÇÃO: Sábado (2 votos)
  const pollWord = firstLine.match(/^(\p{L}+):\s*$/u)?.[1].toLowerCase()
  if (pollWord && POLL[pollWord]) {
    votes.add(POLL[pollWord])
    const question: string[] = []
    const options: Poll['options'] = []
    for (const line of otherLines) {
      const option = line.match(/^(\p{L}+): ([\s\S]*?)\s*\((\d+)\s+\p{L}+\)\s*$/u)
      if (option && POLL_OPTION.includes(option[1].toLowerCase())) {
        options.push({ text: option[2], votes: Number(option[3]) })
      } else if (options.length === 0) {
        question.push(line)
      }
    }
    return { ...result, poll: { question: question.join('\n').trim(), options } }
  }

  // iOS writes system notices as messages from the chat itself, starting with a direction mark.
  if (platform === 'ios' && special && !result.edited) return { notice: true, text: clean }

  return { ...result, text: clean }
}

/** `Ana: oi` → author and body. Android system notices have no author. */
function splitAuthor(rest: string, platform: Platform): { author: string; body: string } | null {
  const newline = rest.indexOf('\n')
  const firstLine = newline === -1 ? rest : rest.slice(0, newline)
  let author: string
  let body: string
  const separator = firstLine.indexOf(': ')
  if (separator > 0) {
    author = firstLine.slice(0, separator)
    body = rest.slice(separator + 2)
  } else if (firstLine.endsWith(':') && firstLine.length > 1) {
    // `Ana:` with nothing after it, as iOS writes some removed messages.
    author = firstLine.slice(0, -1)
    body = newline === -1 ? '' : rest.slice(newline + 1)
  } else {
    return null
  }
  author = author.replace(INVISIBLE, '').trim()
  if (!author || author.length > 100) return null
  // Android notices such as `Ana mudou o nome do grupo para "Plano: sábado"` are not messages.
  if (platform === 'android' && /["“”]/.test(author)) return null
  return { author, body }
}

function detectPlatform(lines: string[]): Platform {
  let ios = 0
  let android = 0
  for (const line of lines) {
    if (HEADERS.ios.test(line)) ios++
    else if (HEADERS.android.test(line)) android++
  }
  return ios > android ? 'ios' : 'android'
}

export function parseExport(text: string, options: ParseOptions = {}): ParsedExport {
  const lines = text.replace(/^﻿/, '').split(/\r\n|\r|\n/)
  const platform = detectPlatform(lines)
  const re = HEADERS[platform]

  const headers = lines.map((line) => readHeader(line, re))
  const found = headers.filter((h): h is Header => h !== null)

  // The language helps only to break a date-order tie, so a first look at the notices is enough.
  const preliminary = new LanguageVotes()
  for (const line of lines.slice(0, 200)) {
    const lower = line.toLowerCase()
    for (const [words, language] of NOTICE_WORDS) if (words.test(lower)) preliminary.add(language)
  }
  const detected = options.dateOrder
    ? { order: options.dateOrder, ambiguous: false }
    : detectDateOrder(found, preliminary.winner())

  // Group the lines into raw entries: a line that starts with a valid header opens a new one.
  const raw: { at: LocalDateTime; rest: string }[] = []
  const preamble: string[] = []
  lines.forEach((line, i) => {
    const h = headers[i]
    const at = h ? stamp(h, detected.order) : null
    if (h && at) {
      raw.push({ at, rest: line.slice(h.length) })
    } else if (raw.length > 0) {
      raw[raw.length - 1].rest += '\n' + line
    } else if (line.trim()) {
      preamble.push(line)
    }
  })

  const votes = new LanguageVotes()
  const entries: Entry[] = []
  const participants: string[] = []
  const seen = new Set<string>()

  // Lines before the first timestamp (some exports open with the encryption notice).
  if (preamble.length > 0 && raw.length > 0) {
    entries.push({ kind: 'notice', index: 0, at: raw[0].at, text: preamble.join('\n').replace(INVISIBLE, '').trim() })
  }

  for (const { at, rest } of raw) {
    const index = entries.length
    const trimmed = rest.replace(/\s+$/, '')
    const split = splitAuthor(trimmed, platform)
    if (!split) {
      const notice = trimmed.replace(INVISIBLE, '').trim()
      for (const [words, language] of NOTICE_WORDS) if (words.test(notice.toLowerCase())) votes.add(language)
      entries.push({ kind: 'notice', index, at, text: notice })
      continue
    }
    const interpreted = interpret(split.body, platform, votes)
    if (interpreted.notice) {
      for (const [words, language] of NOTICE_WORDS) if (words.test(interpreted.text.toLowerCase())) votes.add(language)
      entries.push({ kind: 'notice', index, at, text: interpreted.text })
      continue
    }
    const message: Message = { kind: 'message', index, at, author: split.author, text: interpreted.text }
    if (interpreted.attachment) message.attachment = interpreted.attachment
    if (interpreted.location) message.location = interpreted.location
    if (interpreted.poll) message.poll = interpreted.poll
    if (interpreted.deleted) message.deleted = true
    if (interpreted.edited) message.edited = true
    entries.push(message)
    if (!seen.has(split.author)) {
      seen.add(split.author)
      participants.push(split.author)
    }
  }

  const language = votes.winner() ?? preliminary.winner()
  const format: ExportFormat = {
    platform,
    dateOrder: detected.order,
    hour12: found.some((h) => h.meridiem !== undefined),
    seconds: found.some((h) => h.second !== undefined),
  }
  if (language) format.language = language

  return { format, dateOrderAmbiguous: detected.ambiguous, entries, participants }
}
