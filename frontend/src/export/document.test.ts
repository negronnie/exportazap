import { describe, expect, it } from 'vitest'
import { importExport } from '../import/importExport.ts'
import { syntheticExport, zippedExport } from '../test/fixtures.ts'
import { buildExport, type ExportInput } from './document.ts'

async function input(overrides: Partial<ExportInput> = {}): Promise<ExportInput> {
  const { name, folder } = syntheticExport('android-ptbr-individual')
  const imported = await importExport([await zippedExport(folder, name)])
  return {
    imported,
    self: 'Lucas',
    range: { start: 0, end: imported.parsed.entries.length - 1 },
    hidden: [],
    settings: { aliases: {}, maskNumbers: false },
    fingerprint: 'abc',
    theme: 'light',
    generatedAt: new Date(2024, 0, 1),
    ...overrides,
  }
}

describe('buildExport', () => {
  it('keeps only the range and counts its messages', async () => {
    const document = buildExport(await input({ range: { start: 1, end: 3 } }))
    expect(document.entries.map((entry) => entry.index)).toEqual([1, 2, 3])
    expect(document).toMatchObject({ first: '2023-10-14T09:01:00', last: '2023-10-14T09:05:00', messageCount: 3 })
  })

  it('turns hidden messages into placeholders without their content', async () => {
    const document = buildExport(await input({ hidden: [1, 9], range: { start: 0, end: 4 } }))
    expect(document.entries[1]).toEqual({ kind: 'hidden', index: 1, at: '2023-10-14T09:01:00', author: 'Ana Souza', outgoing: false })
    // Only the hidden messages inside the range count on the cover page.
    expect(document.redaction.hidden).toBe(1)
  })

  it('applies aliases everywhere and never lists the original names', async () => {
    const document = buildExport(await input({ settings: { aliases: { 'Ana Souza': 'Aninha' }, maskNumbers: false } }))
    // sourceFile is the one place the real name stays, to read the file; it is never shown.
    const serialized = JSON.stringify(document, (key, value) => (key === 'sourceFile' ? undefined : value))
    expect(serialized).not.toContain('Ana Souza')
    expect(document.title).toBe('Aninha')
    expect(document.sourceName).toBe('Conversa do WhatsApp com Aninha')
    expect(document.redaction).toEqual({ aliases: 1, maskNumbers: false, hidden: 0 })
  })

  it('keeps the real file name only to read the file, and labels it redacted', async () => {
    const document = buildExport(await input({ settings: { aliases: { 'Ana Souza': 'Aninha' }, maskNumbers: false } }))
    const contact = document.entries.find((entry) => entry.kind === 'message' && entry.attachment?.kind === 'contact')
    expect(contact).toMatchObject({ attachment: { label: 'Aninha.vcf', sourceFile: 'Ana Souza.vcf', present: true } })
  })

  it('marks your messages as outgoing and missing files as not present', async () => {
    const document = buildExport(await input())
    const missing = document.entries.find((entry) => entry.kind === 'message' && entry.attachment?.kind === 'unknown')
    expect(missing).toMatchObject({ outgoing: true, attachment: { present: false, sourceFile: null } })
  })
})
