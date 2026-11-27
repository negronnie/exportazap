import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { Entry } from '../model.ts'
import { useDismiss } from './dismiss.ts'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

interface Props {
  entries: Entry[]
  /** Called with the index of the first entry of the chosen day. */
  onPick(index: number): void
  onClose(): void
}

/** A month calendar where only the days with messages can be picked. */
export function DatePicker({ entries, onPick, onClose }: Props) {
  // First entry of each day, by `YYYY-MM-DD`.
  const days = useMemo(() => {
    const first = new Map<string, number>()
    entries.forEach((entry, i) => {
      const day = entry.at.slice(0, 10)
      if (!first.has(day)) first.set(day, i)
    })
    return first
  }, [entries])
  const months = useMemo(() => [...new Set([...days.keys()].map((day) => day.slice(0, 7)))], [days])
  const [month, setMonth] = useState(months[0] ?? '')
  const box = useRef<HTMLDivElement>(null)
  useDismiss(box, true, onClose)
  if (!month) return null

  const [year, monthNumber] = month.split('-').map(Number)
  const startWeekday = new Date(year, monthNumber - 1, 1).getDay()
  const length = new Date(year, monthNumber, 0).getDate()
  const position = months.indexOf(month)

  return (
    <div ref={box} className="absolute top-full right-2 z-30 mt-1 w-72 rounded-xl bg-panel p-3 shadow-xl" role="dialog" aria-label="Ir para uma data">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setMonth(months[position - 1])} disabled={position <= 0} aria-label="Mês anterior" className="rounded-full p-1.5 hover:bg-chip disabled:opacity-30">
          <ChevronLeft size={18} />
        </button>
        <p className="font-medium first-letter:uppercase">{monthName.format(new Date(year, monthNumber - 1, 1))}</p>
        <button type="button" onClick={() => setMonth(months[position + 1])} disabled={position >= months.length - 1} aria-label="Próximo mês" className="rounded-full p-1.5 hover:bg-chip disabled:opacity-30">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {WEEKDAYS.map((weekday, i) => (
          <span key={i} className="text-xs text-muted">
            {weekday}
          </span>
        ))}
        {Array.from({ length: startWeekday }, (_, i) => (
          <span key={`blank${i}`} />
        ))}
        {Array.from({ length }, (_, i) => {
          const day = `${month}-${String(i + 1).padStart(2, '0')}`
          const index = days.get(day)
          return (
            <button
              key={day}
              type="button"
              disabled={index === undefined}
              onClick={() => {
                onPick(index!)
                onClose()
              }}
              className="rounded-full py-1.5 enabled:font-medium enabled:text-accent-strong enabled:hover:bg-chip disabled:text-muted/50"
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
