import { BlobReader, TextWriter, ZipReader } from '@zip.js/zip.js'
import { describe, expect, it } from 'vitest'
import type { EmojiMap } from '../../chat/emoji/emoji.tsx'
import realMap from '../../chat/emoji/map.json'
import { importExport } from '../../import/importExport.ts'
import { syntheticExport, zippedExport } from '../../test/fixtures.ts'
import { DATA_ELEMENT_ID, type ViewerData } from '../../viewer/data.ts'
import { buildExport } from '../document.ts'
import { buildPackage } from './buildPackage.ts'

const TEMPLATE = '<!doctype html><html><body><div id="viewer"></div><!-- exportazap-data --><script type="module">/* viewer */</script></body></html>'

async function packageFor(settings: { aliases: Record<string, string>; maskNumbers: boolean }, hidden: number[] = []) {
  const { name, folder } = syntheticExport('android-ptbr-individual')
  const imported = await importExport([await zippedExport(folder, name)])
  const document = buildExport({
    imported,
    self: 'Lucas',
    range: { start: 0, end: imported.parsed.entries.length - 1 },
    hidden,
    settings,
    fingerprint: 'f'.repeat(64),
    theme: 'dark',
    generatedAt: new Date(2024, 0, 1),
  })
  const zip = await buildPackage({
    document,
    source: imported.source,
    settings,
    template: TEMPLATE,
    emojiMap: realMap as EmojiMap,
    emojiImage: async (image) => new Blob([`png ${image}`]),
    folder: 'Ana Souza 2023-10-14',
  })
  const reader = new ZipReader(new BlobReader(zip))
  const entries = await reader.getEntries()
  const files = new Map<string, string>()
  for (const entry of entries) if (!entry.directory) files.set(entry.filename, await entry.getData(new TextWriter()))
  await reader.close()
  const html = files.get('Ana Souza 2023-10-14/index.html')!
  const json = html.match(new RegExp(`<script type="application/json" id="${DATA_ELEMENT_ID}">(.*?)</script>`, 's'))![1]
  return { files, html, data: JSON.parse(json) as ViewerData }
}

describe('buildPackage', () => {
  it('puts the page, the attachments and the emoji images in one folder', async () => {
    const { files, data } = await packageFor({ aliases: {}, maskNumbers: false })
    expect([...files.keys()].sort()).toEqual([
      'Ana Souza 2023-10-14/emoji/1f389.png',
      'Ana Souza 2023-10-14/index.html',
      'Ana Souza 2023-10-14/media/Ana Souza.vcf',
      'Ana Souza 2023-10-14/media/Cardápio.pdf',
      'Ana Souza 2023-10-14/media/IMG-20231014-WA0001.jpg',
      'Ana Souza 2023-10-14/media/PTT-20231014-WA0002.opus',
      'Ana Souza 2023-10-14/media/STK-20231014-WA0003.webp',
    ])
    expect(data.emoji).toEqual({ '🎉': '1f389' })
    expect(data.document.theme).toBe('dark')
    expect(data.document.generatedAt).toBe(new Date(2024, 0, 1).toISOString())
  })

  it('names files with the redaction and rewrites contact cards', async () => {
    const { files, data } = await packageFor({ aliases: { 'Ana Souza': 'Aninha' }, maskNumbers: true })
    expect(files.has('Ana Souza 2023-10-14/media/Aninha.vcf')).toBe(true)
    expect(files.get('Ana Souza 2023-10-14/media/Aninha.vcf')).toContain('FN:Aninha')
    expect(JSON.stringify(data)).not.toContain('Ana Souza')
  })

  it('leaves out the attachments of hidden messages', async () => {
    // Entry 3 is the photo; hidden, its file stays out of the package.
    const { files, data } = await packageFor({ aliases: {}, maskNumbers: false }, [3])
    expect(files.has('Ana Souza 2023-10-14/media/IMG-20231014-WA0001.jpg')).toBe(false)
    expect(data.media[3]).toBeUndefined()
  })

  it('keeps a message that contains a closing script tag inside the data', async () => {
    const { html } = await packageFor({ aliases: {}, maskNumbers: false })
    expect(html.match(/<\/script>/g)).toHaveLength(2)
  })
})
