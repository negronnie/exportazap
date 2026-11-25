import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { fileFrom, looseFiles, syntheticExport, zippedExport } from '../test/fixtures.ts'
import { fingerprint } from './fingerprint.ts'
import { guessSelf, partnerFromName } from './guessSelf.ts'
import { importExport } from './importExport.ts'
import { readSource, SourceError } from './readSource.ts'

describe('readSource', () => {
  it('reads the chat text and the attachments from the zip', async () => {
    const { name, folder } = syntheticExport('ios-ptbr-grupo')
    const source = await readSource([await zippedExport(folder, name)])
    expect(source.name).toBe('WhatsApp Chat - Corrida de domingo')
    expect(source.text).toMatch(/^\[02\/11\/2023, 18:00:00\]/)
    expect([...source.files.keys()].sort()).toEqual([
      '00000003-PHOTO-2023-11-02-18-01-30.jpg',
      '00000005-STICKER-2023-11-02-18-02-20.webp',
      '00000007-AUDIO-2023-11-02-18-03-00.opus',
      '00000009-VIDEO-2023-11-05-07-05-00.mp4',
      '00000011-Percurso.pdf',
    ])
    const photo = await source.files.get('00000003-PHOTO-2023-11-02-18-01-30.jpg')!.read()
    expect(await photo.text()).toBe('placeholder for 00000003-PHOTO-2023-11-02-18-01-30.jpg\n')
    await source.close()
  })

  it('finds the Android chat text by the zip name', async () => {
    const { name, folder } = syntheticExport('android-ptbr-individual')
    const source = await readSource([await zippedExport(folder, name)])
    expect(source.text).toMatch(/^14\/10\/2023 09:00 - /)
    expect(source.files.has('Conversa do WhatsApp com Ana Souza.txt')).toBe(false)
    expect(source.files.size).toBe(5)
  })

  it('reads the .txt alone', async () => {
    const { folder } = syntheticExport('android-ptbr-sem-midia')
    const source = await readSource(looseFiles(folder))
    expect(source.name).toBe('Conversa do WhatsApp com Bruno Lima')
    expect(source.files.size).toBe(0)
  })

  it('reads the .txt with the attachment files picked alongside, a zip among them included', async () => {
    const { folder } = syntheticExport('ios-es-individual')
    const nested = new File(['zip sent in the chat'], 'fotos.zip')
    const source = await readSource([...looseFiles(folder), nested])
    expect(source.text).toMatch(/Diego/)
    expect([...source.files.keys()].sort()).toEqual(['00000002-PHOTO-2024-05-20-10-02-40.jpg', 'fotos.zip'])
  })

  it('refuses what is not one export', async () => {
    await expect(readSource([])).rejects.toMatchObject({ code: 'empty' })
    await expect(readSource([new File(['a'], 'a.zip'), new File(['b'], 'b.zip')])).rejects.toMatchObject({ code: 'several-zips' })
    await expect(readSource([new File(['a'], 'foto.jpg')])).rejects.toBeInstanceOf(SourceError)
    await expect(readSource([new File(['a'], 'a.txt'), new File(['b'], 'b.txt')])).rejects.toMatchObject({ code: 'several-chat-texts' })
  })
})

describe('fingerprint', () => {
  it('is the SHA-256 of the file as received', async () => {
    const bytes = new Uint8Array(3 * 1024 * 1024).map((_, i) => i % 251)
    const expected = createHash('sha256').update(bytes).digest('hex')
    expect(await fingerprint(new Blob([bytes]))).toBe(expected)
  })
})

describe('guessSelf', () => {
  it.each([
    ['Conversa do WhatsApp com Ana Souza', 'Ana Souza'],
    ['WhatsApp Chat with Carol', 'Carol'],
    ['Chat de WhatsApp con Diego', 'Diego'],
    ['WhatsApp Chat - Diego (1)', 'Diego'],
    ['Corrida de domingo', null],
  ])('%s names %s', (exportName, partner) => {
    expect(partnerFromName(exportName)).toBe(partner)
  })

  it('picks the participant the file name does not name', () => {
    expect(guessSelf('WhatsApp Chat - Diego', ['Diego', 'Lucas'])).toBe('Lucas')
    expect(guessSelf('Carol', ['Lucas', 'Carol'])).toBe('Lucas')
  })

  it('does not guess in groups or when the name matches nobody', () => {
    expect(guessSelf('WhatsApp Chat - Corrida de domingo', ['Bia', 'Caio Mendes', 'Lucas'])).toBeNull()
    expect(guessSelf('WhatsApp Chat - Zé', ['Ana', 'Bia'])).toBeNull()
  })

  it('takes "Você" from WhatsApp Web exports, groups included', () => {
    expect(guessSelf('Corrida de domingo', ['Bia', 'Caio Mendes', 'Você'])).toBe('Você')
  })
})

describe('importExport', () => {
  it.each([
    ['android-ptbr-individual', 'Lucas', 1],
    ['ios-ptbr-grupo', null, 1],
    ['android-ptbr-sem-midia', 'Lucas', 2],
    ['android-en-individual', 'Lucas', 1],
    ['ios-es-individual', 'Lucas', 1],
    ['web-ptbr-grupo', 'Você', 6],
  ])('%s: guesses %s and counts %i missing attachments', async (caseName, self, missing) => {
    const { name, folder } = syntheticExport(caseName)
    const zip = await zippedExport(folder, name)
    const imported = await importExport([zip])
    expect(imported.self).toBe(self)
    expect(imported.missing).toHaveLength(missing)
    const expected = createHash('sha256').update(new Uint8Array(await zip.arrayBuffer())).digest('hex')
    expect(await imported.fingerprint).toBe(expected)
  })

  it('counts an attachment as missing when its file was not picked', async () => {
    const { folder } = syntheticExport('android-ptbr-individual')
    const onlyText = looseFiles(folder).filter((file) => file.name.endsWith('.txt'))
    const imported = await importExport(onlyText)
    expect(imported.missing).toHaveLength(6)
  })

  it('reads a file picked from disk', async () => {
    const { folder } = syntheticExport('android-ptbr-sem-midia')
    const file = fileFrom(`${folder}/Conversa do WhatsApp com Bruno Lima.txt`, 'Conversa do WhatsApp com Bruno Lima.txt')
    expect((await importExport([file])).parsed.participants).toEqual(['Bruno Lima', 'Lucas'])
  })
})
