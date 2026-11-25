// Runs an export from the dialog choice: builds the export document from the chat as it is now,
// prepares the attachments as stills and hands the result to the browser to save.

import { useState } from 'react'
import { makeRedactor } from '../chat/redaction.ts'
import { loadEmojiMap } from '../chat/emoji/emoji.tsx'
import { useChat } from '../chat/store.ts'
import type { SourceExport } from '../import/readSource.ts'
import { buildExport, type ExportDocument } from './document.ts'
import { download, outputName, zipImages } from './download.ts'
import type { ExportChoice } from './ExportDialog.tsx'
import type { OutputFormat } from './formats.ts'
import type { PdfRequest, PdfResponse } from './pdf/pdf.worker.tsx'
import { usePrintJob } from './print/printJob.ts'
import { buildPackage } from './html/buildPackage.ts'
import { captureShots } from './shots/capture.tsx'
import { prepareMedia, type StaticMedia } from './staticMedia.ts'

const AVAILABLE: OutputFormat[] = ['pdf', 'print', 'screenshots', 'strip', 'html']

async function collectMedia(
  document: ExportDocument,
  source: SourceExport,
  redactText: (text: string) => string,
  progress: (done: number, total: number) => void,
): Promise<Map<number, StaticMedia>> {
  const pending = document.entries.filter((entry) => entry.kind === 'message' && entry.attachment?.present)
  const media = new Map<number, StaticMedia>()
  // One at a time: a long range can hold hundreds of photos, and each is decoded in memory.
  for (const [done, entry] of pending.entries()) {
    progress(done, pending.length)
    if (entry.kind === 'message' && entry.attachment) media.set(entry.index, await prepareMedia(source, entry.attachment, redactText))
  }
  return media
}

function renderPdf(document: ExportDocument, media: Map<number, StaticMedia>): Promise<Blob> {
  const worker = new Worker(new URL('./pdf/pdf.worker.tsx', import.meta.url), { type: 'module' })
  return new Promise<Blob>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<PdfResponse>) => {
      if (event.data.ok) resolve(event.data.blob)
      else reject(new Error(event.data.message))
    }
    worker.onerror = (event) => reject(new Error(`${event.message} (${event.filename}:${event.lineno})`))
    worker.postMessage({ document, media: [...media], origin: location.origin } satisfies PdfRequest)
  }).finally(() => worker.terminate())
}

export function useExport() {
  const [status, setStatus] = useState<string | null>(null)

  async function run({ format, theme }: ExportChoice) {
    const { imported, self, range, hidden, aliases, maskNumbers } = useChat.getState()
    if (!imported) return
    const settings = { aliases, maskNumbers }
    try {
      setStatus('Preparando a exportação…')
      const document = buildExport({
        imported,
        self,
        range,
        hidden,
        settings,
        fingerprint: await imported.fingerprint,
        theme,
        generatedAt: new Date(),
      })
      if (format === 'html') {
        // The package carries the attachments themselves, so no stills are needed.
        const viewer = await fetch('/viewer/viewer.html')
        if (!viewer.ok) throw new Error('ExportaZap: viewer page missing')
        const base = outputName(document.title, document.first, 'zip').replace(/.zip$/, '')
        const zip = await buildPackage({
          document,
          source: imported.source,
          settings,
          template: await viewer.text(),
          emojiMap: await loadEmojiMap(),
          emojiImage: (image) => fetch(`/emoji/${image}.png`).then((response) => response.blob()),
          folder: base,
          progress: (done, total) => setStatus(`Montando o pacote: ${done + 1} de ${total} arquivos`),
        })
        download(zip, `${base}.zip`)
        setStatus(null)
        return
      }
      const redactor = makeRedactor(settings)
      const media = await collectMedia(document, imported.source, redactor.text, (done, total) =>
        setStatus(`Preparando os anexos: ${done} de ${total}`),
      )
      if (format === 'pdf') {
        setStatus('Gerando o PDF…')
        download(await renderPdf(document, media), outputName(document.title, document.first, 'pdf'))
      } else if (format === 'print') {
        usePrintJob.getState().start({ document, media })
      } else if (format === 'screenshots' || format === 'strip') {
        const images = await captureShots(document, media, await loadEmojiMap(), format === 'screenshots' ? 'screens' : 'strip', (done, total) =>
          setStatus(`Gerando as imagens: ${done + 1} de ${total}`),
        )
        const base = outputName(document.title, document.first, 'png').replace(/.png$/, '')
        // The screenshots always go in a zip; the strip is one PNG unless it had to be split (ADR 0003).
        if (format === 'strip' && images.length === 1) download(images[0], `${base}.png`)
        else download(await zipImages(images, base), `${base}.zip`)
        if (format === 'strip' && images.length > 1) {
          setStatus(`A tripa saiu em ${images.length} partes: numa imagem só, ela ficaria grande demais para os navegadores.`)
          setTimeout(() => setStatus(null), 6000)
          return
        }
      }
      setStatus(null)
    } catch (error) {
      console.error('ExportaZap: export failed', error)
      setStatus('Não foi possível gerar a exportação. Tente de novo.')
      setTimeout(() => setStatus(null), 5000)
    }
  }

  return { available: AVAILABLE, status, run }
}
