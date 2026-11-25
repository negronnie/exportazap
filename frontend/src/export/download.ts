/** Hands a file to the browser to save; nothing leaves the device. */
export function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // The click starts the download synchronously; the URL can go on the next turn.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** `Ana Souza 2023-10-14.pdf`, without the characters file systems refuse. */
export function outputName(title: string, firstDay: string, extension: string) {
  const safe = title.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'conversa'
  return `${safe} ${firstDay.slice(0, 10)}.${extension}`
}
