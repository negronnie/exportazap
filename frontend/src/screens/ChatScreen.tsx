import { useChat } from '../chat/store.ts'
import { summarize } from '../chat/summary.ts'

// Placeholder until the chat screen (issue #13) lands.
export function ChatScreen() {
  const { imported, reset } = useChat()
  if (!imported) return null
  const summary = summarize(imported)

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 bg-bar px-4 py-3">
        <h1 className="flex-1 truncate font-medium">{summary.title}</h1>
        <button type="button" onClick={() => void reset()} className="text-sm text-accent-strong">
          Fechar
        </button>
      </header>
      <p className="flex flex-1 items-center justify-center bg-chat p-6 text-center text-muted">
        A tela da conversa está em construção.
      </p>
    </main>
  )
}
