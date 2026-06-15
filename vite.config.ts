import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ZDriver-Prep/',
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
        description: 'آمادگی برای آزمون تئوری رانندگی در ایران',
        theme_color: '#4B3A8C',
        background_color: '#1F1A36',
        display: 'standalone',
        dir: 'rtl',
        lang: 'fa',
        start_url: '/ZDriver-Prep/',
        scope: '/ZDriver-Prep/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})
