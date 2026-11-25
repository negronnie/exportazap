import { ArrowLeft, Moon, Sun } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { participantColor } from '../chat/colors.ts'
import { useEmojiMap, withEmoji } from '../chat/emoji/emoji.tsx'
import type { LocalDateTime } from '../chat/model.ts'
import { buildRows, type Row } from '../chat/rows.ts'
import { useChat, useDisplayName } from '../chat/store.ts'
import { formatDate, summarize } from '../chat/summary.ts'
import { Avatar } from '../chat/view/Avatar.tsx'
import { InfoPanel } from '../chat/view/InfoPanel.tsx'
import { Lightbox } from '../chat/view/Lightbox.tsx'
import { MessageBubble } from '../chat/view/MessageBubble.tsx'
import { useTheme } from '../theme.ts'

function DateChip({ day }: { day: LocalDateTime }) {
  return (
    <div className="flex justify-center px-3 pt-3 pb-1">
      <span className="rounded-lg bg-notice px-3 py-1 text-[12.5px] text-muted shadow-sm">{formatDate(day)}</span>
    </div>
  )
}

function NoticeRow({ text }: { text: string }) {
  const emoji = useEmojiMap()
  return (
    <div className="flex justify-center px-6 pt-2">
      <span className="max-w-[85%] rounded-lg bg-notice px-3 py-1.5 text-center text-[12.5px] text-muted shadow-sm md:max-w-[65%]">
        {withEmoji(text, emoji, 'n')}
      </span>
    </div>
  )
}

export function ChatScreen() {
  const { imported, self, avatars, focus, backToSummary } = useChat()
  const display = useDisplayName()
  const { theme, toggle } = useTheme()
  const [infoOpen, setInfoOpen] = useState(false)
  // The flash fades two seconds after each jump: the jump whose flash is over is remembered here.
  const [faded, setFaded] = useState(0)
  const list = useRef<VirtuosoHandle>(null)
  const rows = useMemo(() => (imported ? buildRows(imported.parsed.entries, self) : []), [imported, self])

  // Jumps from the gallery (and later the search) land on the message and flash it.
  useEffect(() => {
    if (!focus) return
    const index = rows.findIndex((row) => row.kind !== 'date' && (row.kind === 'notice' ? row.notice.index : row.message.index) === focus.index)
    if (index === -1) return
    list.current?.scrollToIndex({ index, align: 'center' })
    const timer = setTimeout(() => setFaded(focus.nonce), 2000)
    return () => clearTimeout(timer)
  }, [focus, rows])

  if (!imported) return null

  const highlighted = focus && focus.nonce !== faded ? focus.index : null
  const summary = summarize(imported)
  const { participants } = imported.parsed
  const partner = summary.isGroup ? null : (participants.find((participant) => participant !== self) ?? null)
  const title = partner ? display(partner) : summary.title

  const renderRow = (row: Row) => {
    if (row.kind === 'date') return <DateChip day={row.day} />
    if (row.kind === 'notice') return <NoticeRow text={row.notice.text} />
    const showAuthor = summary.isGroup && !row.outgoing
    return (
      <div className={`transition-colors duration-700 ${highlighted === row.message.index ? 'bg-accent/20' : ''}`}>
        <MessageBubble
          message={row.message}
          outgoing={row.outgoing}
          firstOfRun={row.firstOfRun}
          authorColor={showAuthor ? participantColor(participants, row.message.author) : undefined}
        />
      </div>
    )
  }

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex items-center gap-1 bg-bar px-2 py-2 md:px-4">
        <button type="button" onClick={backToSummary} aria-label="Voltar ao resumo" className="rounded-full p-2 text-muted hover:bg-chip">
          <ArrowLeft size={20} />
        </button>
        <button type="button" onClick={() => setInfoOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-0.5 text-left">
          <Avatar
            name={title}
            color={partner ? participantColor(participants, partner) : '#8696a0'}
            picture={partner ? avatars[partner] : undefined}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{title}</span>
            <span className="block truncate text-xs text-muted">
              {summary.isGroup ? participants.map(display).join(', ') : 'Dados do contato'}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
          className="rounded-full p-2 text-muted hover:bg-chip"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="bg-wallpaper min-h-0 flex-1">
        <Virtuoso
          ref={list}
          data={rows}
          computeItemKey={(_, row) => row.key}
          itemContent={(_, row) => renderRow(row)}
          components={{ Footer: () => <div className="h-3" /> }}
          className="h-full"
        />
      </div>
      {infoOpen && <InfoPanel onClose={() => setInfoOpen(false)} />}
      <Lightbox />
    </main>
  )
}
