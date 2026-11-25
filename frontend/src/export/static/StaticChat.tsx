// The range as still bubbles in the page, made from the export document: what the browser prints
// and what the screenshots capture. Nothing here is interactive, and every text is already redacted.

import { FileText, ImageOff, MapPin, Play, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEmojiMap, withEmoji, type EmojiMap } from '../../chat/emoji/emoji.tsx'
import type { AttachmentKind } from '../../chat/model.ts'
import { formatDate, formatTime } from '../../chat/summary.ts'
import type { ExportDocument, ExportEntry } from '../document.ts'
import { MARK, MARK_SHORT } from '../formats.ts'
import type { StaticMedia } from '../staticMedia.ts'

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

const clock = (seconds?: number) =>
  seconds !== undefined && Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : ''
const count = (value: number, one: string, many: string) => `${value.toLocaleString('pt-BR')} ${value === 1 ? one : many}`

function Card({ icon, title, detail }: { icon: ReactNode; title: string; detail?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-chip px-3 py-2">
      <span className="shrink-0 text-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block font-medium break-words">{title}</span>
        {detail && <span className="block text-xs break-words text-muted">{detail}</span>}
      </span>
    </div>
  )
}

function Attachment({ entry, media }: { entry: Extract<ExportEntry, { kind: 'message' }>; media?: StaticMedia }) {
  const attachment = entry.attachment!
  const label = attachment.label && <p className="mt-0.5 px-1 text-[11px] break-all text-muted">{attachment.label}</p>
  let body: ReactNode
  if (!attachment.present || !media) {
    body = <Card icon={<ImageOff size={22} />} title={MISSING[attachment.kind]} />
  } else if (media.picture && (attachment.kind === 'image' || attachment.kind === 'video' || attachment.kind === 'gif')) {
    body = (
      <div className="relative">
        <img src={media.picture} alt="" className="max-h-80 max-w-full rounded-md" />
        {attachment.kind !== 'image' && (
          <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">
            <Play size={12} /> {attachment.kind === 'gif' ? 'GIF' : clock(media.duration)}
          </span>
        )}
      </div>
    )
  } else if (media.picture && attachment.kind === 'sticker') {
    body = <img src={media.picture} alt="" className="size-32 object-contain" />
  } else if (attachment.kind === 'audio' || attachment.kind === 'voice') {
    const levels = media.levels ?? Array.from({ length: 40 }, () => 0.3)
    body = (
      <div className="flex w-64 items-center gap-2 py-1">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
          <Play size={16} />
        </span>
        <span className="flex h-6 flex-1 items-center gap-[2px]">
          {levels.map((level, i) => (
            <span key={i} className="w-[3px] rounded-full bg-muted/60" style={{ height: `${Math.round(level * 100)}%` }} />
          ))}
        </span>
        <span className="text-[11px] text-muted">{clock(media.duration)}</span>
      </div>
    )
  } else if (attachment.kind === 'contact' && media.contact) {
    body = <Card icon={<UserRound size={24} />} title={media.contact.name || 'Contato'} detail={media.contact.phones.join(' · ')} />
  } else {
    body = (
      <Card
        icon={<FileText size={24} />}
        title={attachment.label ?? 'Documento'}
        detail={attachment.pages !== undefined ? count(attachment.pages, 'página', 'páginas') : undefined}
      />
    )
  }
  return (
    <div className="mb-1">
      {body}
      {label}
    </div>
  )
}

function Bubble({ entry, media, isGroup, emoji }: { entry: ExportEntry; media?: StaticMedia; isGroup: boolean; emoji: EmojiMap | null }) {
  if (entry.kind === 'notice') {
    return (
      <div className="flex justify-center px-6 pt-2">
        <span className="max-w-[85%] rounded-lg bg-notice px-3 py-1.5 text-center text-[12.5px] text-muted shadow-sm">
          {withEmoji(entry.text, emoji, 'n')}
        </span>
      </div>
    )
  }
  const sticker = entry.kind === 'message' && entry.attachment?.kind === 'sticker' && entry.attachment.present && media?.picture
  const time = formatTime(entry.at)
  return (
    <div className={`flex px-4 pt-1 break-inside-avoid ${entry.outgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] text-[14px] leading-[19px] ${
          sticker ? '' : `rounded-lg px-2 pt-1.5 pb-1 shadow-sm ${entry.outgoing ? 'bg-bubble-out' : 'bg-bubble-in'}`
        }`}
      >
        {isGroup && !entry.outgoing && (
          <p className="mb-0.5 text-[12.8px] font-medium" style={{ color: entry.kind === 'message' ? entry.authorColor : undefined }}>
            {withEmoji(entry.author, emoji, 'a')}
          </p>
        )}
        {entry.kind === 'hidden' ? (
          <p className="text-muted italic">Mensagem ocultada</p>
        ) : (
          <>
            {entry.attachment && <Attachment entry={entry} media={media} />}
            {entry.poll && (
              <div className="mb-1">
                <p className="font-medium">{withEmoji(entry.poll.question, emoji, 'q')}</p>
                {entry.poll.options.map((option, i) => (
                  <p key={i} className="flex justify-between gap-4 text-sm">
                    <span>{withEmoji(option.text, emoji, `o${i}`)}</span>
                    <span className="text-muted">{count(option.votes, 'voto', 'votos')}</span>
                  </p>
                ))}
              </div>
            )}
            {entry.location && (
              <div className="mb-1">
                <Card
                  icon={<MapPin size={22} />}
                  title="Localização"
                  detail={`${entry.location.latitude.toFixed(5)}, ${entry.location.longitude.toFixed(5)} · ${entry.location.url}`}
                />
              </div>
            )}
            {entry.deleted ? (
              <p className="text-muted italic">Mensagem apagada</p>
            ) : (
              entry.text && <p className="break-words whitespace-pre-wrap">{withEmoji(entry.text, emoji, 't')}</p>
            )}
          </>
        )}
        <p className={`text-right text-[11px] text-muted ${sticker ? 'mt-0.5' : ''}`}>
          {entry.kind === 'message' && entry.edited ? `Editada ${time}` : time}
        </p>
      </div>
    </div>
  )
}

/** The bubbles of the range, with a date chip whenever the day changes. */
export function StaticChat({ document: doc, media }: { document: ExportDocument; media: Map<number, StaticMedia> }) {
  const emoji = useEmojiMap()
  const rows: ReactNode[] = []
  let day = ''
  for (const entry of doc.entries) {
    if (entry.at.slice(0, 10) !== day) {
      day = entry.at.slice(0, 10)
      rows.push(
        <div key={`d${day}`} className="flex justify-center px-3 pt-3 pb-1 break-after-avoid">
          <span className="rounded-lg bg-notice px-3 py-1 text-[12.5px] text-muted shadow-sm">{formatDate(entry.at)}</span>
        </div>,
      )
    }
    rows.push(<Bubble key={entry.index} entry={entry} media={media.get(entry.index)} isGroup={doc.isGroup} emoji={emoji} />)
  }
  return <div className="pb-3">{rows}</div>
}

/** The cover of the printed PDF, with what identifies the export (ADR 0005). */
export function CoverSheet({ document: doc }: { document: ExportDocument }) {
  const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
  const redactions = [
    doc.redaction.hidden > 0 && count(doc.redaction.hidden, 'mensagem ocultada', 'mensagens ocultadas'),
    doc.redaction.aliases > 0 && count(doc.redaction.aliases, 'participante renomeado', 'participantes renomeados'),
    doc.redaction.maskNumbers && 'números de telefone mascarados',
  ].filter(Boolean)
  const rows: [string, string, boolean?][] = [
    ['Recorte', `${dateTime.format(new Date(doc.first))} a ${dateTime.format(new Date(doc.last))}`],
    ['Mensagens', count(doc.messageCount, 'mensagem', 'mensagens')],
    ['Participantes', doc.participants.map((p) => (p.self ? `${p.name} (quem exportou)` : p.name)).join(', ')],
    ['Ocultação', redactions.length > 0 ? redactions.join('; ') : 'nenhuma'],
    ['Exportação do WhatsApp', doc.sourceName],
    ['Hash SHA-256 da exportação', doc.fingerprint, true],
    ['Gerado em', dateTime.format(doc.generatedAt)],
  ]
  return (
    <section className="break-after-page bg-panel p-10 text-text">
      <p className="mb-2 text-sm font-semibold text-accent">ExportaZap</p>
      <h1 className="text-3xl font-semibold break-words">{doc.title}</h1>
      <p className="mb-8 text-muted">{doc.isGroup ? 'Grupo' : 'Conversa individual'}</p>
      <dl className="space-y-3">
        {rows.map(([label, value, mono]) => (
          <div key={label}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className={mono ? 'font-mono text-xs break-all' : 'break-words'}>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-xs leading-relaxed text-muted">
        {MARK}. O hash identifica o arquivo exportado: quem tiver o arquivo original pode conferir se ele é o mesmo (por exemplo, com
        sha256sum). Mensagens ocultadas aparecem como tal; a exportação não traz confirmações de leitura, por isso elas não aparecem.
      </p>
    </section>
  )
}

export function MarkFooter() {
  return <p className="text-center text-[10px] text-muted">{MARK_SHORT}</p>
}
