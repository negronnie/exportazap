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

/** Numbered images in one .zip: `Ana Souza 2023-10-14 01.png`, `… 02.png`. */
export async function zipImages(images: Blob[], baseName: string): Promise<Blob> {
  const { BlobReader, BlobWriter, ZipWriter } = await import('@zip.js/zip.js')
  const writer = new ZipWriter(new BlobWriter('application/zip'))
  const digits = String(images.length).length < 2 ? 2 : String(images.length).length
  for (const [i, image] of images.entries()) {
    // PNG is already compressed: storing it as is keeps the zip fast.
    await writer.add(`${baseName} ${String(i + 1).padStart(digits, '0')}.png`, new BlobReader(image), { level: 0 })
  }
  return writer.close()
}
