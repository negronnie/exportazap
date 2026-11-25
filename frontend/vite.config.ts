import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // The PDF is rendered in a Web Worker, which has no `window` for the Fast Refresh runtime.
    react({ exclude: /src\/export\/pdf\// }),
    tailwindcss(),
  ],
})
