import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Message, SystemNotice } from '../chat/model.ts'
import { syntheticExport } from '../test/fixtures.ts'
import { attachmentKind, parseExport } from './parseExport.ts'

function parseCase(caseName: string, chatFile: string) {
  const { folder } = syntheticExport(caseName)
  return parseExport(readFileSync(join(folder, chatFile), 'utf8'))
}

const messages = (entries: ReturnType<typeof parseExport>['entries']) =>
  entries.filter((entry): entry is Message => entry.kind === 'message')
const notices = (entries: ReturnType<typeof parseExport>['entries']) =>
  entries.filter((entry): entry is SystemNotice => entry.kind === 'notice')

describe('parseExport: Android in Portuguese', () => {
  const parsed = parseCase('android-ptbr-individual', 'Conversa do WhatsApp com Ana Souza.txt')
  const all = messages(parsed.entries)

  it('detects the format', () => {
    expect(parsed.format).toEqual({ platform: 'android', language: 'pt', dateOrder: 'dmy', hour12: false, seconds: false })
    expect(parsed.dateOrderAmbiguous).toBe(false)
  })

  it('finds the participants and the encryption notice', () => {
    expect(parsed.participants).toEqual(['Ana Souza', 'Lucas'])
    expect(notices(parsed.entries)).toHaveLength(1)
    expect(notices(parsed.entries)[0].text).toMatch(/^As mensagens e ligações/)
  })

  it('joins the lines of a message', () => {
    expect(all[1]).toMatchObject({ at: '2023-10-14T09:03:00', author: 'Lucas', text: 'Tudo certo\nLevo o bolo e as velas\ne a toalha também' })
  })

  it('reads attachments, with the caption on the next line', () => {
    expect(all[2]).toMatchObject({ text: 'Olha o lugar', attachment: { kind: 'image', fileName: 'IMG-20231014-WA0001.jpg' } })
    expect(all[3].attachment).toEqual({ kind: 'voice', fileName: 'PTT-20231014-WA0002.opus' })
    expect(all[4].attachment).toEqual({ kind: 'sticker', fileName: 'STK-20231014-WA0003.webp' })
    expect(all[5].attachment).toEqual({ kind: 'unknown', fileName: null })
    expect(all[6].attachment).toEqual({ kind: 'contact', fileName: 'Ana Souza.vcf' })
    expect(all[7].attachment).toEqual({ kind: 'document', fileName: 'Cardápio.pdf', pages: 2 })
  })

  it('reads deleted, edited, location and poll messages', () => {
    expect(all[8]).toMatchObject({ deleted: true, text: '' })
    expect(all[9]).toMatchObject({ edited: true, text: 'Chego às 10h' })
    expect(all[10].location).toEqual({ url: 'https://maps.google.com/?q=-27.5954,-48.5480', latitude: -27.5954, longitude: -48.548 })
    expect(all[11].poll).toEqual({
      question: 'Que horas começa?',
      options: [
        { text: '10h', votes: 2 },
        { text: '11h', votes: 0 },
      ],
    })
    expect(all[12]).toMatchObject({ at: '2023-10-15T21:40:00', text: 'Valeu por tudo! 🎉' })
  })
})

describe('parseExport: iOS group in Portuguese', () => {
  const parsed = parseCase('ios-ptbr-grupo', '_chat.txt')
  const all = messages(parsed.entries)

  it('detects the format', () => {
    expect(parsed.format).toEqual({ platform: 'ios', language: 'pt', dateOrder: 'dmy', hour12: false, seconds: true })
  })

  it('keeps the group itself out of the participants and turns its lines into notices', () => {
    expect(parsed.participants).toEqual(['Bia', 'Caio Mendes', 'Lucas'])
    expect(notices(parsed.entries).map((notice) => notice.text)).toEqual([
      expect.stringMatching(/^As mensagens e ligações/),
      'Bia criou o grupo “Corrida de domingo”.',
      'Bia adicionou você.',
      'Bia adicionou Caio Mendes.',
      'Caio Mendes saiu.',
    ])
  })

  it('reads attachments with the caption before the marker', () => {
    expect(all[1]).toMatchObject({ text: 'percurso', attachment: { kind: 'image', fileName: '00000003-PHOTO-2023-11-02-18-01-30.jpg' } })
    expect(all[2].text).toBe('Bora!\nLevo água pra todo mundo')
    expect(all[3].attachment?.kind).toBe('sticker')
    expect(all[4].attachment).toEqual({ kind: 'voice', fileName: '00000007-AUDIO-2023-11-02-18-03-00.opus' })
    expect(all[5]).toMatchObject({
      text: '',
      attachment: { kind: 'document', fileName: '00000011-Percurso.pdf', displayName: 'Percurso.pdf', pages: 3 },
    })
  })

  it('reads edited, deleted and omitted messages', () => {
    expect(all[6]).toMatchObject({ edited: true, text: 'chego 6h50' })
    expect(all[7]).toMatchObject({ deleted: true })
    expect(all[8]).toMatchObject({ text: 'olha o tênis', attachment: { kind: 'image', fileName: null } })
  })

  it('reads video, location and poll', () => {
    expect(all[9]).toMatchObject({ at: '2023-11-05T07:05:00', attachment: { kind: 'video' } })
    expect(all[10].location).toMatchObject({ latitude: -27.6, longitude: -48.5 })
    expect(all[11].poll).toEqual({
      question: 'Próximo domingo?',
      options: [
        { text: 'Sim', votes: 3 },
        { text: 'Não', votes: 0 },
      ],
    })
  })
})

describe('parseExport: other languages', () => {
  it('reads Android in US English, month first with AM/PM', () => {
    const parsed = parseCase('android-en-individual', 'WhatsApp Chat with Carol.txt')
    const all = messages(parsed.entries)
    expect(parsed.format).toEqual({ platform: 'android', language: 'en', dateOrder: 'mdy', hour12: true, seconds: false })
    expect(all.map((message) => message.at)).toEqual([
      '2024-03-14T09:16:00',
      '2024-03-14T09:20:00',
      '2024-03-14T09:21:00',
      '2024-03-14T12:05:00',
      '2024-03-14T12:06:00',
      '2024-03-14T12:30:00',
      '2024-03-15T20:00:00',
    ])
    expect(all[1]).toMatchObject({ text: 'Yes! Same place', attachment: { kind: 'image', fileName: 'IMG-20240314-WA0004.jpg' } })
    expect(all[2].attachment).toEqual({ kind: 'unknown', fileName: null })
    expect(all[3].deleted).toBe(true)
    expect(all[4]).toMatchObject({ edited: true, text: 'Running late' })
    expect(all[5].location?.latitude).toBe(40.7128)
    expect(all[6].poll?.options).toEqual([
      { text: 'Friday', votes: 1 },
      { text: 'Monday', votes: 1 },
    ])
  })

  it('reads iOS in Spanish with a two-digit year', () => {
    const parsed = parseCase('ios-es-individual', '_chat.txt')
    const all = messages(parsed.entries)
    expect(parsed.format).toEqual({ platform: 'ios', language: 'es', dateOrder: 'dmy', hour12: false, seconds: true })
    expect(parsed.participants).toEqual(['Diego', 'Lucas'])
    expect(all[1].attachment).toEqual({ kind: 'image', fileName: '00000002-PHOTO-2024-05-20-10-02-40.jpg' })
    expect(all[2].attachment).toEqual({ kind: 'image', fileName: null })
    expect(all[3].deleted).toBe(true)
    expect(all[4]).toMatchObject({ edited: true, text: 'sí, a las 9' })
    expect(all[5].location?.longitude).toBe(-58.3816)
    expect(all[6].poll).toEqual({ question: '¿Cena?', options: [{ text: 'Pizza', votes: 2 }] })
  })
})

describe('parseExport: WhatsApp Web', () => {
  const parsed = parseCase('web-ptbr-grupo', 'chat.txt')
  const all = messages(parsed.entries)

  it('tells the web export from iOS and reads the month first', () => {
    expect(parsed.format).toEqual({ platform: 'web', language: 'pt', dateOrder: 'mdy', hour12: true, seconds: true })
    expect(parsed.participants).toEqual(['Bia', 'Caio Mendes', 'Você'])
  })

  it('reads the notices, including the opening line without a timestamp', () => {
    expect(notices(parsed.entries).map((notice) => notice.text)).toEqual([
      expect.stringMatching(/^As mensagens e as ligações/),
      'Bia criou o grupo',
      'Bia adicionou Você',
      'Mensagem de message_history_notice',
    ])
  })

  it('skips the album line and reads the omitted media with their captions', () => {
    expect(all.map((message) => message.attachment ?? message.text)).toEqual([
      'Domingo às 7h no trapiche',
      { kind: 'image', fileName: null },
      { kind: 'image', fileName: null },
      { kind: 'sticker', fileName: null },
      { kind: 'voice', fileName: null },
      { kind: 'document', fileName: null, displayName: 'Percurso.pdf' },
      { kind: 'video', fileName: null },
      'Bora!\nLevo água',
    ])
    expect(all[1].text).toBe('percurso')
    expect(all[6].at).toBe('2023-11-19T07:05:00')
  })
})

describe('parseExport: date order', () => {
  it('flags an export where no part passes 12 and time runs forward either way', () => {
    const parsed = parseExport('01/02/2024 10:00 - Ana: oi\n01/02/2024 10:01 - Bia: oi\n')
    expect(parsed.dateOrderAmbiguous).toBe(true)
    expect(parsed.format.dateOrder).toBe('dmy')
  })

  it('uses the order in which time moves forward', () => {
    // As month first this would go from December back to January.
    const parsed = parseExport('12/01/2024 10:00 - Ana: oi\n01/02/2024 10:01 - Bia: oi\n')
    expect(parsed.dateOrderAmbiguous).toBe(false)
    expect(parsed.format.dateOrder).toBe('dmy')
  })

  it('takes the order confirmed by the person importing', () => {
    const parsed = parseExport('01/02/2024 10:00 - Ana: oi\n', { dateOrder: 'mdy' })
    expect(parsed.dateOrderAmbiguous).toBe(false)
    expect(parsed.entries[0].at).toBe('2024-01-02T10:00:00')
  })
})

describe('parseExport: resilience', () => {
  it('keeps a line that fits no format as part of the previous message', () => {
    const parsed = parseExport('15/10/2023 14:22 - Ana: oi\n99/99/2023 99:99 - não é data\n')
    expect(parsed.entries).toHaveLength(1)
    expect((parsed.entries[0] as Message).text).toBe('oi\n99/99/2023 99:99 - não é data')
  })

  it('opens with the lines that come before the first timestamp as a notice', () => {
    const parsed = parseExport('As mensagens são protegidas.\n[1/15/24, 9:00:00 AM] Ana: oi\n')
    expect(parsed.entries[0]).toMatchObject({ kind: 'notice', at: '2024-01-15T09:00:00', text: 'As mensagens são protegidas.' })
  })

  it('treats Android lines without an author as notices', () => {
    const parsed = parseExport('15/10/2023 14:22 - Ana mudou o nome do grupo para "Plano: sábado"\n')
    expect(parsed.entries[0].kind).toBe('notice')
    expect(parsed.participants).toEqual([])
  })
})

describe('attachmentKind', () => {
  it.each([
    ['IMG-20231015-WA0012.jpg', 'image'],
    ['VID-20231015-WA0001.mp4', 'video'],
    ['AUD-20231015-WA0001.mp3', 'audio'],
    ['PTT-20231015-WA0001.opus', 'voice'],
    ['STK-20231015-WA0001.webp', 'sticker'],
    ['00000012-PHOTO-2023-10-15-14-22-33.jpg', 'image'],
    ['00000012-GIF-2023-10-15-14-22-33.mp4', 'gif'],
    ['00000012-AUDIO-2023-10-15-14-22-33.m4a', 'audio'],
    ['Ana.vcf', 'contact'],
    ['relatorio.pdf', 'document'],
  ])('%s is %s', (fileName, kind) => {
    expect(attachmentKind(fileName)).toBe(kind)
  })
})
