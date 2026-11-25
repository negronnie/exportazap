// The read-only viewer of the HTML package, built into a single HTML file (ADR 0004): opened from
// disk, the browser refuses module scripts and fetch, so everything goes inline.

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  publicDir: false,
  build: {
    // Served by the app at /viewer/viewer.html, where the export reads it from.
    outDir: 'public/viewer',
    emptyOutDir: true,
    rollupOptions: { input: 'viewer.html' },
  },
})
