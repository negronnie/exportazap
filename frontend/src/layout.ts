// From the lg breakpoint on, the chat keeps a phone's width, as people see it in WhatsApp, and the
// contact or group info stays docked at its right instead of covering it.

import { useSyncExternalStore } from 'react'

const WIDE = '(min-width: 64rem)'

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
