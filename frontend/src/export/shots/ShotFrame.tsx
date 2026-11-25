// One screenshot, or one part of the strip, at phone width in CSS pixels.

import type { ReactNode } from 'react'
import { initials } from '../../chat/colors.ts'
import type { ExportDocument } from '../document.ts'
import { MARK_SHORT } from '../formats.ts'

/** CSS pixels; captured at three times the size, 1080 × 2340 (ADR 0003). */
export const WIDTH = 360
export const SCREEN_HEIGHT = 780

function Header({ document: doc }: { document: ExportDocument }) {
  return (
    <div data-shot-header className="flex items-center gap-3 bg-bar px-3 py-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#8696a0] text-xs font-semibold text-white">
        {initials(doc.title)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium">{doc.title}</span>
        {doc.isGroup && <span className="block truncate text-[11px] text-muted">{doc.participants.map((p) => p.name).join(', ')}</span>}
      </span>
    </div>
  )
}

export function ShotFrame({ document: doc, header, rows, minHeight }: { document: ExportDocument; header: boolean; rows: ReactNode[]; minHeight?: number }) {
  return (
    <div className={`theme-${doc.theme} flex flex-col bg-chat font-sans text-text`} style={{ width: WIDTH, minHeight }}>
      {header && <Header document={doc} />}
      <div className="bg-wallpaper flex-1 py-1">
        {rows.map((row, i) => (
          <div key={i} data-row>
            {row}
          </div>
        ))}
      </div>
      <p data-shot-footer className="bg-chat py-1.5 text-center text-[9px] text-muted">
        {MARK_SHORT}
      </p>
    </div>
  )
}

