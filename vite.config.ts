import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Production defaults to the official root domain (https://ranandegiyar.info/).
// The legacy GitHub Pages build sets APP_BASE=/ZDriver-Prep/ to serve from the
// project subpath; the asset base and the PWA start_url/scope all follow it.
const base = process.env.APP_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,webp}'],
      },
      manifest: {
        name: 'رانندگی‌یار — همراه آزمون رانندگی',
        short_name: 'رانندگی‌یار',
        description: 'اپلیکیشن فارسی برای تمرین سوالات آیین‌نامه رانندگی، آزمون آزمایشی، مرور اشتباهات و پیگیری پیشرفت یادگیری',
        theme_color: '#4B3A8C',
        background_color: '#1F1A36',
        display: 'standalone',
        dir: 'rtl',
        lang: 'fa',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
