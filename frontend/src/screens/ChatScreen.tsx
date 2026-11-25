import { ArrowLeft, Moon, Sun } from 'lucide-react'
import { useMemo } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { initials, participantColor } from '../chat/colors.ts'
import type { LocalDateTime } from '../chat/model.ts'
import { buildRows, type Row } from '../chat/rows.ts'
import { useChat } from '../chat/store.ts'
import { formatDate, summarize } from '../chat/summary.ts'
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
  return (
    <div className="flex justify-center px-6 pt-2">
      <span className="max-w-[85%] rounded-lg bg-notice px-3 py-1.5 text-center text-[12.5px] text-muted shadow-sm md:max-w-[65%]">
        {text}
      </span>
    </div>
  )
}

export function ChatScreen() {
  const { imported, self, backToSummary } = useChat()
  const { theme, toggle } = useTheme()
  const rows = useMemo(() => (imported ? buildRows(imported.parsed.entries, self) : []), [imported, self])
  if (!imported) return null

  const summary = summarize(imported)
  const { participants } = imported.parsed
  const others = participants.filter((participant) => participant !== self)
  const avatarColor = summary.isGroup ? '#8696a0' : participantColor(participants, others[0] ?? summary.title)

  const renderRow = (row: Row) => {
    if (row.kind === 'date') return <DateChip day={row.day} />
    if (row.kind === 'notice') return <NoticeRow text={row.notice.text} />
    const showAuthor = summary.isGroup && !row.outgoing
    return (
      <MessageBubble
        message={row.message}
        outgoing={row.outgoing}
        firstOfRun={row.firstOfRun}
        authorColor={showAuthor ? participantColor(participants, row.message.author) : undefined}
      />
    )
  }

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 bg-bar px-2 py-2.5 md:px-4">
        <button type="button" onClick={backToSummary} aria-label="Voltar ao resumo" className="rounded-full p-2 text-muted hover:bg-chip">
          <ArrowLeft size={20} />
        </button>
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: avatarColor }}
        >
          {initials(summary.title)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-medium">{summary.title}</h1>
          {summary.isGroup && <p className="truncate text-xs text-muted">{participants.join(', ')}</p>}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
          className="rounded-full p-2 text-muted hover:bg-chip"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="min-h-0 flex-1 bg-chat">
        <Virtuoso
          data={rows}
          computeItemKey={(_, row) => row.key}
          itemContent={(_, row) => renderRow(row)}
          components={{ Footer: () => <div className="h-3" /> }}
          className="h-full"
        />
      </div>
    </main>
  )
}
