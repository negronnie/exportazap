// Draws the app icon (a white chat bubble with three dots on green) as PNG, with no image library:
// `node scripts/icons.mjs` writes public/icons/ and public/favicon.svg; the results are committed.

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const GREEN = [0, 168, 132]
const WHITE = [255, 255, 255]

function inTriangle(x, y, [ax, ay], [bx, by], [cx, cy]) {
  const side = (px, py, qx, qy) => (x - qx) * (py - qy) - (px - qx) * (y - qy)
  const d1 = side(ax, ay, bx, by)
  const d2 = side(bx, by, cx, cy)
  const d3 = side(cx, cy, ax, ay)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

/** Color of a point in a 1 × 1 square, or null outside the icon. `inset` shrinks the drawing for maskable icons. */
function shade(x, y, { rounded, inset }) {
  if (rounded) {
    const r = 0.22
    const dx = Math.max(r - x, 0, x - (1 - r))
    const dy = Math.max(r - y, 0, y - (1 - r))
    if (dx * dx + dy * dy > r * r) return null
  }
  // The drawing lives in the centered square of side `inset`.
  const u = (x - 0.5) / inset + 0.5
  const v = (y - 0.5) / inset + 0.5
  const inEllipse = ((u - 0.5) / 0.33) ** 2 + ((v - 0.46) / 0.26) ** 2 <= 1
  // The tail: a triangle under the bubble, to the lower left.
  const inTail = inTriangle(u, v, [0.27, 0.58], [0.47, 0.66], [0.19, 0.84])
  if (!inEllipse && !inTail) return GREEN
  for (const cx of [0.37, 0.5, 0.63]) if ((u - cx) ** 2 + (v - 0.46) ** 2 <= 0.048 ** 2) return GREEN
  return WHITE
}

function crc32(bytes) {
  let crc = ~0
  for (const byte of bytes) {
    crc ^= byte
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return ~crc >>> 0
}

function chunk(type, data) {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(data.length, 0)
  head.write(type, 4, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])))
  return Buffer.concat([head, data, crc])
}

function png(size, options) {
  const samples = 4 // 4 × 4 samples per pixel smooth the edges
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4) // filter byte 0, then RGBA
    for (let x = 0; x < size; x++) {
      let [r, g, b, a] = [0, 0, 0, 0]
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const color = shade((x + (sx + 0.5) / samples) / size, (y + (sy + 0.5) / samples) / size, options)
          if (!color) continue
          r += color[0]
          g += color[1]
          b += color[2]
          a += 255
        }
      }
      const n = samples * samples
      const covered = a / 255
      row.set(covered ? [r / covered, g / covered, b / covered, a / n].map(Math.round) : [0, 0, 0, 0], 1 + x * 4)
    }
    rows.push(row)
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header.set([8, 6, 0, 0, 0], 8) // 8 bits, RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))
mkdirSync(out('icons'), { recursive: true })
writeFileSync(out('icons/icon-192.png'), png(192, { rounded: true, inset: 1 }))
writeFileSync(out('icons/icon-512.png'), png(512, { rounded: true, inset: 1 }))
// Maskable: the platform crops it to its own shape, so the drawing keeps to the central 80 %.
writeFileSync(out('icons/maskable-512.png'), png(512, { rounded: false, inset: 0.8 }))
writeFileSync(out('icons/apple-touch-icon.png'), png(180, { rounded: false, inset: 0.86 }))
writeFileSync(
  out('favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#00a884"/>` +
    `<ellipse cx="50" cy="46" rx="33" ry="26" fill="#fff"/><path d="M27 58L47 66L19 84z" fill="#fff"/>` +
    `<circle cx="37" cy="46" r="4.8" fill="#00a884"/><circle cx="50" cy="46" r="4.8" fill="#00a884"/><circle cx="63" cy="46" r="4.8" fill="#00a884"/></svg>\n`,
)
