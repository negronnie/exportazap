// The redaction controls under the chat header: the number mask, the hidden messages and a pointer
// to the aliases, which are set per participant in the contact and group info.

import { X } from 'lucide-react'
import { useChat } from '../store.ts'

const count = (value: number, one: string, many: string) => `${value.toLocaleString('pt-BR')} ${value === 1 ? one : many}`

export function RedactionBar({ onClose }: { onClose(): void }) {
  const { maskNumbers, hidden, aliases, setMaskNumbers, showAllHidden } = useChat()
  const aliasCount = Object.keys(aliases).length

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel px-4 py-2.5 text-sm">
      <span className="font-medium">Ocultação</span>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={maskNumbers} onChange={(event) => setMaskNumbers(event.target.checked)} />
        Mascarar números de telefone
      </label>
      <span className="text-muted">
        {hidden.length > 0 ? count(hidden.length, 'mensagem oculta', 'mensagens ocultas') : 'Nenhuma mensagem oculta'}
        {' · '}
        {aliasCount > 0 ? count(aliasCount, 'apelido', 'apelidos') : 'nenhum apelido'}
      </span>
      {hidden.length > 0 && (
        <button type="button" onClick={showAllHidden} className="text-accent-strong">
          Mostrar todas de novo
        </button>
      )}
      <span className="text-xs text-muted">
        Para ocultar uma mensagem, use o menu dela. Os apelidos ficam nos dados de cada participante.
      </span>
      <button type="button" onClick={onClose} aria-label="Fechar a ocultação" className="ml-auto rounded-full p-1 text-muted hover:bg-chip">
        <X size={18} />
      </button>
    </div>
  )
}
