// Builds the PDF off the page thread, so a long range does not freeze the screen (ADR 0002).

import './workerGlobals.ts'
import { Font, pdf } from '@react-pdf/renderer'
import emojiMap from '../../chat/emoji/map.json'
import type { ExportDocument } from '../document.ts'
import type { StaticMedia } from '../staticMedia.ts'
import { PdfDocument } from './PdfDocument.tsx'

export interface PdfRequest {
  document: ExportDocument
  media: [number, StaticMedia][]
  /** The site origin: the worker fetches the Noto Emoji images from it (ADR 0006). */
  origin: string
}

export type PdfResponse = { ok: true; blob: Blob } | { ok: false; message: string }

const images = emojiMap as Record<string, string>

self.onmessage = async (event: MessageEvent<PdfRequest>) => {
  const { document, media, origin } = event.data
  Font.registerEmojiSource({
    withVariationSelectors: true,
    // react-pdf hands the code points as `1f44d-1f3fd`; the table knows the image of each emoji.
    builder: (code) => {
      const emoji = String.fromCodePoint(...code.split('-').map((hex) => parseInt(hex, 16)))
      const image = images[emoji] ?? images[emoji.replace(/️/g, '')] ?? code
      return `${origin}/emoji/${image}.png`
    },
  })
  try {
    const blob = await pdf(<PdfDocument document={document} media={new Map(media)} />).toBlob()
    self.postMessage({ ok: true, blob } satisfies PdfResponse)
  } catch (error) {
    self.postMessage({ ok: false, message: error instanceof Error ? error.message : String(error) } satisfies PdfResponse)
  }
}
