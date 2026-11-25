// Test helpers that turn the export folders under /fixtures into the files a person would pick.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BlobReader, BlobWriter, ZipWriter, configure } from '@zip.js/zip.js'

// Node has no Web Workers: zip.js runs on the test thread.
configure({ useWebWorkers: false })

export const FIXTURES = fileURLToPath(new URL('../../../fixtures/', import.meta.url))
export const PRIVATE_FIXTURES = join(FIXTURES, 'privadas')
export const hasPrivateFixtures = existsSync(PRIVATE_FIXTURES)

/** The export folder of a synthetic case: `sinteticas/<case>/<export name>/`. */
export function syntheticExport(caseName: string): { name: string; folder: string } {
  const caseFolder = join(FIXTURES, 'sinteticas', caseName)
  const name = readdirSync(caseFolder).find((entry) => statSync(join(caseFolder, entry)).isDirectory())
  if (!name) throw new Error(`no export folder in ${caseFolder}`)
  return { name, folder: join(caseFolder, name) }
}

export function syntheticCases(): string[] {
  return readdirSync(join(FIXTURES, 'sinteticas')).filter((entry) =>
    statSync(join(FIXTURES, 'sinteticas', entry)).isDirectory(),
  )
}

export function fileFrom(path: string, name: string): File {
  return new File([readFileSync(path)], name)
}

/** The loose files of an export folder, as picked one by one. */
export function looseFiles(folder: string): File[] {
  return readdirSync(folder).map((name) => fileFrom(join(folder, name), name))
}

/** The export folder zipped, as WhatsApp hands it over. */
export async function zippedExport(folder: string, zipName: string): Promise<File> {
  const writer = new ZipWriter(new BlobWriter('application/zip'))
  for (const name of readdirSync(folder)) {
    await writer.add(name, new BlobReader(new Blob([readFileSync(join(folder, name))])))
  }
  return new File([await writer.close()], `${zipName}.zip`)
}
