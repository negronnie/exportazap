// One color per participant, for the author name in groups and the initials avatar. Chosen to read
// on both the light and the dark bubbles.
const PALETTE = [
  '#1f7aec',
  '#e542a3',
  '#d3a10a',
  '#02a698',
  '#fc6d5b',
  '#7f66ff',
  '#53bdeb',
  '#a62c71',
  '#ff8000',
  '#5fb33a',
  '#c84b31',
  '#0c8fb0',
]

export function participantColor(participants: string[], name: string): string {
  const index = participants.indexOf(name)
  return PALETTE[(index === -1 ? 0 : index) % PALETTE.length]
}

/** `Ana Souza` → `AS`; `Corrida de domingo` → `CD`. */
export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^\p{Lu}/u.test(word))
  const letters = (words.length > 0 ? words : [name]).map((word) => [...word][0] ?? '')
  return (letters[0] + (letters.length > 1 ? letters[letters.length - 1] : '')).toUpperCase()
}
