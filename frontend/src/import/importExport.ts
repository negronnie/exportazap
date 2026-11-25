// Everything the import summary needs, from the files the person picked.

import type { Entry, Message } from '../chat/model.ts'
import { fingerprint } from './fingerprint.ts'
import { guessSelf } from './guessSelf.ts'
import { parseExport, type ParsedExport, type ParseOptions } from './parseExport.ts'
import { readSource, type SourceExport } from './readSource.ts'

export interface ImportedChat {
  source: SourceExport
  parsed: ParsedExport
  /** Best guess of who made the export, to be confirmed. */
  self: string | null
  /** Messages whose attachment has no file: omitted from the export or not picked (Missing Attachment). */
  missing: Message[]
  /** Computed in the background; the chat can be shown before it is ready. */
  fingerprint: Promise<string>
}

export function missingAttachments(entries: Entry[], source: SourceExport): Message[] {
  return entries.filter(
    (entry): entry is Message =>
      entry.kind === 'message' &&
      entry.attachment !== undefined &&
      (entry.attachment.fileName === null || !source.files.has(entry.attachment.fileName)),
  )
}

export async function importExport(picked: File[], options: ParseOptions = {}): Promise<ImportedChat> {
  const source = await readSource(picked)
  const parsed = parseExport(source.text, options)
  return {
    source,
    parsed,
    self: guessSelf(source.name, parsed.participants),
    missing: missingAttachments(parsed.entries, source),
    fingerprint: fingerprint(source.original),
  }
}
