// Attachment files turned into object URLs on demand. A zip entry is decompressed the first time a
// message with it scrolls into view and kept for the rest of the session, so scrolling back does
// not decompress it again. Everything is released when the chat is closed.

import { useEffect, useState } from 'react'
import type { SourceExport } from '../import/readSource.ts'
import type { AttachmentKind } from './model.ts'

const caches = new WeakMap<SourceExport, Map<string, Promise<string>>>()

function cacheOf(source: SourceExport) {
  let cache = caches.get(source)
  if (!cache) {
    cache = new Map()
    caches.set(source, cache)
  }
  return cache
}

export function mediaUrl(source: SourceExport, fileName: string): Promise<string> | null {
  const file = source.files.get(fileName)
  if (!file) return null
  const cache = cacheOf(source)
  let url = cache.get(fileName)
  if (!url) {
    url = file.read().then((blob) => URL.createObjectURL(blob))
    cache.set(fileName, url)
  }
  return url
}

export async function releaseMedia(source: SourceExport) {
  const cache = caches.get(source)
  if (!cache) return
  caches.delete(source)
  for (const url of cache.values()) {
    try {
      URL.revokeObjectURL(await url)
    } catch {
      // A file that failed to read has no URL to release.
    }
  }
}

export type MediaState = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'missing' } | { status: 'error' }

export function useMedia(source: SourceExport | undefined, fileName: string | null): MediaState {
  const available = source !== undefined && fileName !== null && source.files.has(fileName)
  // The state remembers which file it belongs to, so a reused row never shows the previous file.
  const [loaded, setLoaded] = useState<{ fileName: string; state: MediaState } | null>(null)
  useEffect(() => {
    if (!available) return
    let current = true
    mediaUrl(source, fileName)!.then(
      (url) => current && setLoaded({ fileName, state: { status: 'ready', url } }),
      () => current && setLoaded({ fileName, state: { status: 'error' } }),
    )
    return () => {
      current = false
    }
  }, [available, source, fileName])
  if (!available) return { status: 'missing' }
  return loaded?.fileName === fileName ? loaded.state : { status: 'loading' }
}

/** Attachments drawn edge to edge in the bubble, with the time over them when there is no caption. */
export const isVisualMedia = (kind: AttachmentKind) => kind === 'image' || kind === 'video' || kind === 'gif'
