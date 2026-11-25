// Noto Emoji (Google, Apache 2.0) for the chat, so an emoji looks the same on every device and can
// go into the PDF as an image (ADR 0006). Copies the 64 px images into public/emoji/ (ignored by
// git) and, with `--map`, rewrites src/chat/emoji/map.json, the emoji → image table (committed).

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const from = (path) => fileURLToPath(new URL(path, import.meta.url))
const dataset = from('../node_modules/emoji-datasource-google/')
const images = `${dataset}img/google/64/`
const target = from('../public/emoji/')

const toText = (unified) => String.fromCodePoint(...unified.split('-').map((hex) => parseInt(hex, 16)))

if (process.argv.includes('--map')) {
  const map = {}
  const add = (entry) => {
    if (!entry.has_img_google) return
    map[toText(entry.unified)] = entry.image.replace(/\.png$/, '')
    if (entry.non_qualified) map[toText(entry.non_qualified)] ??= entry.image.replace(/\.png$/, '')
  }
  for (const entry of JSON.parse(readFileSync(`${dataset}emoji.json`, 'utf8'))) {
    add(entry)
    for (const variation of Object.values(entry.skin_variations ?? {})) add(variation)
  }
  const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)))
  writeFileSync(from('../src/chat/emoji/map.json'), JSON.stringify(sorted) + '\n')
  console.log(`map.json: ${Object.keys(sorted).length} emoji`)
}

// Copy only when something is missing: a full copy takes a few seconds.
const wanted = readdirSync(images)
if (!existsSync(target) || readdirSync(target).length < wanted.length) {
  mkdirSync(target, { recursive: true })
  cpSync(images, target, { recursive: true })
  writeFileSync(
    `${target}LICENSE.txt`,
    'Emoji images from Noto Emoji by Google, licensed under the Apache License, Version 2.0.\n' +
      'https://github.com/googlefonts/noto-emoji\n',
  )
  console.log(`public/emoji: ${wanted.length} images`)
}
