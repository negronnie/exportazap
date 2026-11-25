import { Mic, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const BARS = 40
const waveforms = new Map<string, Promise<number[] | null>>()

/** Loudness of the recording in BARS slices, from 0.15 to 1; null when the browser cannot decode it. */
function waveform(url: string): Promise<number[] | null> {
  let pending = waveforms.get(url)
  if (!pending) {
    pending = fetch(url)
      .then((response) => response.arrayBuffer())
      // An offline context decodes without needing a click first.
      .then((buffer) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(buffer))
      .then((audio) => {
        const samples = audio.getChannelData(0)
        const size = Math.max(1, Math.floor(samples.length / BARS))
        const levels = Array.from({ length: BARS }, (_, bar) => {
          let sum = 0
          for (let i = bar * size; i < (bar + 1) * size && i < samples.length; i++) sum += samples[i] * samples[i]
          return Math.sqrt(sum / size)
        })
        const loudest = Math.max(...levels, 1e-6)
        return levels.map((level) => 0.15 + 0.85 * (level / loudest))
      })
      .catch(() => null)
    waveforms.set(url, pending)
  }
  return pending
}

const clock = (seconds: number) =>
  Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '0:00'

export function VoicePlayer({ url, voice }: { url: string; voice: boolean }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [levels, setLevels] = useState<number[] | null>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)

  useEffect(() => {
    let current = true
    void waveform(url).then((value) => current && setLevels(value))
    return () => {
      current = false
    }
  }, [url])

  const toggle = () => {
    const element = audio.current
    if (!element) return
    if (element.paused) void element.play()
    else element.pause()
  }
  const progress = duration > 0 ? position / duration : 0
  const bars = levels ?? Array.from({ length: BARS }, () => 0.3)

  return (
    <div className="flex w-72 max-w-full items-center gap-3 py-1">
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
        {voice && <Mic size={14} className="absolute -right-0.5 -bottom-0.5 rounded-full bg-accent-strong p-0.5 text-on-accent" aria-hidden />}
        <button type="button" onClick={toggle} aria-label={playing ? 'Pausar' : 'Tocar'} className="flex size-full items-center justify-center">
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="flex h-7 cursor-pointer items-center gap-[2px]"
          onClick={(event) => {
            const element = audio.current
            const box = event.currentTarget.getBoundingClientRect()
            if (element && duration > 0) element.currentTime = ((event.clientX - box.left) / box.width) * duration
          }}
        >
          {bars.map((level, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full ${i / BARS < progress ? 'bg-accent' : 'bg-muted/50'}`}
              style={{ height: `${Math.round(level * 100)}%` }}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted">{clock(playing || position > 0 ? position : duration)}</p>
      </div>
      <audio
        ref={audio}
        src={url}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setPosition(0)
        }}
      />
    </div>
  )
}
