// Screenshots and the strip (ADR 0003): the static chat is laid out off screen at phone width,
// measured, split into whole rows and captured as PNG at three times the size (1080 px wide).

import { domToBlob } from 'modern-screenshot'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import type { EmojiMap } from '../../chat/emoji/emoji.tsx'
import type { ExportDocument } from '../document.ts'
import { staticRows } from '../static/staticRows.tsx'
import type { StaticMedia } from '../staticMedia.ts'
import { paginate } from './paginate.ts'
import { SCREEN_HEIGHT, ShotFrame } from './ShotFrame.tsx'

/** Three times the CSS pixels: 1080 × 2340 (ADR 0003). */
const SCALE = 3
/** 15 000 px tall at scale 3: above it, Safari on the iPhone cannot hold the image. */
const STRIP_PART_HEIGHT = 5000

export type ShotMode = 'screens' | 'strip'

function picturesLoaded(root: HTMLElement): Promise<void> {
  const pending = [...root.querySelectorAll('img')].filter((image) => !image.complete)
  return Promise.all(pending.map((image) => new Promise((resolve) => image.addEventListener('load', resolve, { once: true })))).then(() => {})
}

export async function captureShots(
  doc: ExportDocument,
  media: Map<number, StaticMedia>,
  emoji: EmojiMap,
  mode: ShotMode,
  progress: (done: number, total: number) => void,
): Promise<Blob[]> {
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;top:0;left:-20000px;'
  document.body.append(host)
  const root = createRoot(host)
  try {
    const rows = staticRows(doc, media, emoji)
    // Date chips are keyed `d<day>`: they travel with the messages after them.
    const sticky = rows.map((row) => typeof row === 'object' && row !== null && 'key' in row && String(row.key).startsWith('d'))

    flushSync(() => root.render(<ShotFrame document={doc} header rows={rows} />))
    await picturesLoaded(host)
    const header = host.querySelector<HTMLElement>('[data-shot-header]')!.offsetHeight
    const footer = host.querySelector<HTMLElement>('[data-shot-footer]')!.offsetHeight
    const measured = [...host.querySelectorAll<HTMLElement>('[data-row]')].map((element, i) => ({ height: element.offsetHeight, sticky: sticky[i] }))

    const pages =
      mode === 'screens'
        ? paginate(measured, SCREEN_HEIGHT - header - footer)
        : paginate(measured, STRIP_PART_HEIGHT - footer, STRIP_PART_HEIGHT - header - footer)

    const blobs: Blob[] = []
    for (const [i, page] of pages.entries()) {
      progress(i, pages.length)
      flushSync(() =>
        root.render(
          <ShotFrame
            document={doc}
            // The strip carries the header once, at the top of its first part.
            header={mode === 'screens' || i === 0}
            rows={page.map((index) => rows[index])}
            minHeight={mode === 'screens' ? SCREEN_HEIGHT : undefined}
          />,
        ),
      )
      await picturesLoaded(host)
      blobs.push(await domToBlob(host.firstElementChild as HTMLElement, { scale: SCALE, type: 'image/png' }))
    }
    return blobs
  } finally {
    root.unmount()
    host.remove()
  }
}
