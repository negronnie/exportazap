import { Ban, BarChart3, MapPin, Paperclip } from 'lucide-react'
import type { ReactNode } from 'react'
import { isEmojiOnly, useEmojiMap, withEmoji, type EmojiMap } from '../emoji/emoji.tsx'
import type { AttachmentKind, Message } from '../model.ts'
import { formatTime } from '../summary.ts'

const KIND_LABELS: Record<AttachmentKind, string> = {
  image: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
  voice: 'Mensagem de voz',
  sticker: 'Figurinha',
  gif: 'GIF',
  document: 'Documento',
  contact: 'Contato',
  unknown: 'Mídia',
}

const URL_PATTERN = /(https?:\/\/[^\s<>]+[^\s<>.,;:!?)\]'"])/g

/** Message text with its links clickable and its emoji drawn with the bundled images. */
function richText(text: string, emoji: EmojiMap | null): ReactNode[] {
  const large = isEmojiOnly(text)
  return text.split(URL_PATTERN).flatMap((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-link underline">
        {part}
      </a>
    ) : (
      withEmoji(part, emoji, String(i), large)
    ),
  )
}

/** Stand-in until the attachments get their own rendering (issue #15). */
function AttachmentChip({ message }: { message: Message }) {
  const attachment = message.attachment!
  const name = attachment.displayName ?? attachment.fileName
  return (
    <div className="mb-1 flex items-center gap-2 rounded-md bg-chip px-2 py-1.5 text-sm">
      <Paperclip size={16} className="shrink-0 text-muted" aria-hidden />
      <span className="min-w-0">
        <span className="block font-medium">{KIND_LABELS[attachment.kind]}</span>
        <span className="block truncate text-xs text-muted">{name ?? 'mídia não incluída'}</span>
      </span>
    </div>
  )
}

function Poll({ message }: { message: Message }) {
  const poll = message.poll!
  return (
    <div className="mb-1 space-y-1">
      <p className="flex items-center gap-1.5 font-medium">
        <BarChart3 size={16} className="text-muted" aria-hidden />
        {poll.question}
      </p>
      <ul className="space-y-0.5 text-sm">
        {poll.options.map((option) => (
          <li key={option.text} className="flex justify-between gap-4">
            <span>{option.text}</span>
            <span className="text-muted">
              {option.votes} {option.votes === 1 ? 'voto' : 'votos'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Tail({ outgoing }: { outgoing: boolean }) {
  return (
    <svg
      viewBox="0 0 8 13"
      width="8"
      height="13"
      aria-hidden
      className={`absolute top-0 ${outgoing ? '-right-2 text-bubble-out' : '-left-2 -scale-x-100 text-bubble-in'}`}
    >
      <path d="M0 0h8L1 8.5C0.3 9.4 0 9 0 8z" fill="currentColor" />
    </svg>
  )
}

interface Props {
  message: Message
  outgoing: boolean
  firstOfRun: boolean
  /** Shown above the text in groups, on the first incoming message of a run. */
  authorColor?: string
}

export function MessageBubble({ message, outgoing, firstOfRun, authorColor }: Props) {
  const time = formatTime(message.at)
  const emoji = useEmojiMap()
  return (
    <div className={`flex px-3 md:px-[6%] ${outgoing ? 'justify-end' : 'justify-start'} ${firstOfRun ? 'pt-2' : 'pt-0.5'}`}>
      <div
        className={`relative max-w-[85%] rounded-lg px-2 pt-1.5 pb-2 text-[14.2px] leading-[19px] shadow-sm md:max-w-[65%] ${
          outgoing ? 'bg-bubble-out' : 'bg-bubble-in'
        } ${firstOfRun ? (outgoing ? 'rounded-tr-none' : 'rounded-tl-none') : ''}`}
      >
        {firstOfRun && <Tail outgoing={outgoing} />}
        {authorColor && firstOfRun && (
          <p className="mb-0.5 truncate text-[12.8px] font-medium" style={{ color: authorColor }}>
            {withEmoji(message.author, emoji, "a")}
          </p>
        )}
        {message.attachment && <AttachmentChip message={message} />}
        {message.poll && <Poll message={message} />}
        {message.location && (
          <a href={message.location.url} target="_blank" rel="noopener noreferrer" className="mb-1 flex items-center gap-1.5 underline">
            <MapPin size={16} aria-hidden />
            Localização
          </a>
        )}
        {message.deleted ? (
          <p className="flex items-center gap-1.5 text-muted italic">
            <Ban size={14} aria-hidden />
            Mensagem apagada
            <span className="inline-block w-10" />
          </p>
        ) : !message.text ? (
          // Attachment, poll or location alone: just room for the time.
          <div className="h-3" />
        ) : (
          <p className="break-words whitespace-pre-wrap">
            {richText(message.text, emoji)}
            {/* Room for the time, which sits in the bottom corner. */}
            <span className={`inline-block ${message.edited ? 'w-24' : 'w-12'}`} />
          </p>
        )}
        <span className="absolute right-2 bottom-1 text-[11px] text-muted">
          {message.edited && 'Editada '}
          {time}
        </span>
      </div>
    </div>
  )
}
