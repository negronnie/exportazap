// An attachment inside its bubble. Every one shows the name of its source file (ADR 0005).

import { Download, FileText, ImageOff, MapPin, Play, UserRound } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { SourceExport } from '../../import/readSource.ts'
import { isVisualMedia, useMedia } from '../media.ts'
import type { AttachmentKind, Location, Message } from '../model.ts'
import { useChat, useRedactor } from '../store.ts'
import { parseVCard, type ContactCard } from '../vcard.ts'
import { useLightbox } from './lightbox.ts'
import { VoicePlayer } from './VoicePlayer.tsx'

const MISSING_LABELS: Record<AttachmentKind, string> = {
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

// File names can carry names and numbers (`Ana Souza.vcf`), so they are redacted like any text.
function FileName({ name }: { name: string | null }) {
  const redactor = useRedactor()
  if (!name) return null
  return <p className="mt-0.5 truncate px-1 text-[11px] text-muted">{redactor.text(name)}</p>
}

function Card({ icon, title, detail, action }: { icon: ReactNode; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-chip px-3 py-2.5">
      <span className="shrink-0 text-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {detail && <span className="block truncate text-xs text-muted">{detail}</span>}
      </span>
      {action}
    </div>
  )
}

function size(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

function ContactView({ url, fileName }: { url: string; fileName: string }) {
  const redactor = useRedactor()
  const [card, setCard] = useState<ContactCard | null>(null)
  useEffect(() => {
    let current = true
    void fetch(url)
      .then((response) => response.text())
      .then((text) => current && setCard(parseVCard(text)))
    return () => {
      current = false
    }
  }, [url])
  return (
    <Card
      icon={<UserRound size={28} />}
      title={redactor.text(card?.name || fileName.replace(/\.vcf$/i, ''))}
      detail={card ? redactor.text(card.phones.join(' · ')) : undefined}
    />
  )
}

export function LocationView({ location }: { location: Location }) {
  return (
    <Card
      icon={<MapPin size={26} />}
      title="Localização"
      detail={`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
      action={
        <a href={location.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm text-link underline">
          Abrir no mapa
        </a>
      }
    />
  )
}

function Present({ message, source, url }: { message: Message; source: SourceExport; url: string }) {
  const openLightbox = useLightbox((state) => state.open)
  const redactor = useRedactor()
  const attachment = message.attachment!
  const fileName = attachment.fileName!
  switch (attachment.kind) {
    case 'image':
      return (
        <button type="button" onClick={() => openLightbox({ url, kind: 'image', fileName })} className="block">
          <img src={url} alt="" className="max-h-80 w-auto max-w-full rounded-md object-cover @3xl:max-w-80" />
        </button>
      )
    case 'video':
      return (
        <button type="button" onClick={() => openLightbox({ url, kind: 'video', fileName })} className="relative block">
          {/* #t=0.1 makes browsers paint the first frame as the thumbnail. */}
          <video src={`${url}#t=0.1`} preload="metadata" muted playsInline className="max-h-80 max-w-full rounded-md @3xl:max-w-80" />
          <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-black/50 text-white">
            <Play size={24} />
          </span>
        </button>
      )
    case 'gif':
      return <video src={url} autoPlay loop muted playsInline className="max-h-80 max-w-full rounded-md @3xl:max-w-80" />
    case 'sticker':
      return <img src={url} alt="" className="size-36 object-contain" />
    case 'audio':
    case 'voice':
      return <VoicePlayer url={url} voice={attachment.kind === 'voice'} />
    case 'contact':
      return <ContactView url={url} fileName={fileName} />
    default: {
      const name = redactor.text(attachment.displayName ?? fileName)
      const extension = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toUpperCase() : ''
      const details = [
        attachment.pages !== undefined && `${attachment.pages} ${attachment.pages === 1 ? 'página' : 'páginas'}`,
        extension,
        size(source.files.get(fileName)?.size ?? 0),
      ].filter(Boolean)
      return (
        <Card
          icon={<FileText size={28} />}
          title={name}
          detail={details.join(' · ')}
          action={
            <a href={url} download={name} aria-label={`Baixar ${name}`} className="shrink-0 rounded-full p-1.5 text-muted hover:bg-chip">
              <Download size={20} />
            </a>
          }
        />
      )
    }
  }
}

export function AttachmentView({ message }: { message: Message }) {
  const redactor = useRedactor()
  const source = useChat((state) => state.imported?.source)
  const attachment = message.attachment!
  const media = useMedia(source, attachment.fileName)

  if (media.status === 'missing' || media.status === 'error') {
    return (
      <div className="mb-1">
        <Card
          icon={<ImageOff size={24} />}
          title={MISSING_LABELS[attachment.kind]}
          detail={attachment.displayName ? redactor.text(attachment.displayName) : attachment.fileName ? undefined : 'não veio na exportação'}
        />
        <FileName name={attachment.fileName} />
      </div>
    )
  }
  if (media.status === 'loading' || !source) {
    return <div className={`mb-1 rounded-md bg-chip ${isVisualMedia(attachment.kind) ? 'h-48 w-64' : 'h-14 w-64'}`} />
  }
  return (
    <div className="mb-1">
      <Present message={message} source={source} url={media.url} />
      <FileName name={attachment.fileName} />
    </div>
  )
}
