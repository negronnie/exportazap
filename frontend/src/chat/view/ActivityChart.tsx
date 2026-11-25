/** Messages per hour of the day, as 24 bars. */
export function ActivityChart({ hours }: { hours: number[] }) {
  const busiest = Math.max(...hours, 1)
  const peak = hours.indexOf(Math.max(...hours))
  return (
    <figure className="space-y-1">
      <div className="flex h-16 items-end gap-[3px]" role="img" aria-label={`Horário com mais mensagens: ${peak}h`}>
        {hours.map((count, hour) => (
          <span
            key={hour}
            title={`${hour}h: ${count} ${count === 1 ? 'mensagem' : 'mensagens'}`}
            className={`flex-1 rounded-t-sm ${hour === peak ? 'bg-accent' : 'bg-accent/40'}`}
            style={{ height: `${Math.max(4, (count / busiest) * 100)}%` }}
          />
        ))}
      </div>
      <figcaption className="flex justify-between text-[11px] text-muted">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </figcaption>
    </figure>
  )
}
