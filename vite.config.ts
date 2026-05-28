import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ZDriver-Prep/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
      manifest: {
        name: 'ZDriver Prep — همراه آزمون رانندگی',
        short_name: 'ZDriver',
        description: 'آمادگی برای آزمون تئوری رانندگی در ایران',
        theme_color: '#4B3A8C',
        background_color: '#1F1A36',
        display: 'standalone',
        dir: 'rtl',
        lang: 'fa',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})
