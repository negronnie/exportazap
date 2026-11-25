// Generates the synthetic WhatsApp exports used in the tests: `node fixtures/sinteticas/gerar.mjs`.
// The invisible characters WhatsApp writes are spelled out as escapes so they stay visible here.
// The media files are placeholders: only their names matter to the import.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const LRM = '‎'
const NNBSP = ' '
const FSI = '⁨'
const PDI = '⁩'
const root = dirname(fileURLToPath(import.meta.url))

function exportFolder(caseName, exportName, chatFile, lines, media, newline = '\n') {
  const folder = join(root, caseName, exportName)
  rmSync(join(root, caseName), { recursive: true, force: true })
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, chatFile), lines.join(newline) + newline)
  for (const name of media) writeFileSync(join(folder, name), `placeholder for ${name}\n`)
}

// Android, Brazilian Portuguese, individual chat, exported with media.
exportFolder(
  'android-ptbr-individual',
  'Conversa do WhatsApp com Ana Souza',
  'Conversa do WhatsApp com Ana Souza.txt',
  [
    '14/10/2023 09:00 - As mensagens e ligações são protegidas com a criptografia de ponta a ponta. Somente as pessoas que fazem parte da conversa podem ler, ouvir e compartilhar esse conteúdo. Saiba mais',
    '14/10/2023 09:01 - Ana Souza: Bom dia! Tudo certo pra sábado?',
    '14/10/2023 09:03 - Lucas: Tudo certo',
    'Levo o bolo e as velas',
    'e a toalha também',
    `14/10/2023 09:05 - Ana Souza: ${LRM}IMG-20231014-WA0001.jpg (arquivo anexado)`,
    'Olha o lugar',
    `14/10/2023 09:06 - Lucas: ${LRM}PTT-20231014-WA0002.opus (arquivo anexado)`,
    `14/10/2023 09:07 - Ana Souza: ${LRM}STK-20231014-WA0003.webp (arquivo anexado)`,
    '14/10/2023 09:08 - Lucas: <Mídia oculta>',
    `14/10/2023 09:10 - Ana Souza: ${LRM}Ana Souza.vcf (arquivo anexado)`,
    `14/10/2023 09:11 - Ana Souza: ${LRM}Cardápio.pdf • 2 páginas (arquivo anexado)`,
    '14/10/2023 09:12 - Lucas: Mensagem apagada',
    '14/10/2023 09:13 - Lucas: Chego às 10h <Mensagem editada>',
    '14/10/2023 09:15 - Ana Souza: localização: https://maps.google.com/?q=-27.5954,-48.5480',
    '14/10/2023 09:20 - Lucas: ENQUETE:',
    'Que horas começa?',
    'OPÇÃO: 10h (2 votos)',
    'OPÇÃO: 11h (0 votos)',
    '15/10/2023 21:40 - Ana Souza: Valeu por tudo! 🎉',
  ],
  ['IMG-20231014-WA0001.jpg', 'PTT-20231014-WA0002.opus', 'STK-20231014-WA0003.webp', 'Ana Souza.vcf', 'Cardápio.pdf'],
)

// iOS, Brazilian Portuguese, group chat, exported with media. iOS writes CRLF and marks the
// lines of attachments and notices with a direction mark.
exportFolder(
  'ios-ptbr-grupo',
  'WhatsApp Chat - Corrida de domingo',
  '_chat.txt',
  [
    `[02/11/2023, 18:00:00] Corrida de domingo: ${LRM}As mensagens e ligações são protegidas com a criptografia de ponta a ponta. Somente as pessoas que fazem parte da conversa podem ler, ouvir e compartilhar esse conteúdo.`,
    `${LRM}[02/11/2023, 18:00:00] Corrida de domingo: ${LRM}${FSI}Bia${PDI} criou o grupo “Corrida de domingo”.`,
    `${LRM}[02/11/2023, 18:00:05] Corrida de domingo: ${LRM}${FSI}Bia${PDI} adicionou você.`,
    `${LRM}[02/11/2023, 18:00:07] Corrida de domingo: ${LRM}${FSI}Bia${PDI} adicionou ${FSI}Caio Mendes${PDI}.`,
    '[02/11/2023, 18:01:10] Bia: Domingo às 7h no trapiche',
    `${LRM}[02/11/2023, 18:01:30] Bia: percurso ${LRM}<anexado: 00000003-PHOTO-2023-11-02-18-01-30.jpg>`,
    '[02/11/2023, 18:02:00] Caio Mendes: Bora!',
    'Levo água pra todo mundo',
    `${LRM}[02/11/2023, 18:02:20] Caio Mendes: ${LRM}<anexado: 00000005-STICKER-2023-11-02-18-02-20.webp>`,
    `${LRM}[02/11/2023, 18:03:00] Lucas: ${LRM}<anexado: 00000007-AUDIO-2023-11-02-18-03-00.opus>`,
    `${LRM}[02/11/2023, 18:04:00] Bia: Percurso.pdf • ${LRM}3 páginas ${LRM}<anexado: 00000011-Percurso.pdf>`,
    `[02/11/2023, 18:05:00] Caio Mendes: chego 6h50 ${LRM}<Mensagem editada>`,
    `[02/11/2023, 18:06:00] Lucas: ${LRM}Mensagem apagada`,
    `[02/11/2023, 18:07:00] Bia: olha o tênis ${LRM}imagem ocultada`,
    `${LRM}[05/11/2023, 07:05:00] Bia: ${LRM}<anexado: 00000009-VIDEO-2023-11-05-07-05-00.mp4>`,
    `[05/11/2023, 07:06:00] Lucas: ${LRM}Localização: https://maps.google.com/?q=-27.6,-48.5`,
    `[05/11/2023, 08:30:00] Caio Mendes: ${LRM}ENQUETE:`,
    'Próximo domingo?',
    `${LRM}OPÇÃO: Sim (3 votos)`,
    `${LRM}OPÇÃO: Não (0 votos)`,
    `${LRM}[05/11/2023, 09:00:00] Corrida de domingo: ${LRM}${FSI}Caio Mendes${PDI} saiu.`,
  ],
  [
    '00000003-PHOTO-2023-11-02-18-01-30.jpg',
    '00000005-STICKER-2023-11-02-18-02-20.webp',
    '00000007-AUDIO-2023-11-02-18-03-00.opus',
    '00000009-VIDEO-2023-11-05-07-05-00.mp4',
    '00000011-Percurso.pdf',
  ],
  '\r\n',
)

// Android, Brazilian Portuguese, exported without media.
exportFolder(
  'android-ptbr-sem-midia',
  'Conversa do WhatsApp com Bruno Lima',
  'Conversa do WhatsApp com Bruno Lima.txt',
  [
    '03/01/2024 20:00 - Bruno Lima: Viu as fotos?',
    '03/01/2024 20:01 - Bruno Lima: <Mídia oculta>',
    '03/01/2024 20:01 - Bruno Lima: <Mídia oculta>',
    '03/01/2024 20:05 - Lucas: Que lindas!',
  ],
  [],
)

// Android, US English: month first, 12-hour clock with a narrow no-break space before AM/PM.
exportFolder(
  'android-en-individual',
  'WhatsApp Chat with Carol',
  'WhatsApp Chat with Carol.txt',
  [
    `3/14/24, 9:15${NNBSP}AM - Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. Learn more`,
    `3/14/24, 9:16${NNBSP}AM - Carol: Are we still on for lunch?`,
    `3/14/24, 9:20${NNBSP}AM - Lucas: ${LRM}IMG-20240314-WA0004.jpg (file attached)`,
    'Yes! Same place',
    `3/14/24, 9:21${NNBSP}AM - Carol: <Media omitted>`,
    `3/14/24, 12:05${NNBSP}PM - Carol: This message was deleted`,
    `3/14/24, 12:06${NNBSP}PM - Lucas: Running late <This message was edited>`,
    `3/14/24, 12:30${NNBSP}PM - Carol: location: https://maps.google.com/?q=40.7128,-74.0060`,
    `3/15/24, 8:00${NNBSP}PM - Lucas: POLL:`,
    'Next lunch?',
    'OPTION: Friday (1 vote)',
    'OPTION: Monday (1 vote)',
  ],
  ['IMG-20240314-WA0004.jpg'],
)

// WhatsApp Web, Brazilian Portuguese browser, group chat: month first and AM/PM whatever the
// language, no direction marks, no media files, and the person who exported appears as "Você".
// Next to chat.txt it writes a chat.md that the import does not read.
exportFolder(
  'web-ptbr-grupo',
  'Corrida de domingo',
  'chat.txt',
  [
    'As mensagens e as ligações são protegidas com a criptografia de ponta a ponta e ficam somente entre você e os participantes desta conversa. Nem mesmo o WhatsApp pode ler, ouvir ou compartilhar esse conteúdo.',
    '[11/2/23, 6:00:00 PM] Bia criou o grupo',
    '[11/2/23, 6:00:05 PM] Bia adicionou Você',
    '[11/2/23, 6:01:10 PM] Bia: Domingo às 7h no trapiche',
    '[11/2/23, 6:01:30 PM] Bia: <Mensagem de album>',
    '[11/2/23, 6:01:31 PM] Bia: <imagem ocultada> percurso',
    '[11/2/23, 6:01:31 PM] Bia: <imagem ocultada>',
    '[11/2/23, 6:02:00 PM] Caio Mendes: <figurinha omitida>',
    '[11/2/23, 6:03:00 PM] Você: <mensagem de voz omitida>',
    '[11/2/23, 6:04:00 PM] Bia: <documento omitido> Percurso.pdf',
    '[11/19/23, 7:05:00 AM] Caio Mendes: <vídeo omitido>',
    '[11/19/23, 7:06:00 AM] Bia: <Mensagem de message_history_notice>',
    '[11/19/23, 7:07:00 AM] Você: Bora!',
    'Levo água',
  ],
  [],
)
writeFileSync(join(root, 'web-ptbr-grupo', 'Corrida de domingo', 'chat.md'), '# Exportação de conversas do WhatsApp: Corrida de domingo\n')

// iOS, Spanish, individual chat with a two-digit year and the 24-hour clock.
exportFolder(
  'ios-es-individual',
  'WhatsApp Chat - Diego',
  '_chat.txt',
  [
    `[20/05/24, 10:00:00] Diego: ${LRM}Los mensajes y las llamadas están cifrados de extremo a extremo. Solo las personas en este chat pueden leerlos, escucharlos o compartirlos.`,
    '[20/05/24, 10:01:12] Diego: ¿Vienes mañana?',
    `${LRM}[20/05/24, 10:02:40] Lucas: ${LRM}<adjunto: 00000002-PHOTO-2024-05-20-10-02-40.jpg>`,
    `[20/05/24, 10:03:00] Diego: ${LRM}imagen omitida`,
    `[20/05/24, 10:04:00] Diego: ${LRM}Se eliminó este mensaje.`,
    `[20/05/24, 10:05:00] Lucas: sí, a las 9 ${LRM}<Se editó este mensaje.>`,
    `[20/05/24, 10:06:00] Diego: ${LRM}Ubicación: https://maps.google.com/?q=-34.6037,-58.3816`,
    `[21/05/24, 19:30:00] Lucas: ${LRM}ENCUESTA:`,
    '¿Cena?',
    `${LRM}OPCIÓN: Pizza (2 votos)`,
  ],
  ['00000002-PHOTO-2024-05-20-10-02-40.jpg'],
  '\r\n',
)
