import { create } from 'zustand'
import type { ExportDocument } from '../document.ts'
import type { StaticMedia } from '../staticMedia.ts'

export interface PrintJob {
  document: ExportDocument
  media: Map<number, StaticMedia>
}

interface PrintState {
  job: PrintJob | null
  start(job: PrintJob): void
  finish(): void
}

/** The range waiting to be printed: PrintView lays it out and opens the print dialog. */
export const usePrintJob = create<PrintState>()((set) => ({
  job: null,
  start: (job) => set({ job }),
  finish: () => set({ job: null }),
}))
