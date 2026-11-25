// The export does not say who made it. In an individual chat the file name names the other
// participant, so "you" (Self, in CONTEXT.md) is whoever is left.

const NAME_PATTERNS = [
  /^Conversa do WhatsApp com (.+)$/i,
  /^WhatsApp Chat with (.+)$/i,
  /^Chat de WhatsApp con (.+)$/i,
  // iOS names the zip in English whatever the device language.
  /^WhatsApp Chat - (.+)$/i,
  /^Conversa do WhatsApp - (.+)$/i,
]

/** The chat partner named by the export file, or null when the name does not follow a known pattern. */
export function partnerFromName(exportName: string): string | null {
  // Browsers add ` (1)` to repeated downloads.
  const name = exportName.replace(/\s\(\d+\)$/, '').trim()
  for (const pattern of NAME_PATTERNS) {
    const m = name.match(pattern)
    if (m) return m[1].trim()
  }
  return null
}

/**
 * Guesses which participant made the export. Only individual chats get a guess: in a group the file
 * is named after the group. The person importing always confirms it.
 */
export function guessSelf(exportName: string, participants: string[]): string | null {
  if (participants.length !== 2) return null
  const partner = partnerFromName(exportName) ?? exportName.replace(/\s\(\d+\)$/, '').trim()
  const normalized = partner.toLocaleLowerCase()
  const index = participants.findIndex((participant) => participant.toLocaleLowerCase() === normalized)
  return index === -1 ? null : participants[1 - index]
}
