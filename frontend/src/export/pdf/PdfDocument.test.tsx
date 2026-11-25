import { renderToBuffer } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import { importExport } from '../../import/importExport.ts'
import { syntheticExport, zippedExport } from '../../test/fixtures.ts'
import { buildExport } from '../document.ts'
import { PdfDocument } from './PdfDocument.tsx'

async function exportDocument(theme: 'light' | 'dark') {
  const { name, folder } = syntheticExport('ios-ptbr-grupo')
  const imported = await importExport([await zippedExport(folder, name)])
  return buildExport({
    imported,
    self: 'Lucas',
    range: { start: 0, end: imported.parsed.entries.length - 1 },
    hidden: [5],
    settings: { aliases: { Bia: 'B.' }, maskNumbers: true },
    fingerprint: 'f'.repeat(64),
    theme,
    generatedAt: new Date(2024, 0, 1, 12, 0),
  })
}

describe('PdfDocument', () => {
  it.each(['light', 'dark'] as const)('renders a PDF with a cover and the chat pages (%s)', async (theme) => {
    const document = await exportDocument(theme)
    // The synthetic media are placeholders, so every attachment goes out as a card.
    const buffer = await renderToBuffer(<PdfDocument document={document} media={new Map()} />)
    const text = buffer.toString('latin1')
    expect(text.startsWith('%PDF-')).toBe(true)
    // Cover page plus at least one page of chat.
    expect((text.match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThanOrEqual(2)
  }, 30_000)
})
