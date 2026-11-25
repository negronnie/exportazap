import { useState, type DragEvent } from 'react'
import { useChat, type ImportError } from '../chat/store.ts'

const ERRORS: Record<ImportError, string> = {
  empty: 'Nenhum arquivo foi escolhido.',
  'several-zips': 'Escolha uma exportação por vez: veio mais de um .zip.',
  'no-chat-text': 'Não achamos o .txt da conversa. Escolha o .zip que o WhatsApp gerou, ou o .txt da conversa.',
  'several-chat-texts': 'Veio mais de um .txt e não deu para saber qual é a conversa. Escolha só o .txt da conversa e os anexos.',
  unreadable: 'Não foi possível ler esse arquivo. Confira se é a exportação do WhatsApp e tente de novo.',
}

export function ImportScreen() {
  const { stage, error, importFiles } = useChat()
  const [dragging, setDragging] = useState(false)
  const reading = stage === 'reading'

  const pick = (list: FileList | null) => {
    if (list && list.length > 0) void importFiles([...list])
  }
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    pick(event.dataTransfer.files)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4 py-10">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">ExportaZap</h1>
        <p className="text-muted">
          A conversa exportada do WhatsApp, legível e pronta para compartilhar em PDF, prints ou página HTML.
        </p>
      </header>

      <section
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-busy={reading}
        className={`flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed bg-panel px-6 py-10 text-center transition-colors ${
          dragging ? 'border-accent' : 'border-line'
        }`}
      >
        {reading ? (
          <p className="text-muted" role="status">
            Lendo a conversa…
          </p>
        ) : (
          <>
            <p>
              Arraste aqui o <strong>.zip</strong> que o WhatsApp gerou em “Exportar conversa”, ou o <strong>.txt</strong>{' '}
              com os arquivos dos anexos.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <label className="cursor-pointer rounded-full bg-accent px-5 py-2.5 font-medium text-on-accent hover:bg-accent-strong">
                Escolher arquivos
                <input
                  type="file"
                  accept=".zip,.txt,application/zip,text/plain,*/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => pick(event.target.files)}
                />
              </label>
              <label className="cursor-pointer rounded-full border border-line px-5 py-2.5 font-medium hover:border-accent">
                Escolher pasta
                <input
                  type="file"
                  className="sr-only"
                  ref={(input) => {
                    if (input) input.webkitdirectory = true
                  }}
                  onChange={(event) => pick(event.target.files)}
                />
              </label>
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="text-danger">
            {ERRORS[error]}
          </p>
        )}
      </section>

      <p className="text-center text-sm text-muted">
        Tudo acontece no seu aparelho: a conversa não é enviada para nenhum servidor e some quando você fecha a página.
      </p>
    </main>
  )
}
