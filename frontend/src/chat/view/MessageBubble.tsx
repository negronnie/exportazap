import { Ban, BarChart3, EyeOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { isEmojiOnly, useEmojiMap, withEmoji, type EmojiMap } from '../emoji/emoji.tsx'
import type { Message } from '../model.ts'
import { useChat, useRedactor } from '../store.ts'
import { findMatches } from '../search.ts'
import { formatTime } from '../summary.ts'
import { isVisualMedia } from '../media.ts'
import { AttachmentView, LocationView } from './AttachmentView.tsx'
import { MessageMenu, type MenuAction } from './MessageMenu.tsx'

const URL_PATTERN = /(https?:\/\/[^\s<>]+[^\s<>.,;:!?)\]'"])/g

/** Plain text with the search matches marked and the emoji drawn. */
function marked(text: string, query: string, emoji: EmojiMap | null, key: string, large: boolean): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  for (const [start, end] of query ? findMatches(text, query) : []) {
    nodes.push(...withEmoji(text.slice(last, start), emoji, `${key}-${last}`, large))
    nodes.push(
      <mark key={`${key}-m${start}`} className="rounded-sm bg-[#ffd279] text-[#111b21]">
        {withEmoji(text.slice(start, end), emoji, `${key}-${start}`, large)}
      </mark>,
    )
    last = end
  }
  nodes.push(...withEmoji(text.slice(last), emoji, `${key}-${last}`, large))
  return nodes
}

/** Message text with its links clickable, the search matches marked and the emoji drawn. */
function richText(text: string, emoji: EmojiMap | null, query: string): ReactNode[] {
  const large = isEmojiOnly(text)
  return text.split(URL_PATTERN).flatMap((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-link underline">
        {marked(part, query, null, String(i), false)}
      </a>
    ) : (
      marked(part, query, emoji, String(i), large)
    ),
  )
}

function Poll({ message }: { message: Message }) {
  const redactor = useRedactor()
  const poll = message.poll!
  return (
    <div className="mb-1 space-y-1">
      <p className="flex items-center gap-1.5 font-medium">
        <BarChart3 size={16} className="text-muted" aria-hidden />
        {redactor.text(poll.question)}
      </p>
      <ul className="space-y-0.5 text-sm">
        {poll.options.map((option) => (
          <li key={option.text} className="flex justify-between gap-4">
            <span>{redactor.text(option.text)}</span>
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
  /** Search query whose matches are marked in the text. */
  query?: string
  /** Actions in the menu of the bubble. */
  menu?: MenuAction[]
  /** Left out of the outputs: still readable here, faded and labeled. */
  hidden?: boolean
}

export function MessageBubble({ message, outgoing, firstOfRun, authorColor, query = '', menu, hidden = false }: Props) {
  const time = formatTime(message.at)
  const emoji = useEmojiMap()
  const redactor = useRedactor()
  const files = useChat((state) => state.imported?.source.files)
  const attachment = message.attachment
  const present = attachment?.fileName ? files?.has(attachment.fileName) === true : false
  // A sticker that came with the export floats without a bubble, as in WhatsApp.
  const sticker = attachment?.kind === 'sticker' && present
  // Images and videos without a caption carry the time over the picture.
  const timeOverMedia = attachment !== undefined && present && isVisualMedia(attachment.kind) && !message.text

  const timeLabel = (
    <>
      {message.edited && 'Editada '}
      {time}
    </>
  )

  return (
    <div className={`flex px-3 @3xl:px-[6%] ${outgoing ? 'justify-end' : 'justify-start'} ${firstOfRun ? 'pt-2' : 'pt-0.5'}`}>
      <div
        className={`group relative max-w-[85%] text-[14.2px] ${hidden ? 'opacity-50' : ''} leading-[19px] @3xl:max-w-[65%] ${
          sticker
            ? ''
            : `rounded-lg px-1.5 pt-1.5 pb-2 shadow-sm ${outgoing ? 'bg-bubble-out' : 'bg-bubble-in'} ${
                firstOfRun ? (outgoing ? 'rounded-tr-none' : 'rounded-tl-none') : ''
              }`
        }`}
      >
        {firstOfRun && !sticker && <Tail outgoing={outgoing} />}
        {menu && <MessageMenu actions={menu} outgoing={outgoing} />}
        {hidden && (
          <p className="mb-1 flex items-center gap-1 px-0.5 text-[11px] font-medium text-danger">
            <EyeOff size={12} aria-hidden />
            Oculta nas exportações
          </p>
        )}
        {authorColor && firstOfRun && (
          <p className="mb-0.5 truncate px-0.5 text-[12.8px] font-medium" style={{ color: authorColor }}>
            {withEmoji(redactor.name(message.author), emoji, 'a')}
          </p>
        )}
        {attachment && <AttachmentView message={message} />}
        {message.poll && <Poll message={message} />}
        {message.location && (
          <div className="mb-1">
            <LocationView location={message.location} />
          </div>
        )}
        {message.deleted ? (
          <p className="flex items-center gap-1.5 px-0.5 text-muted italic">
            <Ban size={14} aria-hidden />
            Mensagem apagada
            <span className="inline-block w-10" />
          </p>
        ) : message.text ? (
          <p className="px-0.5 break-words whitespace-pre-wrap">
            {richText(redactor.text(message.text), emoji, query)}
            {/* Room for the time, which sits in the bottom corner. */}
            <span className={`inline-block ${message.edited ? 'w-24' : 'w-12'}`} />
          </p>
        ) : timeOverMedia || sticker ? null : (
          <div className="h-3" />
        )}
        <span
          className={
            sticker
              ? 'float-right mt-0.5 rounded-md bg-notice px-1.5 text-[11px] text-muted shadow-sm'
              : timeOverMedia
                ? 'absolute right-3 bottom-7 text-[11px] text-white [text-shadow:0_1px_2px_rgb(0_0_0/70%)]'
                : 'absolute right-2 bottom-1 text-[11px] text-muted'
          }
        >
          {timeLabel}
        </span>
      </div>
    </div>
  )
}
