import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // The PDF is rendered in a Web Worker, which has no `window` for the Fast Refresh runtime.
    react({ exclude: /src\/export\/pdf\// }),
    tailwindcss(),
    // Installable and offline after the first visit (ADR 0007): nothing needs the network to work.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'ExportaZap',
        short_name: 'ExportaZap',
        description: 'Conversas exportadas do WhatsApp, legíveis e prontas para compartilhar em PDF, prints ou página HTML.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        theme_color: '#00a884',
        background_color: '#f0f2f5',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app, the PDF worker and the viewer of the HTML package; not the 3,800 emoji images.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        globIgnores: ['emoji/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Emoji images are kept as they get used, so the ones already seen work offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/emoji/'),
            handler: 'CacheFirst',
            options: { cacheName: 'emoji', expiration: { maxEntries: 4000 } },
          },
        ],
      },
    }),
  ],
})
