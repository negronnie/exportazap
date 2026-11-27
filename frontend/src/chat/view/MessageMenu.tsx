import { ChevronDown, EllipsisVertical } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDismiss } from './dismiss.ts'

export interface MenuAction {
  label: string
  run(): void
}

function MenuList({ actions, className, onPick }: { actions: MenuAction[]; className: string; onPick: () => void }) {
  return (
    <ul role="menu" className={`absolute w-56 rounded-md bg-panel py-1.5 text-sm shadow-xl ${className}`}>
      {actions.map((action) => (
        <li key={action.label}>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onPick()
              action.run()
            }}
            className="w-full px-4 py-2 text-left hover:bg-chip"
          >
            {action.label}
          </button>
        </li>
      ))}
    </ul>
  )
}

/** The little arrow in the corner of a bubble that opens its actions, as in WhatsApp. */
export function MessageMenu({ actions, outgoing }: { actions: MenuAction[]; outgoing: boolean }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  useDismiss(box, open, close)

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
      {open && <MenuList actions={actions} className={`top-6 ${outgoing ? 'right-0' : 'left-0'}`} onPick={close} />}
    </div>
  )
}

/** The three dots of the chat header, as in WhatsApp: the actions that do not fit beside the name. */
export function HeaderMenu({ actions }: { actions: MenuAction[] }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  useDismiss(box, open, close)

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Mais opções"
        aria-expanded={open}
        className="rounded-full p-2 text-muted hover:bg-chip"
      >
        <EllipsisVertical size={20} />
      </button>
      {open && <MenuList actions={actions} className="top-full right-0 z-30 mt-1" onPick={close} />}
    </div>
  )
}
