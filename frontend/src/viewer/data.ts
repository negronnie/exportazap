// What the HTML package carries inside its index.html (ADR 0004): the export document and where each
// attachment and emoji image sits in the package, all as relative paths so the page opens from disk.

import type { ExportDocument } from '../export/document.ts'

export const DATA_ELEMENT_ID = 'exportazap-data'

/** The export document as JSON: the generation date travels as an ISO string. */
export type PackagedDocument = Omit<ExportDocument, 'generatedAt'> & { generatedAt: string }

export interface ViewerData {
  document: PackagedDocument
  /** Relative path of each attachment that came with the export, by entry index: `media/foto.jpg`. */
  media: Record<number, string>
  /** Emoji used in the range → image name in the `emoji/` folder (ADR 0006). */
  emoji: Record<string, string>
}

/** The JSON goes in a script element; `</script` inside a message must not close it early. */
export function serializeViewerData(data: ViewerData): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function readViewerData(): ViewerData {
  const element = document.getElementById(DATA_ELEMENT_ID)
  if (!element?.textContent) throw new Error('ExportaZap: no data in this page')
  return JSON.parse(element.textContent) as ViewerData
}
