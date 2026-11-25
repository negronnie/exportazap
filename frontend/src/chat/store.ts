// The one chat loaded in this tab. Nothing is saved: closing or reloading the page loses it
// (ADR 0001; local persistence is issue #4).

import { useMemo } from 'react'
import { create } from 'zustand'
import { guessSelf } from '../import/guessSelf.ts'
import { importExport, missingAttachments, type ImportedChat } from '../import/importExport.ts'
import { parseExport } from '../import/parseExport.ts'
import { SourceError, type SourceErrorCode } from '../import/readSource.ts'
import { releaseMedia } from './media.ts'
import type { DateOrder } from './model.ts'
import { fullRange, withEnd, withStart, type Range } from './range.ts'
import { makeRedactor, type Redactor } from './redaction.ts'

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
  /** Names given in ExportaZap to participants (Alias in CONTEXT.md), by original name. */
  aliases: Record<string, string>
  /** Pictures picked by hand for participants (the export has none), as object URLs. */
  avatars: Record<string, string>
  /** The entry the chat list should scroll to and highlight; the nonce repeats a jump to the same one. */
  focus: { index: number; nonce: number } | null
  /** What goes to the outputs; starts as the whole chat. */
  range: Range
  /** Shows only the range in the chat list. */
  onlyRange: boolean
  /** Masks phone numbers on screen and in the outputs. */
  maskNumbers: boolean
  /** Entries left out of the outputs (Hidden Message), in chat order. */
  hidden: number[]
  importFiles(files: File[]): Promise<void>
  /** Re-reads the export with the date order the person confirmed. */
  confirmDateOrder(order: DateOrder): void
  setSelf(self: string | null): void
  openChat(): void
  backToSummary(): void
  /** Empty or blank removes the alias. */
  setAlias(participant: string, alias: string): void
  setAvatar(participant: string, picture: Blob | null): void
  jumpTo(index: number): void
  setRange(range: Range): void
  startRangeAt(index: number): void
  endRangeAt(index: number): void
  setOnlyRange(only: boolean): void
  setMaskNumbers(mask: boolean): void
  toggleHidden(index: number): void
  showAllHidden(): void
  reset(): Promise<void>
}

const blankChat = {
  imported: null,
  self: null,
  error: null,
  asksDateOrder: false,
  aliases: {},
  avatars: {},
  focus: null,
  range: { start: 0, end: 0 },
  onlyRange: false,
  maskNumbers: false,
  hidden: [],
}

export const useChat = create<ChatState>()((set, get) => {
  async function release() {
    const { imported, avatars } = get()
    for (const url of Object.values(avatars)) URL.revokeObjectURL(url)
    if (imported) {
      await releaseMedia(imported.source)
      await imported.source.close()
    }
  }

  return {
    stage: 'idle',
    ...blankChat,

    async importFiles(files) {
      await release()
      set({ stage: 'reading', ...blankChat })
      try {
        const imported = await importExport(files)
        set({
          stage: 'summary',
          imported,
          self: imported.self,
          asksDateOrder: imported.parsed.dateOrderAmbiguous,
          range: fullRange(imported.parsed.entries),
        })
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
        // Re-reading the dates may move entries around: the range starts over.
        range: fullRange(parsed.entries),
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

    setAlias(participant, alias) {
      const aliases = { ...get().aliases }
      if (alias.trim()) aliases[participant] = alias.trim()
      else delete aliases[participant]
      set({ aliases })
    },

    setAvatar(participant, picture) {
      const avatars = { ...get().avatars }
      if (avatars[participant]) URL.revokeObjectURL(avatars[participant])
      if (picture) avatars[participant] = URL.createObjectURL(picture)
      else delete avatars[participant]
      set({ avatars })
    },

    setRange(range) {
      set({ range })
    },

    startRangeAt(index) {
      set({ range: withStart(get().range, index) })
    },

    endRangeAt(index) {
      set({ range: withEnd(get().range, index) })
    },

    setMaskNumbers(maskNumbers) {
      set({ maskNumbers })
    },

    toggleHidden(index) {
      const hidden = get().hidden
      set({
        hidden: hidden.includes(index) ? hidden.filter((value) => value !== index) : [...hidden, index].sort((a, b) => a - b),
      })
    },

    showAllHidden() {
      set({ hidden: [] })
    },

    setOnlyRange(onlyRange) {
      set({ onlyRange })
    },

    jumpTo(index) {
      set({ focus: { index, nonce: (get().focus?.nonce ?? 0) + 1 } })
    },

    async reset() {
      await release()
      set({ stage: 'idle', ...blankChat })
    },
  }
})

/** How a participant is called on screen and in the outputs: the alias, when there is one. */
/** The redaction in force, applied the same way on screen and in the outputs. */
export function useRedactor(): Redactor {
  const aliases = useChat((state) => state.aliases)
  const maskNumbers = useChat((state) => state.maskNumbers)
  return useMemo(() => makeRedactor({ aliases, maskNumbers }), [aliases, maskNumbers])
}

/** How a participant is called on screen and in the outputs. */
export const useDisplayName = () => useRedactor().name
