import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

function readSaved(): Theme | null {
  try {
    const saved = localStorage.getItem('theme')
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

function apply(theme: Theme) {
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme
}

interface ThemeState {
  theme: Theme
  toggle(): void
}

/** Follows the system until the person picks a theme; the pick is remembered in this browser. */
export const useTheme = create<ThemeState>()((set, get) => {
  const initial = readSaved() ?? systemTheme()
  apply(initial)
  return {
    theme: initial,
    toggle() {
      const theme: Theme = get().theme === 'dark' ? 'light' : 'dark'
      apply(theme)
      try {
        localStorage.setItem('theme', theme)
      } catch {
        // Private windows may refuse storage; the choice then lasts only for this page.
      }
      set({ theme })
    },
  }
})
