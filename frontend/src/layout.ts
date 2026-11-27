// The chat always keeps a phone's width, as people see it in WhatsApp. When the screen fits that
// and the info panel side by side (412 + 400 px), the contact or group info stays docked at the
// chat's right; on a narrower screen it opens over the chat.

import { useSyncExternalStore } from 'react'

const WIDE = '(min-width: 52rem)'

const media = () => (typeof window !== 'undefined' ? window.matchMedia?.(WIDE) : undefined)

function subscribe(onChange: () => void) {
  const query = media()
  query?.addEventListener('change', onChange)
  return () => query?.removeEventListener('change', onChange)
}

/** Whether the screen fits the phone-sized chat with the info panel beside it. */
export function useWide(): boolean {
  return useSyncExternalStore(subscribe, () => media()?.matches ?? false, () => false)
}
