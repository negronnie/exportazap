// The PDF made by the app (ADR 0002): a cover page that identifies the export (ADR 0005), then the
// range as bubbles, with every attachment as a still picture or a card and the Mark on every page.

import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { AttachmentKind } from '../../chat/model.ts'
import type { Theme } from '../../theme.ts'
import type { ExportDocument, ExportEntry } from '../document.ts'
import { MARK, MARK_SHORT } from '../formats.ts'
import type { StaticMedia } from '../staticMedia.ts'

const PALETTES: Record<Theme, Record<string, string>> = {
  light: {
    page: '#efeae2',
    panel: '#ffffff',
    bubbleIn: '#ffffff',
    bubbleOut: '#d9fdd3',
    text: '#111b21',
    muted: '#667781',
    chip: '#f0f2f5',
    accent: '#00a884',
    link: '#027eb5',
  },
  dark: {
    page: '#0b141a',
    panel: '#111b21',
    bubbleIn: '#202c33',
    bubbleOut: '#005c4b',
    text: '#e9edef',
    muted: '#8696a0',
    chip: '#2a3942',
    accent: '#00a884',
    link: '#53bdeb',
  },
}

const MISSING: Record<AttachmentKind, string> = {
  image: 'Imagem não incluída',
  video: 'Vídeo não incluído',
  audio: 'Áudio não incluído',
  voice: 'Mensagem de voz não incluída',
  sticker: 'Figurinha não incluída',
  gif: 'GIF não incluído',
  document: 'Documento não incluído',
  contact: 'Contato não incluído',
  unknown: 'Mídia não incluída',
}

const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
const time = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' })
const clock = (seconds?: number) =>
  seconds !== undefined && Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : ''
const count = (value: number, one: string, many: string) => `${value.toLocaleString('pt-BR')} ${value === 1 ? one : many}`

function styles(theme: Theme) {
  const c = PALETTES[theme]
  return {
    c,
    s: StyleSheet.create({
      page: { backgroundColor: c.page, color: c.text, fontFamily: 'Helvetica', fontSize: 10, paddingTop: 28, paddingBottom: 42, paddingHorizontal: 28 },
      cover: { backgroundColor: c.panel, color: c.text, fontFamily: 'Helvetica', fontSize: 11, padding: 48 },
      footer: { position: 'absolute', bottom: 16, left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: c.muted },
      chip: { alignSelf: 'center', backgroundColor: c.panel, color: c.muted, fontSize: 8.5, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, marginTop: 8, marginBottom: 2 },
      notice: { alignSelf: 'center', maxWidth: '80%', textAlign: 'center', backgroundColor: c.panel, color: c.muted, fontSize: 8.5, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, marginTop: 4 },
      row: { flexDirection: 'row', marginTop: 3 },
      bubble: { maxWidth: '75%', borderRadius: 7, paddingTop: 5, paddingBottom: 4, paddingHorizontal: 7 },
      author: { fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 2 },
      text: { lineHeight: 1.35 },
      meta: { alignSelf: 'flex-end', fontSize: 7, color: c.muted, marginTop: 2 },
      italic: { fontFamily: 'Helvetica-Oblique', color: c.muted },
      file: { fontSize: 7, color: c.muted, marginTop: 2 },
      card: { backgroundColor: c.chip, borderRadius: 5, padding: 6, marginBottom: 3 },
      cardTitle: { fontFamily: 'Helvetica-Bold' },
      cardDetail: { fontSize: 8, color: c.muted, marginTop: 1 },
    }),
  }
}

type Styles = ReturnType<typeof styles>

function Attachment({ entry, media, st }: { entry: Extract<ExportEntry, { kind: 'message' }>; media?: StaticMedia; st: Styles }) {
  const { s, c } = st
  const attachment = entry.attachment!
  const label = attachment.label ? <Text style={s.file}>{attachment.label}</Text> : null

  if (!attachment.present || !media) {
    return (
      <View style={s.card}>
        <Text style={s.cardTitle}>{MISSING[attachment.kind]}</Text>
        {label}
      </View>
    )
  }
  if ((attachment.kind === 'image' || attachment.kind === 'sticker' || attachment.kind === 'video' || attachment.kind === 'gif') && media.picture) {
    const width = attachment.kind === 'sticker' ? 90 : 200
    const height = media.width && media.height ? (width * media.height) / media.width : width
    return (
      <View style={{ marginBottom: 2 }}>
        <Image src={media.picture} style={{ width, height: Math.min(height, 280), objectFit: 'cover', borderRadius: 4 }} />
        {(attachment.kind === 'video' || attachment.kind === 'gif') && (
          <Text style={s.cardDetail}>{attachment.kind === 'gif' ? 'GIF' : 'Vídeo'} · {clock(media.duration)}</Text>
        )}
        {label}
      </View>
    )
  }
  if (attachment.kind === 'audio' || attachment.kind === 'voice') {
    const levels = media.levels ?? Array.from({ length: 40 }, () => 0.3)
    return (
      <View style={{ marginBottom: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* The play button as a dot: the PDF font has no triangle glyph. */}
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.accent, marginRight: 5 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 16 }}>
            {levels.map((level, i) => (
              <View key={i} style={{ width: 2, marginRight: 1, height: Math.max(2, level * 16), backgroundColor: c.muted, borderRadius: 1 }} />
            ))}
          </View>
          <Text style={{ fontSize: 8, color: c.muted, marginLeft: 4 }}>{clock(media.duration)}</Text>
        </View>
        {label}
      </View>
    )
  }
  if (attachment.kind === 'contact' && media.contact) {
    return (
      <View style={s.card}>
        <Text style={s.cardTitle}>{media.contact.name || 'Contato'}</Text>
        {media.contact.phones.length > 0 && <Text style={s.cardDetail}>{media.contact.phones.join(' · ')}</Text>}
        {label}
      </View>
    )
  }
  const details = [attachment.pages !== undefined && count(attachment.pages, 'página', 'páginas')].filter(Boolean)
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{attachment.label ?? 'Documento'}</Text>
      {details.length > 0 && <Text style={s.cardDetail}>{details.join(' · ')}</Text>}
    </View>
  )
}

function Bubble({ entry, media, isGroup, st }: { entry: ExportEntry; media: Map<number, StaticMedia>; isGroup: boolean; st: Styles }) {
  const { s, c } = st
  if (entry.kind === 'notice') return <Text style={s.notice}>{entry.text}</Text>
  const outgoing = entry.outgoing
  const meta = time.format(new Date(entry.at))
  const sticker = entry.kind === 'message' && entry.attachment?.kind === 'sticker' && entry.attachment.present && media.has(entry.index)
  return (
    <View style={[s.row, { justifyContent: outgoing ? 'flex-end' : 'flex-start' }]} wrap={entry.kind === 'message' && entry.text.length > 1200}>
      <View style={[s.bubble, { backgroundColor: sticker ? 'transparent' : outgoing ? c.bubbleOut : c.bubbleIn }]}>
        {isGroup && !outgoing && (
          <Text style={[s.author, { color: entry.kind === 'message' ? (entry.authorColor ?? c.accent) : c.muted }]}>{entry.author}</Text>
        )}
        {entry.kind === 'hidden' ? (
          <Text style={s.italic}>Mensagem ocultada</Text>
        ) : (
          <>
            {entry.attachment && <Attachment entry={entry} media={media.get(entry.index)} st={st} />}
            {entry.poll && (
              <View style={{ marginBottom: 2 }}>
                <Text style={s.cardTitle}>{entry.poll.question}</Text>
                {entry.poll.options.map((option, i) => (
                  <Text key={i} style={{ fontSize: 9 }}>
                    {option.text} — {count(option.votes, 'voto', 'votos')}
                  </Text>
                ))}
              </View>
            )}
            {entry.location && (
              <View style={s.card}>
                <Text style={s.cardTitle}>Localização</Text>
                <Text style={s.cardDetail}>
                  {entry.location.latitude.toFixed(5)}, {entry.location.longitude.toFixed(5)}
                </Text>
                <Link src={entry.location.url} style={{ fontSize: 7.5, color: c.link }}>
                  {entry.location.url}
                </Link>
              </View>
            )}
            {entry.deleted ? <Text style={s.italic}>Mensagem apagada</Text> : entry.text ? <Text style={s.text}>{entry.text}</Text> : null}
          </>
        )}
        <Text style={s.meta}>{entry.kind === 'message' && entry.edited ? `Editada ${meta}` : meta}</Text>
      </View>
    </View>
  )
}

function Cover({ document: doc, st }: { document: ExportDocument; st: Styles }) {
  const { s, c } = st
  const redactions = [
    doc.redaction.hidden > 0 && count(doc.redaction.hidden, 'mensagem ocultada', 'mensagens ocultadas'),
    doc.redaction.aliases > 0 && count(doc.redaction.aliases, 'participante renomeado', 'participantes renomeados'),
    doc.redaction.maskNumbers && 'números de telefone mascarados',
  ].filter(Boolean)
  const row = (label: string, value: string, mono = false) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 8.5, color: c.muted, marginBottom: 2 }}>{label}</Text>
      <Text style={mono ? { fontFamily: 'Courier', fontSize: 8.5 } : {}}>{value}</Text>
    </View>
  )
  return (
    <Page size="A4" style={s.cover}>
      <Text style={{ fontSize: 9, color: c.accent, fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>ExportaZap</Text>
      <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>{doc.title}</Text>
      <Text style={{ color: c.muted, marginBottom: 28 }}>{doc.isGroup ? 'Grupo' : 'Conversa individual'}</Text>
      {row('Recorte', `${dateTime.format(new Date(doc.first))} a ${dateTime.format(new Date(doc.last))}`)}
      {row('Mensagens', count(doc.messageCount, 'mensagem', 'mensagens'))}
      {row('Participantes', doc.participants.map((p) => (p.self ? `${p.name} (quem exportou)` : p.name)).join(', '))}
      {row('Ocultação', redactions.length > 0 ? redactions.join('; ') : 'nenhuma')}
      {row('Exportação do WhatsApp', doc.sourceName)}
      {row('Hash SHA-256 da exportação', doc.fingerprint, true)}
      {row('Gerado em', dateTime.format(doc.generatedAt))}
      <Text style={{ marginTop: 18, fontSize: 8.5, color: c.muted, lineHeight: 1.4 }}>
        {MARK}. O hash identifica o arquivo exportado: quem tiver o arquivo original pode conferir se ele é o mesmo (por exemplo, com
        sha256sum). Mensagens ocultadas aparecem como tal; a exportação não traz confirmações de leitura, por isso elas não aparecem.
      </Text>
    </Page>
  )
}

export function PdfDocument({ document: doc, media }: { document: ExportDocument; media: Map<number, StaticMedia> }) {
  const st = styles(doc.theme)
  const blocks: ReactNode[] = []
  let day = ''
  for (const entry of doc.entries) {
    const entryDay = entry.at.slice(0, 10)
    if (entryDay !== day) {
      day = entryDay
      blocks.push(
        <Text key={`d${entryDay}`} style={st.s.chip} minPresenceAhead={40}>
          {date.format(new Date(entry.at))}
        </Text>,
      )
    }
    blocks.push(<Bubble key={entry.index} entry={entry} media={media} isGroup={doc.isGroup} st={st} />)
  }
  return (
    <Document title={doc.title} author="ExportaZap" creator="ExportaZap" producer="ExportaZap" subject={MARK}>
      <Cover document={doc} st={st} />
      <Page size="A4" style={st.s.page} wrap>
        {blocks}
        <View style={st.s.footer} fixed>
          <Text>{MARK_SHORT}</Text>
          <Text render={({ pageNumber, totalPages }) => `${doc.title} · página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
