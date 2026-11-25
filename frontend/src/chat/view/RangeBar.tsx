// The range controls under the chat header: its two ends by date and time, how much it holds, and
// the switch that shows only the range.

import { X } from 'lucide-react'
import { firstAtOrAfter, fullRange, isFull, lastAtOrBefore, withEnd, withStart } from '../range.ts'
import { useChat } from '../store.ts'

const count = (value: number, one: string, many: string) => `${value.toLocaleString('pt-BR')} ${value === 1 ? one : many}`

export function RangeBar({ onClose }: { onClose(): void }) {
  const { imported, range, onlyRange, setRange, setOnlyRange } = useChat()
  if (!imported) return null
  const { entries } = imported.parsed
  const first = entries[range.start]
  const last = entries[range.end]
  const messages = entries.slice(range.start, range.end + 1).filter((entry) => entry.kind === 'message').length

  // Only the end that was edited moves: many entries share a minute, so the other end is kept by its
  // index, not looked up again by its time. Without seconds, a typed end covers its whole minute.
  const moveStart = (at: string) => {
    const index = firstAtOrAfter(entries, at)
    if (index !== -1) setRange(withStart(range, index))
  }
  const moveEnd = (at: string) => {
    const index = lastAtOrBefore(entries, at.length === 16 ? `${at}:59` : at)
    if (index !== -1) setRange(withEnd(range, index))
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel px-4 py-2.5 text-sm">
      <span className="font-medium">Recorte</span>
      <label className="flex items-center gap-2">
        de
        <input
          type="datetime-local"
          step={1}
          value={first.at}
          min={entries[0].at}
          max={entries[entries.length - 1].at}
          onChange={(event) => event.target.value && moveStart(event.target.value)}
          className="rounded-md border border-line bg-app px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2">
        até
        <input
          type="datetime-local"
          step={1}
          value={last.at}
          min={entries[0].at}
          max={entries[entries.length - 1].at}
          onChange={(event) => event.target.value && moveEnd(event.target.value)}
          className="rounded-md border border-line bg-app px-2 py-1"
        />
      </label>
      <span className="text-muted">{count(messages, 'mensagem', 'mensagens')}</span>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={onlyRange} onChange={(event) => setOnlyRange(event.target.checked)} />
        Mostrar só o recorte
      </label>
      {!isFull(range, entries) && (
        <button type="button" onClick={() => setRange(fullRange(entries))} className="text-accent-strong">
          Conversa inteira
        </button>
      )}
      <button type="button" onClick={onClose} aria-label="Fechar o recorte" className="ml-auto rounded-full p-1 text-muted hover:bg-chip">
        <X size={18} />
      </button>
    </div>
  )
}
