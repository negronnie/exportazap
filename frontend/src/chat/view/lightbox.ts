import { create } from 'zustand'

export interface LightboxItem {
  url: string
  kind: 'image' | 'video'
  fileName: string
}

interface LightboxState {
  item: LightboxItem | null
  open(item: LightboxItem): void
  close(): void
}

/** The image or video shown full screen over the chat. */
export const useLightbox = create<LightboxState>()((set) => ({
  item: null,
  open: (item) => set({ item }),
  close: () => set({ item: null }),
}))
