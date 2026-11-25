// The export dialog: what goes out (the range and the redaction in force), in which format and
// theme. The formats plug in as their issues land.

import { X } from 'lucide-react'
import { useState } from 'react'
import { useChat } from '../chat/store.ts'
import { formatDate, formatTime } from '../chat/summary.ts'
import { useTheme, type Theme } from '../theme.ts'
import { FORMATS, type OutputFormat } from './formats.ts'

const count = (value: number, one: string, many: string) => `${value.toLocaleString('pt-BR')} ${value === 1 ? one : many}`

export interface ExportChoice {
  format: OutputFormat
  theme: Theme
}

interface Props {
  /** Formats ready to run; the others show as coming soon. */
  available: OutputFormat[]
  onExport(choice: ExportChoice): void
  onClose(): void
}

export function ExportDialog({ available, onExport, onClose }: Props) {
  const { imported, range, hidden, aliases, maskNumbers } = useChat()
  const current = useTheme((state) => state.theme)
  const [format, setFormat] = useState<OutputFormat>(available[0] ?? 'pdf')
  const [theme, setTheme] = useState<Theme>(current)
  if (!imported) return null

  const { entries } = imported.parsed
  const first = entries[range.start]
  const last = entries[range.end]
  const messages = entries.slice(range.start, range.end + 1).filter((entry) => entry.kind === 'message').length
  const hiddenInRange = hidden.filter((index) => index >= range.start && index <= range.end).length
  const redactions = [
    hiddenInRange > 0 && count(hiddenInRange, 'mensagem oculta', 'mensagens ocultas'),
    Object.keys(aliases).length > 0 && count(Object.keys(aliases).length, 'apelido', 'apelidos'),
    maskNumbers && 'números mascarados',
  ].filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-lg space-y-5 overflow-y-auto rounded-t-2xl bg-panel p-5 md:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="export-title" className="text-lg font-medium">
            Exportar conversa
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-1.5 text-muted hover:bg-chip">
            <X size={20} />
          </button>
        </div>

        <section className="space-y-1 rounded-xl bg-app p-3 text-sm">
          <p>
            <span className="text-muted">Recorte: </span>
            {formatDate(first.at)}, {formatTime(first.at)} a {formatDate(last.at)}, {formatTime(last.at)}
          </p>
          <p>
            <span className="text-muted">Vai sair: </span>
            {count(messages, 'mensagem', 'mensagens')}
          </p>
          <p>
            <span className="text-muted">Ocultação: </span>
            {redactions.length > 0 ? redactions.join(', ') : 'nenhuma'}
          </p>
        </section>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm text-muted">Formato</legend>
          {FORMATS.map((option) => {
            const ready = available.includes(option.id)
            return (
              <label
                key={option.id}
                className={`flex gap-3 rounded-xl border p-3 ${format === option.id ? 'border-accent' : 'border-line'} ${ready ? 'cursor-pointer' : 'opacity-50'}`}
              >
                <input type="radio" name="format" disabled={!ready} checked={format === option.id} onChange={() => setFormat(option.id)} />
                <span>
                  <span className="block font-medium">
                    {option.label}
                    {!ready && <span className="ml-2 text-xs font-normal text-muted">em breve</span>}
                  </span>
                  <span className="block text-sm text-muted">{option.description}</span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <fieldset className="flex gap-4 text-sm">
          <legend className="mb-2 text-sm text-muted">Tema</legend>
          {(['light', 'dark'] as Theme[]).map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input type="radio" name="theme" checked={theme === option} onChange={() => setTheme(option)} />
              {option === 'light' ? 'Claro' : 'Escuro'}
            </label>
          ))}
        </fieldset>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-line px-5 py-2.5 font-medium">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!available.includes(format)}
            onClick={() => onExport({ format, theme })}
            className="rounded-full bg-accent px-5 py-2.5 font-medium text-on-accent hover:bg-accent-strong disabled:opacity-50"
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  )
}
