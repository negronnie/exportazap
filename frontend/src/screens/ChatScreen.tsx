import { ArrowLeft, CalendarDays, Download, EyeOff, Moon, Scissors, Search, Sun } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { participantColor } from '../chat/colors.ts'
import { useEmojiMap, withEmoji } from '../chat/emoji/emoji.tsx'
import type { LocalDateTime } from '../chat/model.ts'
import { inRange, isFull } from '../chat/range.ts'
import { buildRows, rowEntry, type Row } from '../chat/rows.ts'
import { useChat, useDisplayName, useRedactor } from '../chat/store.ts'
import { formatDate, summarize } from '../chat/summary.ts'
import { Avatar } from '../chat/view/Avatar.tsx'
import { DatePicker } from '../chat/view/DatePicker.tsx'
import { InfoPanel } from '../chat/view/InfoPanel.tsx'
import { Lightbox } from '../chat/view/Lightbox.tsx'
import { MessageBubble } from '../chat/view/MessageBubble.tsx'
import { RangeBar } from '../chat/view/RangeBar.tsx'
import { RedactionBar } from '../chat/view/RedactionBar.tsx'
import { SearchBar } from '../chat/view/SearchBar.tsx'
import { ExportDialog } from '../export/ExportDialog.tsx'
import { useExport } from '../export/useExport.ts'
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
  const redactor = useRedactor()
  return (
    <div className="flex justify-center px-6 pt-2">
      <span className="max-w-[85%] rounded-lg bg-notice px-3 py-1.5 text-center text-[12.5px] text-muted shadow-sm md:max-w-[65%]">
        {withEmoji(redactor.text(text), emoji, 'n')}
      </span>
    </div>
  )
}

export function ChatScreen() {
  const { imported, self, avatars, focus, range, onlyRange, hidden, maskNumbers, aliases, backToSummary, jumpTo, startRangeAt, endRangeAt, toggleHidden } =
    useChat()
  const display = useDisplayName()
  const { theme, toggle } = useTheme()
  const [infoOpen, setInfoOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [pickingDate, setPickingDate] = useState(false)
  const [rangeOpen, setRangeOpen] = useState(false)
  const [redactionOpen, setRedactionOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const exporter = useExport()
  // The flash fades two seconds after each jump: the jump whose flash is over is remembered here.
  const [faded, setFaded] = useState(0)
  const list = useRef<VirtuosoHandle>(null)
  // The rows change with the range only while the list shows just the range.
  const shownStart = onlyRange ? range.start : null
  const shownEnd = onlyRange ? range.end : null
  const rows = useMemo(() => {
    if (!imported) return []
    const { entries } = imported.parsed
    return buildRows(shownStart === null || shownEnd === null ? entries : entries.slice(shownStart, shownEnd + 1), self)
  }, [imported, self, shownStart, shownEnd])

  // Jumps from the gallery, the search and the calendar land on the message and flash it. Each jump
  // scrolls once: rows rebuilt later must not pull the list back to an old jump.
  const scrolledJump = useRef(0)
  useEffect(() => {
    if (!focus || focus.nonce === scrolledJump.current) return
    const index = rows.findIndex((row) => row.kind !== 'date' && rowEntry(row) === focus.index)
    if (index === -1) return
    scrolledJump.current = focus.nonce
    list.current?.scrollToIndex({ index, align: 'center' })
  }, [focus, rows])

  useEffect(() => {
    if (!focus) return
    const timer = setTimeout(() => setFaded(focus.nonce), 2000)
    return () => clearTimeout(timer)
  }, [focus])

  if (!imported) return null

  const highlighted = focus && focus.nonce !== faded ? focus.index : null
  const summary = summarize(imported)
  const { participants } = imported.parsed
  const partner = summary.isGroup ? null : (participants.find((participant) => participant !== self) ?? null)
  const title = partner ? display(partner) : summary.title

  const fullChat = isFull(range, imported.parsed.entries)
  const redacting = hidden.length > 0 || maskNumbers || Object.keys(aliases).length > 0

  // Outside a partial range the chat fades, so the range stands out.
  const renderRow = (row: Row) => (
    <div className={fullChat || inRange(range, rowEntry(row)) ? '' : 'opacity-40'}>{renderContent(row)}</div>
  )

  const renderContent = (row: Row) => {
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
          query={searching ? query : ''}
          hidden={hidden.includes(row.message.index)}
          menu={[
            { label: 'Começar o recorte aqui', run: () => startRangeAt(row.message.index) },
            { label: 'Terminar o recorte aqui', run: () => endRangeAt(row.message.index) },
            {
              label: hidden.includes(row.message.index) ? 'Voltar a mostrar nas exportações' : 'Ocultar nas exportações',
              run: () => toggleHidden(row.message.index),
            },
          ]}
        />
      </div>
    )
  }

  const closeSearch = () => {
    setSearching(false)
    setQuery('')
  }

  return (
    <main className="flex h-dvh flex-col">
      {searching ? (
        <SearchBar onQuery={setQuery} onClose={closeSearch} />
      ) : (
        <header className="relative flex items-center gap-1 bg-bar px-2 py-2 md:px-4">
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
            onClick={() => setRangeOpen((open) => !open)}
            aria-label="Recorte"
            title="Recorte"
            aria-pressed={rangeOpen}
            className={`rounded-full p-2 hover:bg-chip ${fullChat ? 'text-muted' : 'text-accent-strong'}`}
          >
            <Scissors size={20} />
          </button>
          <button
            type="button"
            onClick={() => setRedactionOpen((open) => !open)}
            aria-label="Ocultação"
            title="Ocultação"
            aria-pressed={redactionOpen}
            className={`rounded-full p-2 hover:bg-chip ${redacting ? 'text-accent-strong' : 'text-muted'}`}
          >
            <EyeOff size={20} />
          </button>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-strong"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button type="button" onClick={() => setSearching(true)} aria-label="Buscar na conversa" className="rounded-full p-2 text-muted hover:bg-chip">
            <Search size={20} />
          </button>
          <button
            type="button"
            onClick={() => setPickingDate((open) => !open)}
            aria-label="Ir para uma data"
            aria-expanded={pickingDate}
            className="rounded-full p-2 text-muted hover:bg-chip"
          >
            <CalendarDays size={20} />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            className="rounded-full p-2 text-muted hover:bg-chip"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {pickingDate && <DatePicker entries={imported.parsed.entries} onPick={jumpTo} onClose={() => setPickingDate(false)} />}
        </header>
      )}
      {rangeOpen && <RangeBar onClose={() => setRangeOpen(false)} />}
      {redactionOpen && <RedactionBar onClose={() => setRedactionOpen(false)} />}

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
      {exportOpen && (
        <ExportDialog
          available={exporter.available}
          onExport={(choice) => {
            setExportOpen(false)
            void exporter.run(choice)
          }}
          onClose={() => setExportOpen(false)}
        />
      )}
      {exporter.status && (
        <div role="status" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-panel px-4 py-2 text-sm shadow-xl">
          {exporter.status}
        </div>
      )}
    </main>
  )
}
