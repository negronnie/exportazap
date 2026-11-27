// A bubble of the HTML package: like the static chat, but the attachments open and play, from the
// files next to the page.

import { FileText, ImageOff, MapPin, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { withEmoji, type EmojiMap } from '../chat/emoji/emoji.tsx'
import type { AttachmentKind } from '../chat/model.ts'
import { formatTime } from '../chat/summary.ts'
import type { ExportEntry } from '../export/document.ts'
import { packagedText } from './packagedText.tsx'

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

const count = (value: number, one: string, many: string) => `${value.toLocaleString('pt-BR')} ${value === 1 ? one : many}`

function Card({ icon, title, detail, href }: { icon: ReactNode; title: string; detail?: string; href?: string }) {
  const body = (
    <>
      <span className="shrink-0 text-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block font-medium break-words">{title}</span>
        {detail && <span className="block text-xs break-words text-muted">{detail}</span>}
      </span>
    </>
  )
  const className = 'flex items-center gap-3 rounded-md bg-chip px-3 py-2'
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  )
}

function Attachment({ entry, path, onImage }: { entry: Extract<ExportEntry, { kind: 'message' }>; path?: string; onImage(path: string): void }) {
  const attachment = entry.attachment!
  let body: ReactNode
  if (!path) body = <Card icon={<ImageOff size={22} />} title={MISSING[attachment.kind]} />
  else if (attachment.kind === 'image')
    body = (
      <button type="button" onClick={() => onImage(path)} className="block">
        <img src={path} alt="" loading="lazy" className="max-h-80 max-w-full rounded-md" />
      </button>
    )
  else if (attachment.kind === 'sticker') body = <img src={path} alt="" loading="lazy" className="size-32 object-contain" />
  else if (attachment.kind === 'video') body = <video src={path} controls preload="metadata" playsInline className="max-h-80 max-w-full rounded-md" />
  else if (attachment.kind === 'gif') body = <video src={path} autoPlay loop muted playsInline className="max-h-80 max-w-full rounded-md" />
  else if (attachment.kind === 'audio' || attachment.kind === 'voice') body = <audio src={path} controls preload="metadata" className="w-64 max-w-full" />
  else if (attachment.kind === 'contact') body = <Card icon={<UserRound size={24} />} title={attachment.label ?? 'Contato'} href={path} />
  else
    body = (
      <Card
        icon={<FileText size={24} />}
        title={attachment.label ?? 'Documento'}
        detail={attachment.pages !== undefined ? count(attachment.pages, 'página', 'páginas') : undefined}
        href={path}
      />
    )
  return (
    <div className="mb-1">
      {body}
      {attachment.label && <p className="mt-0.5 px-1 text-[11px] break-all text-muted">{attachment.label}</p>}
    </div>
  )
}

interface Props {
  entry: ExportEntry
  path?: string
  isGroup: boolean
  emoji: EmojiMap
  query: string
  highlighted: boolean
  onImage(path: string): void
}

export function ViewerBubble({ entry, path, isGroup, emoji, query, highlighted, onImage }: Props) {
  if (entry.kind === 'notice') {
    return (
      <div className="flex justify-center px-6 pt-2">
        <span className="max-w-[85%] rounded-lg bg-notice px-3 py-1.5 text-center text-[12.5px] text-muted shadow-sm @3xl:max-w-[65%]">
          {packagedText(entry.text, query, emoji, 'n')}
        </span>
      </div>
    )
  }
  const time = formatTime(entry.at)
  return (
    <div className={`flex px-3 pt-1 @3xl:px-[6%] ${entry.outgoing ? 'justify-end' : 'justify-start'} ${highlighted ? 'bg-accent/20' : ''}`}>
      <div className={`max-w-[85%] rounded-lg px-2 pt-1.5 pb-1 text-[14.2px] leading-[19px] shadow-sm @3xl:max-w-[65%] ${entry.outgoing ? 'bg-bubble-out' : 'bg-bubble-in'}`}>
        {isGroup && !entry.outgoing && (
          <p className="mb-0.5 text-[12.8px] font-medium" style={{ color: entry.kind === 'message' ? entry.authorColor : undefined }}>
            {withEmoji(entry.author, emoji, 'a', false, 'emoji/')}
          </p>
        )}
        {entry.kind === 'hidden' ? (
          <p className="text-muted italic">Mensagem ocultada</p>
        ) : (
          <>
            {entry.attachment && <Attachment entry={entry} path={path} onImage={onImage} />}
            {entry.poll && (
              <div className="mb-1">
                <p className="font-medium">{packagedText(entry.poll.question, query, emoji, 'q')}</p>
                {entry.poll.options.map((option, i) => (
                  <p key={i} className="flex justify-between gap-4 text-sm">
                    <span>{packagedText(option.text, query, emoji, `o${i}`)}</span>
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
                  detail={`${entry.location.latitude.toFixed(5)}, ${entry.location.longitude.toFixed(5)}`}
                  href={entry.location.url}
                />
              </div>
            )}
            {entry.deleted ? (
              <p className="text-muted italic">Mensagem apagada</p>
            ) : (
              entry.text && <p className="break-words whitespace-pre-wrap">{packagedText(entry.text, query, emoji, 't')}</p>
            )}
          </>
        )}
        <p className="text-right text-[11px] text-muted">{entry.kind === 'message' && entry.edited ? `Editada ${time}` : time}</p>
      </div>
    </div>
  )
}
