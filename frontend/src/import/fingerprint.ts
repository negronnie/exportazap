import { createSHA256 } from 'hash-wasm'

/**
 * SHA-256 of the source export as it was received (see "Fingerprint" in CONTEXT.md). The file is
 * read in chunks, so a 2 GB export is never held in memory and the page keeps responding between
 * chunks.
 */
export async function fingerprint(file: Blob): Promise<string> {
  const sha256 = await createSHA256()
  sha256.init()
  const reader = file.stream().getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    sha256.update(value)
  }
  return sha256.digest('hex')
}
