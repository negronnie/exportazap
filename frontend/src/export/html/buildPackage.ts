// The HTML package (ADR 0004): a .zip with a folder holding index.html (the single-file viewer with
// the range inside), the attachments of the range in media/ and the emoji images it uses in emoji/.

import { BlobReader, BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js'
import { emojiIn, type EmojiMap } from '../../chat/emoji/emoji.tsx'
import { makeRedactor, type RedactionSettings } from '../../chat/redaction.ts'
import { parseVCard } from '../../chat/vcard.ts'
import type { SourceExport } from '../../import/readSource.ts'
import { DATA_ELEMENT_ID, serializeViewerData, type ViewerData } from '../../viewer/data.ts'
import type { ExportDocument } from '../document.ts'

export interface PackageInput {
  document: ExportDocument
  source: SourceExport
  settings: RedactionSettings
  /** The built viewer page, with its `<!-- exportazap-data -->` slot. */
  template: string
  emojiMap: EmojiMap
  emojiImage(name: string): Promise<Blob>
  /** The folder inside the zip, so unzipping does not scatter files. */
  folder: string
  progress?(done: number, total: number): void
}

/** Formats that are compressed already: zipping them again only costs time. */
const STORED = /\.(jpe?g|png|webp|gif|mp4|mov|3gp|webm|opus|ogg|mp3|m4a|aac|zip|pdf)$/i

/** A file name every system accepts: no path separators, reserved characters or control characters. */
const safeName = (name: string) =>
  [...name]
    .filter((char) => char.charCodeAt(0) >= 32)
    .join('')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .trim() || 'anexo'

export async function buildPackage(input: PackageInput): Promise<Blob> {
  const { document: doc, source, settings, template, emojiMap, emojiImage, folder, progress } = input
  const redactor = makeRedactor(settings)
  const redacting = settings.maskNumbers || Object.keys(settings.aliases).length > 0
  const files: { path: string; read(): Promise<Blob> }[] = []
  const media: Record<number, string> = {}
  const used = new Set<string>()

  for (const entry of doc.entries) {
    if (entry.kind !== 'message' || !entry.attachment?.present || !entry.attachment.sourceFile) continue
    const file = source.files.get(entry.attachment.sourceFile)
    if (!file) continue
    // The visible name is the redacted label: the original name may carry a name or a number.
    let name = safeName(entry.attachment.label ?? entry.attachment.sourceFile)
    if (used.has(name.toLowerCase())) name = `${entry.index}-${name}`
    used.add(name.toLowerCase())
    const path = `media/${name}`
    media[entry.index] = path
    if (entry.attachment.kind === 'contact' && redacting) {
      // A contact card holds names and numbers too: it goes out rewritten with the redaction. A card
      // without a name takes the (already redacted) name of its file.
      const fallback = (entry.attachment.label ?? '').replace(/\.vcf$/i, '')
      files.push({
        path,
        read: async () => {
          const card = parseVCard(await (await file.read()).text())
          const fullName = card.name ? redactor.text(card.name) : fallback
          const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${fullName}`, ...card.phones.map((phone) => `TEL:${redactor.text(phone)}`), 'END:VCARD']
          return new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/vcard' })
        },
      })
    } else {
      files.push({ path, read: () => file.read() })
    }
  }

  const texts = doc.entries.flatMap((entry) => {
    if (entry.kind === 'notice') return [entry.text]
    if (entry.kind === 'hidden') return [entry.author]
    return [entry.author, entry.text, entry.poll?.question ?? '', ...(entry.poll?.options.map((option) => option.text) ?? [])]
  })
  const emoji: Record<string, string> = {}
  for (const found of emojiIn(texts.join('\n'), emojiMap)) emoji[found] = emojiMap[found]
  for (const image of new Set(Object.values(emoji))) files.push({ path: `emoji/${image}.png`, read: () => emojiImage(image) })

  // The real file names stay out of the page: the viewer reads the files by their path in media/.
  const entries = doc.entries.map((entry) =>
    entry.kind === 'message' && entry.attachment ? { ...entry, attachment: { ...entry.attachment, sourceFile: null } } : entry,
  )
  const data: ViewerData = { document: { ...doc, entries, generatedAt: doc.generatedAt.toISOString() }, media, emoji }
  const slot = '<!-- exportazap-data -->'
  if (!template.includes(slot)) throw new Error('ExportaZap: the viewer page has no data slot')
  const html = template.replace(slot, `<script type="application/json" id="${DATA_ELEMENT_ID}">${serializeViewerData(data)}</script>`)

  const writer = new ZipWriter(new BlobWriter('application/zip'))
  await writer.add(`${folder}/index.html`, new TextReader(html))
  // One file at a time, so only one attachment is decompressed in memory at once.
  for (const [done, file] of files.entries()) {
    progress?.(done, files.length)
    await writer.add(`${folder}/${file.path}`, new BlobReader(await file.read()), STORED.test(file.path) ? { level: 0 } : {})
  }
  return writer.close()
}
