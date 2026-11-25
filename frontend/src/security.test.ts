// The promise that nothing leaves the device rests on the policy the server sends (ADR 0007).

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const headers = readFileSync(new URL('../security-headers.conf', import.meta.url), 'utf8')
const policy = headers.match(/Content-Security-Policy "([^"]+)"/)![1]
const directives = new Map(
  policy.split(';').map((directive) => {
    const [name, ...sources] = directive.trim().split(/\s+/)
    return [name, sources]
  }),
)

describe('Content-Security-Policy', () => {
  it('names no origin but the site itself', () => {
    for (const [name, sources] of directives) {
      for (const source of sources) {
        expect(source, `${name} ${source}`).not.toMatch(/^(https?:|wss?:|\*|\/\/)|\.[a-z]{2,}(:\d+)?$/i)
      }
    }
  })

  it('keeps every request on the site: fetch, scripts, workers and the default', () => {
    expect(directives.get('default-src')).toEqual(["'self'"])
    // WebAssembly only (hash-wasm, the PDF layout): JavaScript eval stays blocked.
    expect(directives.get('script-src')).toEqual(["'self'", "'wasm-unsafe-eval'"])
    expect(directives.get('connect-src')).toEqual(["'self'", 'data:', 'blob:'])
    expect(directives.get('worker-src')).toEqual(["'self'", 'blob:'])
    expect(directives.get('object-src')).toEqual(["'none'"])
    expect(directives.get('form-action')).toEqual(["'none'"])
  })

  it('is sent from every location of the server', () => {
    const nginx = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8')
    const locations = nginx.match(/location [^{]+\{[^}]*\}/g) ?? []
    expect(locations.length).toBeGreaterThan(0)
    for (const location of locations) expect(location).toContain('include /etc/nginx/snippets/security-headers.conf;')
  })
})
