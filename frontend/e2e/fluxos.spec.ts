// The main flows on the built app: import a synthetic export, adjust the range, hide a message and
// make every output, with no request leaving the site (ADR 0007).

import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

const EXPORT = fileURLToPath(new URL('../../fixtures/sinteticas/android-ptbr-individual/Conversa do WhatsApp com Ana Souza/', import.meta.url))

/** Every request the page makes outside its own origin; the test fails if there is any. */
function watchExternalRequests(page: Page): string[] {
  const external: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!['http:', 'https:'].includes(url.protocol)) return
    if (url.origin !== 'http://127.0.0.1:4173') external.push(request.url())
  })
  return external
}

async function openChat(page: Page) {
  await page.goto('/')
  // The .txt with its attachments, picked together (the synthetic media are placeholders).
  await page.locator('input[type=file][multiple]').setInputFiles(readdirSync(EXPORT).map((name) => join(EXPORT, name)))
  await expect(page.getByRole('heading', { name: 'Ana Souza' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Lucas' })).toBeChecked()
  await page.getByRole('button', { name: 'Abrir conversa' }).click()
  await expect(page.getByText('Bom dia! Tudo certo pra sábado?')).toBeVisible()
}

async function exportAs(page: Page, format: RegExp) {
  await page.getByRole('button', { name: 'Exportar', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Exportar conversa' })
  await dialog.getByRole('radio', { name: format }).check()
  const download = page.waitForEvent('download', { timeout: 45_000 })
  await dialog.getByRole('button', { name: 'Exportar' }).click()
  return download
}

test('imports, adjusts the range, hides a message and shows the redaction', async ({ page }) => {
  const external = watchExternalRequests(page)
  await openChat(page)

  const bubble = page.locator('div.group').filter({ hasText: 'Levo o bolo e as velas' }).first()
  await bubble.hover()
  await bubble.getByRole('button', { name: 'Ações da mensagem' }).click()
  await page.getByRole('menuitem', { name: 'Começar o recorte aqui' }).click()
  await page.getByRole('button', { name: 'Recorte', exact: true }).click()
  await expect(page.getByText(/12 mensagens/)).toBeVisible()

  await bubble.hover()
  await bubble.getByRole('button', { name: 'Ações da mensagem' }).click()
  await page.getByRole('menuitem', { name: 'Ocultar nas exportações' }).click()
  await expect(bubble.getByText('Oculta nas exportações')).toBeVisible()

  expect(external).toEqual([])
})

test('makes the PDF, the screenshots, the strip and the HTML package', async ({ page }) => {
  const external = watchExternalRequests(page)
  await openChat(page)

  const outputs: [RegExp, string][] = [
    [/^PDF Baixa direto/, '.pdf'],
    [/^Prints/, '.zip'],
    [/^Tripa/, '.png'],
    [/^Pacote HTML/, '.zip'],
  ]
  for (const [format, extension] of outputs) {
    const download = await exportAs(page, format)
    expect(download.suggestedFilename(), String(format)).toBe(`Ana Souza 2023-10-14${extension}`)
    expect(await download.failure(), String(format)).toBeNull()
  }
  expect(external).toEqual([])
})

test('opens the print dialog for the printed PDF', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => document.body.setAttribute('data-printed', 'yes')
  })
  await openChat(page)
  await page.getByRole('button', { name: 'Exportar', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Exportar conversa' })
  await dialog.getByRole('radio', { name: /^PDF pela impressão/ }).check()
  await dialog.getByRole('button', { name: 'Exportar' }).click()
  await expect(page.locator('body')).toHaveAttribute('data-printed', 'yes')
  await expect(page.locator('#print-root')).toContainText('Hash SHA-256 da exportação')
})

test('shows the privacy page', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Privacidade' }).click()
  await expect(page.getByRole('heading', { name: 'Privacidade' })).toBeVisible()
  await expect(page.getByText(/nunca sai do seu aparelho/)).toBeVisible()
})
