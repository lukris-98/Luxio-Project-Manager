import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'luxio.png', 'robots.txt'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
      },
      manifest: {
        name: 'Luxio - Project & Target Manager',
        short_name: 'Luxio',
        description: 'Aplikasi manajemen project & target untuk tim.',
        theme_color: '#0C0C0E',
        background_color: '#0C0C0E',
        display: 'standalone',
        lang: 'id',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 700,
  },
})