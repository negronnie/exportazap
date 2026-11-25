// Loudness of a recording in slices, for the voice-note bubble on screen and in the static outputs.

export const BARS = 40
const waveforms = new Map<string, Promise<number[] | null>>()

/** BARS levels from 0.15 to 1; null when the browser cannot decode the recording. */
export function waveform(url: string): Promise<number[] | null> {
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
