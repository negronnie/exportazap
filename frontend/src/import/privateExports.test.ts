// Real exports kept only on the developer's machine (fixtures/privadas, ignored by git). The checks
// look at counts and order only, so a failure never prints the content of a conversation.

import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fileFrom, hasPrivateFixtures, PRIVATE_FIXTURES } from '../test/fixtures.ts'
import { importExport } from './importExport.ts'

function privateZips(): string[] {
  if (!hasPrivateFixtures) return []
  return readdirSync(PRIVATE_FIXTURES)
    .filter((folder) => statSync(join(PRIVATE_FIXTURES, folder)).isDirectory())
    .flatMap((folder) =>
      readdirSync(join(PRIVATE_FIXTURES, folder))
        .filter((name) => name.toLowerCase().endsWith('.zip'))
        .map((name) => join(folder, name)),
    )
}

describe.runIf(hasPrivateFixtures)('real exports in fixtures/privadas', () => {
  it.each(privateZips().map((path, i) => [i + 1, path.split(/[\\/]/)[0], path]))(
    'export %i (%s) imports cleanly',
    async (_, __, path) => {
      const name = path.split(/[\\/]/).pop()!
      const imported = await importExport([fileFrom(join(PRIVATE_FIXTURES, path), name)])
      const { entries, participants } = imported.parsed

      expect(entries.length, 'entries').toBeGreaterThan(0)
      expect(participants.length, 'participants').toBeGreaterThan(0)

      // WhatsApp keeps the order in which messages arrived, so time can step back a few minutes
      // (a message sent offline, a notice). A wrong date order would step back by days.
      let bigSteps = 0
      for (let i = 1; i < entries.length; i++) {
        const back = Date.parse(entries[i - 1].at) - Date.parse(entries[i].at)
        if (back > 60 * 60 * 1000) bigSteps++
      }
      expect(bigSteps, 'entries more than an hour out of order').toBe(0)

      // Every attachment the text cites by name must be in the zip; only omitted media may lack a file.
      const unmatched = imported.missing.filter((message) => message.attachment?.fileName !== null).length
      expect(unmatched, 'attachments cited by name without a file').toBe(0)

      expect(await imported.fingerprint).toMatch(/^[0-9a-f]{64}$/)
      await imported.source.close()
    },
    60_000,
  )
})
