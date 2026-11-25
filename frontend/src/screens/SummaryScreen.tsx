import { useEffect, useMemo, useState } from 'react'
import type { DateOrder } from '../chat/model.ts'
import { useChat } from '../chat/store.ts'
import { formatDate, summarize } from '../chat/summary.ts'
import { parseExport } from '../import/parseExport.ts'

const plural = (count: number, one: string, many: string) => `${count.toLocaleString('pt-BR')} ${count === 1 ? one : many}`

function DateOrderQuestion() {
  const { imported, asksDateOrder, confirmDateOrder } = useChat()
  // Both readings of the first date, so the person can tell which one is right.
  const readings = useMemo(() => {
    if (!imported) return []
    return (['dmy', 'mdy'] as DateOrder[]).map((order) => {
      const first = parseExport(imported.source.text, { dateOrder: order }).entries[0]
      return { order, label: first ? formatDate(first.at) : '' }
    })
  }, [imported])
  if (!imported || !asksDateOrder) return null

  return (
    <fieldset className="space-y-2 rounded-xl border border-accent p-4">
      <legend className="px-1 font-medium">Quando começa a conversa?</legend>
      <p className="text-sm text-muted">
        As datas dessa exportação servem tanto como dia/mês quanto como mês/dia. Escolha a data certa da primeira mensagem.
      </p>
      {readings.map(({ order, label }) => (
        <label key={order} className="flex items-center gap-2">
          <input
            type="radio"
            name="date-order"
            checked={!imported.parsed.dateOrderAmbiguous && imported.parsed.format.dateOrder === order}
            onChange={() => confirmDateOrder(order)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  )
}

export function SummaryScreen() {
  const { imported, self, setSelf, openChat, reset } = useChat()
  const [hash, setHash] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    void imported?.fingerprint.then((value) => current && setHash(value))
    return () => {
      current = false
    }
  }, [imported])

  if (!imported) return null
  const summary = summarize(imported)
  const { participants } = imported.parsed

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted">{summary.isGroup ? 'Grupo' : 'Conversa'}</p>
        <h1 className="text-2xl font-semibold break-words">{summary.title}</h1>
        {summary.first && summary.last && (
          <p className="text-muted">
            De {formatDate(summary.first)} a {formatDate(summary.last)}
          </p>
        )}
      </header>

      <dl className="grid grid-cols-3 gap-3 text-center">
        {[
          [plural(summary.messages, 'mensagem', 'mensagens'), 'na conversa'],
          [plural(summary.attachments, 'anexo', 'anexos'), 'citados'],
          [plural(participants.length, 'participante', 'participantes'), 'escreveram'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl bg-panel p-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {summary.missing > 0 && (
        <p className="rounded-xl bg-panel p-4 text-sm">
          {plural(summary.missing, 'anexo não veio', 'anexos não vieram')} na exportação. No lugar deles vai aparecer “mídia
          não incluída”.
        </p>
      )}

      <DateOrderQuestion />

      <fieldset className="space-y-2 rounded-xl bg-panel p-4">
        <legend className="sr-only">Quem é você</legend>
        <p className="font-medium">Quem é você nessa conversa?</p>
        <p className="text-sm text-muted">Suas mensagens ficam à direita, como no WhatsApp.</p>
        {participants.map((participant) => (
          <label key={participant} className="flex items-center gap-2">
            <input type="radio" name="self" checked={self === participant} onChange={() => setSelf(participant)} />
            <span className="break-all">{participant}</span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!self || imported.parsed.dateOrderAmbiguous}
          onClick={openChat}
          className="rounded-full bg-accent px-5 py-2.5 font-medium text-on-accent hover:bg-accent-strong disabled:opacity-50"
        >
          Abrir conversa
        </button>
        <button type="button" onClick={() => void reset()} className="rounded-full border border-line px-5 py-2.5 font-medium">
          Escolher outra
        </button>
      </div>

      <p className="text-xs break-all text-muted">
        Hash SHA-256 da exportação: {hash ?? 'calculando…'}
      </p>
    </main>
  )
}
