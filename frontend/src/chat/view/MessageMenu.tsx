import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface MenuAction {
  label: string
  run(): void
}

/** The little arrow in the corner of a bubble that opens its actions, as in WhatsApp. */
export function MessageMenu({ actions, outgoing }: { actions: MenuAction[]; outgoing: boolean }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: Event) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div ref={box} className="absolute top-0.5 right-0.5 z-10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Ações da mensagem"
        aria-expanded={open}
        // Shown on hover with a mouse, always on touch screens.
        className={`rounded-full p-0.5 text-muted transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-60 ${
          open ? 'opacity-100' : 'opacity-0'
        } ${outgoing ? 'bg-bubble-out' : 'bg-bubble-in'}`}
      >
        <ChevronDown size={18} />
      </button>
      {open && (
        <ul role="menu" className={`absolute top-6 w-56 rounded-md bg-panel py-1.5 text-sm shadow-xl ${outgoing ? 'right-0' : 'left-0'}`}>
          {actions.map((action) => (
            <li key={action.label}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  action.run()
                }}
                className="w-full px-4 py-2 text-left hover:bg-chip"
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
