// The PDF through the browser's print (ADR 0002): the range is laid out apart from the app, only
// for print, and the print dialog opens once its pictures have loaded. "Save as PDF" does the rest.

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CoverSheet, MarkFooter, StaticChat } from '../static/StaticChat.tsx'
import { usePrintJob } from './printJob.ts'

function picturesLoaded(root: HTMLElement): Promise<void> {
  const pending = [...root.querySelectorAll('img')].filter((image) => !image.complete)
  return Promise.all(pending.map((image) => new Promise<void>((resolve) => image.addEventListener('load', () => resolve(), { once: true })))).then(
    () => {},
  )
}

export function PrintView() {
  const { job, finish } = usePrintJob()
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!job || !root.current) return
    const html = document.documentElement
    const previousTheme = html.dataset.theme
    // The chosen theme rules the printout, then the screen goes back to its own.
    html.dataset.theme = job.document.theme
    const done = () => {
      if (previousTheme) html.dataset.theme = previousTheme
      finish()
    }
    window.addEventListener('afterprint', done, { once: true })
    let cancelled = false
    void picturesLoaded(root.current).then(() => {
      if (!cancelled) window.print()
    })
    return () => {
      cancelled = true
      window.removeEventListener('afterprint', done)
    }
  }, [job, finish])

  if (!job) return null
  return createPortal(
    <div id="print-root" ref={root} className="text-text">
      <CoverSheet document={job.document} />
      <div className="bg-chat">
        <StaticChat document={job.document} media={job.media} />
      </div>
      <div className="print-footer">
        <MarkFooter />
      </div>
    </div>,
    document.body,
  )
}
