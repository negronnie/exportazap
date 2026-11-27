import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { search, searchIndex } from '../search.ts'
import { useChat } from '../store.ts'

interface Props {
  /** The query the bubbles mark, updated as the person types. */
  onQuery(query: string): void
  onClose(): void
}

/** Search bar in place of the chat header; Enter goes to the next match, Shift+Enter to the previous. */
export function SearchBar({ onQuery, onClose }: Props) {
  const { imported, jumpTo } = useChat()
  const index = useMemo(() => (imported ? searchIndex(imported.parsed.entries) : []), [imported])
  const [query, setQuery] = useState('')
  const [settled, setSettled] = useState('')
  const [current, setCurrent] = useState(0)

  // Searching 40 thousand messages on every key is wasteful: wait for a pause in the typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(query)
      setCurrent(0)
      onQuery(query)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, onQuery])

  const results = useMemo(() => search(index, settled), [index, settled])

  // The newest match comes first, as in WhatsApp, so the count reads from the end of the chat.
  useEffect(() => {
    if (results.length > 0) jumpTo(results[results.length - 1 - current])
  }, [results, current, jumpTo])

  const move = (step: number) => {
    if (results.length === 0) return
    setCurrent((value) => (value + step + results.length) % results.length)
  }

  return (
    <div className="flex items-center gap-1 bg-bar px-2 py-2 @3xl:px-4">
      <button type="button" onClick={onClose} aria-label="Fechar busca" className="rounded-full p-2 text-muted hover:bg-chip">
        <ArrowLeft size={20} />
      </button>
      <input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') move(event.shiftKey ? -1 : 1)
          if (event.key === 'Escape') onClose()
        }}
        placeholder="Buscar na conversa"
        aria-label="Buscar na conversa"
        className="min-w-0 flex-1 rounded-md bg-panel px-3 py-2 outline-none"
      />
      <span className="w-20 text-center text-sm text-muted" aria-live="polite">
        {settled.trim().length >= 2 && (results.length > 0 ? `${current + 1} de ${results.length}` : 'nada')}
      </span>
      <button type="button" onClick={() => move(1)} aria-label="Resultado anterior" disabled={results.length === 0} className="rounded-full p-2 text-muted hover:bg-chip disabled:opacity-40">
        <ChevronUp size={20} />
      </button>
      <button type="button" onClick={() => move(-1)} aria-label="Próximo resultado" disabled={results.length === 0} className="rounded-full p-2 text-muted hover:bg-chip disabled:opacity-40">
        <ChevronDown size={20} />
      </button>
    </div>
  )
}
