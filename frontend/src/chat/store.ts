// The one chat loaded in this tab. Nothing is saved: closing or reloading the page loses it
// (ADR 0001; local persistence is issue #4).

import { create } from 'zustand'
import { guessSelf } from '../import/guessSelf.ts'
import { importExport, missingAttachments, type ImportedChat } from '../import/importExport.ts'
import { parseExport } from '../import/parseExport.ts'
import { SourceError, type SourceErrorCode } from '../import/readSource.ts'
import { releaseMedia } from './media.ts'
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
  /** Names given in ExportaZap to participants (Alias in CONTEXT.md), by original name. */
  aliases: Record<string, string>
  /** Pictures picked by hand for participants (the export has none), as object URLs. */
  avatars: Record<string, string>
  /** The entry the chat list should scroll to and highlight; the nonce repeats a jump to the same one. */
  focus: { index: number; nonce: number } | null
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
export const useDisplayName = () => {
  const aliases = useChat((state) => state.aliases)
  return (participant: string) => aliases[participant] ?? participant
}
