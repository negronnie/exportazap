// The few fields of a contact card (.vcf) that the chat shows: the name and the phone numbers.

export interface ContactCard {
  name: string
  phones: string[]
}

export function parseVCard(text: string): ContactCard {
  // Folded lines continue with a space or a tab (RFC 6350, 3.2).
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  let name = ''
  let structured = ''
  const phones: string[] = []
  for (const line of lines) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    const key = line.slice(0, separator).split(';')[0].replace(/^item\d+\./i, '').toUpperCase()
    const value = line.slice(separator + 1).trim()
    if (key === 'FN' && value) name = value
    else if (key === 'N' && value) structured = value.split(';').filter(Boolean).reverse().join(' ')
    else if (key === 'TEL' && value) phones.push(value)
  }
  return { name: name || structured, phones }
}
