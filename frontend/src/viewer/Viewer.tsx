// The read-only chat of the HTML package (ADR 0004): the range, its attachments, the participants and
// a search. No editing and no exports here.

import { ArrowLeft, ChevronDown, ChevronUp, Info, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { foldQuery } from '../chat/search.ts'
import { formatDate } from '../chat/summary.ts'
import type { ExportEntry } from '../export/document.ts'
import { MARK } from '../export/formats.ts'
import { useWide } from '../layout.ts'
import type { ViewerData } from './data.ts'
import { ViewerBubble } from './ViewerBubble.tsx'

type Row = { kind: 'date'; at: string } | { kind: 'entry'; entry: ExportEntry }

const count = (value: number, one: string, many: string) => `${value.toLocaleString('pt-BR')} ${value === 1 ? one : many}`
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' })

function searchable(entry: ExportEntry): string {
  if (entry.kind === 'notice') return foldQuery(entry.text)
  if (entry.kind === 'hidden') return ''
  return foldQuery([entry.text, entry.attachment?.label ?? '', entry.poll?.question ?? ''].join('\n'))
}

/** Over the chat on a phone, closed with onClose; docked beside the phone-sized chat on a wide screen. */
function InfoPanel({ data, onClose }: { data: ViewerData; onClose?: () => void }) {
  const doc = data.document
  const byAuthor = new Map<string, number>()
  for (const entry of doc.entries) if (entry.kind !== 'notice') byAuthor.set(entry.author, (byAuthor.get(entry.author) ?? 0) + 1)
  const redactions = [
    doc.redaction.hidden > 0 && count(doc.redaction.hidden, 'mensagem ocultada', 'mensagens ocultadas'),
    doc.redaction.aliases > 0 && count(doc.redaction.aliases, 'participante renomeado', 'participantes renomeados'),
    doc.redaction.maskNumbers && 'números de telefone mascarados',
  ].filter(Boolean)
  const section = (title: string, children: ReactNode) => (
    <section className="space-y-2 bg-panel px-5 py-4">
      <h3 className="text-sm text-muted">{title}</h3>
      {children}
    </section>
  )
  return (
    <aside
      className={
        onClose
          ? 'fixed inset-0 z-40 flex flex-col bg-app shadow-xl md:left-auto md:w-[420px]'
          : 'flex h-full w-[400px] shrink-0 flex-col border-r border-line bg-app'
      }
    >
      <header className="flex h-14 shrink-0 items-center gap-3 bg-bar px-3">
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-2 text-muted hover:bg-chip">
            <X size={20} />
          </button>
        )}
        <h2 className={`font-medium ${onClose ? '' : 'px-2'}`}>{doc.isGroup ? 'Dados do grupo' : 'Dados da conversa'}</h2>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-6">
        {section(
          count(doc.participants.length, 'participante', 'participantes'),
          <ul className="space-y-2">
            {doc.participants.map((participant) => (
              <li key={participant.name} className="flex items-center gap-3">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: participant.color }} />
                <span className="min-w-0 flex-1 truncate">
                  {participant.name}
                  {participant.self && <span className="ml-2 text-xs text-muted">quem exportou</span>}
                </span>
                <span className="text-xs text-muted">{count(byAuthor.get(participant.name) ?? 0, 'mensagem', 'mensagens')}</span>
              </li>
            ))}
          </ul>,
        )}
        {section(
          'Sobre esta exportação',
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted">Recorte</dt>
              <dd>
                {dateTime.format(new Date(doc.first))} a {dateTime.format(new Date(doc.last))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Ocultação</dt>
              <dd>{redactions.length > 0 ? redactions.join('; ') : 'nenhuma'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Exportação do WhatsApp</dt>
              <dd className="break-words">{doc.sourceName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Hash SHA-256 da exportação</dt>
              <dd className="font-mono text-xs break-all">{doc.fingerprint}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Gerado em</dt>
              <dd>{dateTime.format(new Date(doc.generatedAt))}</dd>
            </div>
            <p className="pt-2 text-xs text-muted">{MARK}.</p>
          </dl>,
        )}
      </div>
    </aside>
  )
}

export function Viewer({ data }: { data: ViewerData }) {
  const doc = data.document
  const list = useRef<VirtuosoHandle>(null)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [current, setCurrent] = useState(0)
  const [infoOpen, setInfoOpen] = useState(false)
  const wide = useWide()
  const [image, setImage] = useState<string | null>(null)

  const rows = useMemo(() => {
    const result: Row[] = []
    let day = ''
    for (const entry of doc.entries) {
      if (entry.at.slice(0, 10) !== day) {
        day = entry.at.slice(0, 10)
        result.push({ kind: 'date', at: entry.at })
      }
      result.push({ kind: 'entry', entry })
    }
    return result
  }, [doc])
  const index = useMemo(() => rows.map((row) => (row.kind === 'entry' ? searchable(row.entry) : '')), [rows])
  const needle = foldQuery(query)
  const results = useMemo(
    () => (needle.length < 2 ? [] : index.flatMap((text, row) => (text.includes(needle) ? [row] : []))),
    [index, needle],
  )
  // The newest match first, as in WhatsApp.
  const target = results.length > 0 ? results[results.length - 1 - (current % results.length)] : null

  useEffect(() => {
    if (target !== null) list.current?.scrollToIndex({ index: target, align: 'center' })
  }, [target])

  const move = (step: number) => results.length > 0 && setCurrent((value) => (value + step + results.length) % results.length)

  return (
    <main className="flex h-dvh justify-center bg-app">
      {/* The chat itself: the whole screen on a phone, a phone's width on a wide screen. */}
      <div className="@container flex min-w-0 flex-1 flex-col lg:w-[412px] lg:flex-none lg:border-x lg:border-line">
        {searching ? (
          <div className="flex h-14 shrink-0 items-center gap-1 bg-bar px-2">
            <button
              type="button"
              onClick={() => {
                setSearching(false)
                setQuery('')
              }}
              aria-label="Fechar busca"
              className="rounded-full p-2 text-muted hover:bg-chip"
            >
              <ArrowLeft size={20} />
            </button>
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setCurrent(0)
              }}
              onKeyDown={(event) => event.key === 'Enter' && move(event.shiftKey ? -1 : 1)}
              placeholder="Buscar na conversa"
              aria-label="Buscar na conversa"
              className="min-w-0 flex-1 rounded-md bg-panel px-3 py-2 outline-none"
            />
            <span className="w-20 text-center text-sm text-muted">
              {needle.length >= 2 && (results.length > 0 ? `${(current % results.length) + 1} de ${results.length}` : 'nada')}
            </span>
            <button type="button" onClick={() => move(1)} aria-label="Resultado anterior" className="rounded-full p-2 text-muted hover:bg-chip">
              <ChevronUp size={20} />
            </button>
            <button type="button" onClick={() => move(-1)} aria-label="Próximo resultado" className="rounded-full p-2 text-muted hover:bg-chip">
              <ChevronDown size={20} />
            </button>
          </div>
        ) : (
          <header className="flex h-14 shrink-0 items-center gap-2 bg-bar px-3">
            <button type="button" onClick={() => setInfoOpen(true)} disabled={wide} className="min-w-0 flex-1 text-left">
              <span className="block truncate font-medium">{doc.title}</span>
              <span className="block truncate text-xs text-muted">
                {doc.isGroup ? doc.participants.map((participant) => participant.name).join(', ') : `${formatDate(doc.first)} a ${formatDate(doc.last)}`}
              </span>
            </button>
            <button type="button" onClick={() => setSearching(true)} aria-label="Buscar na conversa" className="rounded-full p-2 text-muted hover:bg-chip">
              <Search size={20} />
            </button>
            {!wide && (
              <button type="button" onClick={() => setInfoOpen(true)} aria-label="Dados da conversa" className="rounded-full p-2 text-muted hover:bg-chip">
                <Info size={20} />
              </button>
            )}
          </header>
        )}

        <div className="bg-wallpaper min-h-0 flex-1">
          <Virtuoso
            ref={list}
            data={rows}
            itemContent={(i, row) =>
              row.kind === 'date' ? (
                <div className="flex justify-center px-3 pt-3 pb-1">
                  <span className="rounded-lg bg-notice px-3 py-1 text-[12.5px] text-muted shadow-sm">{formatDate(row.at)}</span>
                </div>
              ) : (
                <ViewerBubble
                  entry={row.entry}
                  path={data.media[row.entry.index]}
                  isGroup={doc.isGroup}
                  emoji={data.emoji}
                  query={searching ? query : ''}
                  highlighted={searching && i === target}
                  onImage={setImage}
                />
              )
            }
            components={{ Footer: () => <p className="py-4 text-center text-[11px] text-muted">{MARK}</p> }}
            className="h-full"
          />
        </div>
      </div>

      {wide ? <InfoPanel data={data} /> : infoOpen && <InfoPanel data={data} onClose={() => setInfoOpen(false)} />}
      {image && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setImage(null)}>
          <img src={image} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </main>
  )
}
