// Draws the chat wallpaper: our own doodles in the spirit of WhatsApp's, never its artwork
// (ADR 0006). Run `node scripts/fundo.mjs` after changing it; the SVGs are committed.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Each doodle is drawn around (0, 0), about 28 px wide.
const DOODLES = [
  '<path d="M-14-10h28a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H-4l-8 7v-7h-2a4 4 0 0 1-4-4v-12a4 4 0 0 1 4-4z"/>',
  '<path d="M0 10C-12 2-14-4-11-8s9-3 11 1c2-4 8-5 11-1s1 10-11 18z"/>',
  '<path d="M0-13l3.8 8 8.7 1-6.4 6 1.7 8.6L0 6.3-7.8 10.6l1.7-8.6-6.4-6 8.7-1z"/>',
  '<circle r="12"/><circle cx="-4" cy="-3" r="1.2"/><circle cx="4" cy="-3" r="1.2"/><path d="M-6 3q6 6 12 0"/>',
  '<ellipse cx="-6" cy="8" rx="4" ry="3"/><path d="M-2 8V-12l11 4"/>',
  '<rect x="-13" y="-8" width="26" height="18" rx="3"/><circle cy="1" r="5"/><path d="M-5-8l2-4h6l2 4"/>',
  '<path d="M-10-4h16v8a8 8 0 0 1-16 0z"/><path d="M6-1h3a3 3 0 0 1 0 6H6"/><path d="M-5-8q-2-3 0-6M0-8q-2-3 0-6"/>',
  '<rect x="-13" y="-9" width="26" height="18" rx="2"/><path d="M-13-8L0 2 13-8"/>',
  '<path d="M-11 11C-11-6-2-12 11-12 11 1 4 11-11 11zM-11 11L4-4"/>',
  '<rect x="-7" y="-13" width="14" height="26" rx="3"/><path d="M-2 9h4"/>',
  '<path d="M-10 7a6 6 0 0 1 0-12 8 8 0 0 1 15-2 6 6 0 0 1 4 14z"/>',
  '<path d="M2-13L-7 2h7l-3 11 10-15H0z"/>',
  '<path d="M4-12A12 12 0 1 0 12 4 9 9 0 0 1 4-12z"/>',
  '<path d="M-13 0L13-10 5 12 0 3zM0 3L13-10"/>',
  '<ellipse cy="-4" rx="8" ry="10"/><path d="M0 6l-2 3h4zM0 9q-3 4 0 7"/>',
  '<circle r="12"/><path d="M0-7V0l5 3"/>',
  '<path d="M0 13S-9 3-9-4a9 9 0 0 1 18 0c0 7-9 17-9 17z"/><circle cy="-4" r="3"/>',
  '<circle r="5"/><path d="M0-12v3M0 9v3M-12 0h3M9 0h3M-8.5-8.5l2 2M6.5 6.5l2 2M-8.5 8.5l2-2M6.5-6.5l2-2"/>',
]

const TILE = 340
const GRID = 5
const CELL = TILE / GRID

// A fixed pseudo-random sequence, so the wallpaper is the same on every build.
let seed = 7
const random = () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

const placed = []
for (let row = 0; row < GRID; row++) {
  for (let column = 0; column < GRID; column++) {
    // Keep each doodle inside its cell so the tile repeats without seams.
    const x = column * CELL + CELL / 2 + (random() - 0.5) * 18
    const y = row * CELL + CELL / 2 + (random() - 0.5) * 18
    const angle = Math.round((random() - 0.5) * 70)
    const doodle = DOODLES[(row * GRID + column * 3) % DOODLES.length]
    placed.push(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle})">${doodle}</g>`)
  }
}

function svg(stroke, opacity) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">` +
    `<g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">` +
    placed.join('') +
    '</g></svg>\n'
  )
}

const assets = (name) => fileURLToPath(new URL(`../src/assets/${name}`, import.meta.url))
writeFileSync(assets('fundo-claro.svg'), svg('#8a7c66', 0.16))
writeFileSync(assets('fundo-escuro.svg'), svg('#ffffff', 0.05))
