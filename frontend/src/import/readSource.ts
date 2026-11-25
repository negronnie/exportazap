// Turns what the person picked (a .zip, a .txt, or a .txt with the attachment files) into the
// text of the chat plus the attachment files, without reading the whole zip into memory.

import { BlobReader, BlobWriter, TextWriter, ZipReader } from '@zip.js/zip.js'
import { partnerFromName } from './guessSelf.ts'

export interface SourceFile {
  name: string
  size: number
  /** Reads the file only when asked: a zip entry is decompressed on demand. */
  read(): Promise<Blob>
}

export interface SourceExport {
  /** Name of the file received, without the extension: `Conversa do WhatsApp com Ana`. */
  name: string
  /** The file that identifies the export in the fingerprint: the .zip, or the .txt without a zip. */
  original: Blob
  text: string
  /** Attachment files by file name, as the chat text cites them. */
  files: Map<string, SourceFile>
  close(): Promise<void>
}

export type SourceErrorCode = 'empty' | 'several-zips' | 'no-chat-text' | 'several-chat-texts'

export class SourceError extends Error {
  readonly code: SourceErrorCode

  constructor(code: SourceErrorCode) {
    super(code)
    this.code = code
  }
}

const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1)
const withoutExtension = (name: string) => name.replace(/\.[^.]+$/, '')
const isText = (name: string) => name.toLowerCase().endsWith('.txt')

/** Which .txt holds the chat when there is more than one (attachments can be .txt files too). */
function pickChatText<T>(candidates: T[], nameOf: (item: T) => string, exportName: string | null): T {
  if (candidates.length === 0) throw new SourceError('no-chat-text')
  if (candidates.length === 1) return candidates[0]
  const preferred = [
    (name: string) => name === '_chat.txt',
    (name: string) => withoutExtension(name) === exportName,
    (name: string) => name === 'chat.txt',
    // Android names the .txt like the zip: `Conversa do WhatsApp com Ana.txt`.
    (name: string) => partnerFromName(withoutExtension(name)) !== null,
  ]
  for (const matches of preferred) {
    const found = candidates.filter((item) => matches(baseName(nameOf(item))))
    if (found.length === 1) return found[0]
  }
  throw new SourceError('several-chat-texts')
}

async function readZip(zip: File): Promise<SourceExport> {
  const name = withoutExtension(zip.name)
  const reader = new ZipReader(new BlobReader(zip))
  const entries = (await reader.getEntries()).filter((entry) => !entry.directory)
  // The chat text sits at the root of the zip; a .txt inside a folder is an attachment.
  const texts = entries.filter((entry) => !entry.filename.includes('/') && isText(entry.filename))
  const chat = pickChatText(texts, (entry) => entry.filename, name)
  if (chat.directory) throw new SourceError('no-chat-text')
  const text = await chat.getData(new TextWriter())

  const files = new Map<string, SourceFile>()
  for (const entry of entries) {
    if (entry === chat || entry.directory) continue
    files.set(baseName(entry.filename), {
      name: baseName(entry.filename),
      size: entry.uncompressedSize,
      read: () => entry.getData(new BlobWriter()),
    })
  }
  return { name, original: zip, text, files, close: () => reader.close() }
}

async function readLooseFiles(picked: File[]): Promise<SourceExport> {
  const texts = picked.filter((file) => isText(file.name))
  const chat = pickChatText(texts, (file) => file.name, null)
  const files = new Map<string, SourceFile>()
  for (const file of picked) {
    if (file === chat) continue
    files.set(file.name, { name: file.name, size: file.size, read: async () => file })
  }
  return {
    name: withoutExtension(chat.name),
    original: chat,
    text: await chat.text(),
    files,
    close: async () => {},
  }
}

export async function readSource(picked: File[]): Promise<SourceExport> {
  if (picked.length === 0) throw new SourceError('empty')
  const zips = picked.filter((file) => file.name.toLowerCase().endsWith('.zip'))
  const texts = picked.filter((file) => isText(file.name))
  // A zip among loose files is an attachment (someone sent a .zip in the chat), not the export.
  if (texts.length === 0) {
    if (zips.length > 1) throw new SourceError('several-zips')
    if (zips.length === 1) return readZip(zips[0])
  }
  return readLooseFiles(picked)
}
