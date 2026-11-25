import { initials } from '../colors.ts'

/** The picture picked by hand, or the initials over the participant color. */
export function Avatar({ name, color, picture, size = 40 }: { name: string; color: string; picture?: string; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.36 }
  if (picture) return <img src={picture} alt="" style={style} className="shrink-0 rounded-full object-cover" />
  return (
    <span
      aria-hidden
      style={{ ...style, backgroundColor: color }}
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
    >
      {initials(name)}
    </span>
  )
}
