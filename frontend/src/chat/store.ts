// The one chat loaded in this tab. Nothing is saved: closing or reloading the page loses it
// (ADR 0001; local persistence is issue #4).

import { create } from 'zustand'
import { guessSelf } from '../import/guessSelf.ts'
import { importExport, missingAttachments, type ImportedChat } from '../import/importExport.ts'
import { parseExport } from '../import/parseExport.ts'
import { SourceError, type SourceErrorCode } from '../import/readSource.ts'
import type { DateOrder } from './model.ts'

export type Stage = 'idle' | 'reading' | 'summary' | 'chat'

export type ImportError = SourceErrorCode | 'unreadable'

interface ChatState {
  stage: Stage
  imported: ImportedChat | null
  /** The participant whose messages go on the right; confirmed in the import summary. */
  self: string | null
  error: ImportError | null
  /** The export left day and month undecided, so the summary asks; stays true after the answer. */
  asksDateOrder: boolean
  importFiles(files: File[]): Promise<void>
  /** Re-reads the export with the date order the person confirmed. */
  confirmDateOrder(order: DateOrder): void
  setSelf(self: string | null): void
  openChat(): void
  backToSummary(): void
  reset(): Promise<void>
}

export const useChat = create<ChatState>()((set, get) => ({
  stage: 'idle',
  imported: null,
  self: null,
  error: null,
  asksDateOrder: false,

  async importFiles(files) {
    await get().imported?.source.close()
    set({ stage: 'reading', imported: null, self: null, error: null })
    try {
      const imported = await importExport(files)
      set({ stage: 'summary', imported, self: imported.self, asksDateOrder: imported.parsed.dateOrderAmbiguous })
    } catch (error) {
      set({ stage: 'idle', error: error instanceof SourceError ? error.code : 'unreadable' })
    }
  },

  confirmDateOrder(order) {
    const imported = get().imported
    if (!imported) return
    const parsed = parseExport(imported.source.text, { dateOrder: order })
    set({
      imported: {
        ...imported,
        parsed,
        missing: missingAttachments(parsed.entries, imported.source),
        self: guessSelf(imported.source.name, parsed.participants),
      },
    })
  },

  setSelf(self) {
    set({ self })
  },

  backToSummary() {
    if (get().imported) set({ stage: 'summary' })
  },

  openChat() {
    if (get().imported) set({ stage: 'chat' })
  },

  async reset() {
    await get().imported?.source.close()
    set({ stage: 'idle', imported: null, self: null, error: null, asksDateOrder: false })
  },
}))
