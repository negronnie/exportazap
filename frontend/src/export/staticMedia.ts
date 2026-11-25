// Attachments turned into what a still output can hold: a picture (the image itself or the first
// frame of a video), the waveform and duration of a recording, the fields of a contact card.

import { parseVCard, type ContactCard } from '../chat/vcard.ts'
import { waveform } from '../chat/waveform.ts'
import type { SourceExport } from '../import/readSource.ts'
import type { ExportAttachment } from './document.ts'

export interface StaticMedia {
  /** Data URL: PNG for stickers (they have transparency), JPEG otherwise. */
  picture?: string
  width?: number
  height?: number
  /** Seconds, for videos and recordings. */
  duration?: number
  levels?: number[] | null
  contact?: ContactCard
}

/** Pictures are scaled down to this width: enough for a page or a phone screen, light on memory. */
const MAX_WIDTH = 900

function draw(source: CanvasImageSource, width: number, height: number, type: 'image/png' | 'image/jpeg') {
  const scale = Math.min(1, MAX_WIDTH / width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height)
  return { picture: canvas.toDataURL(type, 0.85), width: canvas.width, height: canvas.height }
}

async function picture(blob: Blob, type: 'image/png' | 'image/jpeg') {
  const bitmap = await createImageBitmap(blob)
  try {
    return draw(bitmap, bitmap.width, bitmap.height, type)
  } finally {
    bitmap.close()
  }
}

function mediaElement<T extends HTMLMediaElement>(element: T, url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    element.preload = 'metadata'
    element.muted = true
    element.onloadedmetadata = () => resolve(element)
    element.onerror = () => reject(new Error('media'))
    element.src = url
  })
}

async function videoFrame(url: string) {
  const video = await mediaElement(document.createElement('video'), url)
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve()
    video.currentTime = Math.min(0.1, video.duration || 0)
  })
  return { ...draw(video, video.videoWidth, video.videoHeight, 'image/jpeg'), duration: video.duration }
}

export async function prepareMedia(
  source: SourceExport,
  attachment: ExportAttachment,
  redactText: (text: string) => string,
): Promise<StaticMedia> {
  const file = attachment.present && attachment.sourceFile ? source.files.get(attachment.sourceFile) : undefined
  if (!file) return {}
  const blob = await file.read()
  try {
    switch (attachment.kind) {
      case 'image':
        return await picture(blob, 'image/jpeg')
      case 'sticker':
        return await picture(blob, 'image/png')
      case 'video':
      case 'gif': {
        const url = URL.createObjectURL(blob)
        try {
          return await videoFrame(url)
        } finally {
          URL.revokeObjectURL(url)
        }
      }
      case 'audio':
      case 'voice': {
        const url = URL.createObjectURL(blob)
        try {
          const [levels, audio] = await Promise.all([waveform(url), mediaElement(new Audio(), url)])
          return { levels, duration: audio.duration }
        } finally {
          URL.revokeObjectURL(url)
        }
      }
      case 'contact': {
        const card = parseVCard(await blob.text())
        return { contact: { name: redactText(card.name), phones: card.phones.map(redactText) } }
      }
      default:
        return {}
    }
  } catch {
    // A file the browser cannot open goes out as a card with its name, like a missing one.
    return {}
  }
}
