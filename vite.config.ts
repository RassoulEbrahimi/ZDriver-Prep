import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Base path and PWA behavior are env-driven so a separate test build
// (--mode ranandegiyar-test) can deploy under a different path with the service
// worker disabled. Defaults reproduce the production GitHub Pages config exactly:
// base '/ZDriver-Prep/' and PWA enabled. When VITE_DISABLE_PWA=1 the plugin is
// kept (so the `virtual:pwa-register/react` import in UpdatePrompt still resolves)
// but set to disable mode — no service worker is generated or registered.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const base = env.VITE_BASE_PATH || '/ZDriver-Prep/'
  const pwaDisabled = env.VITE_DISABLE_PWA === '1'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        disable: pwaDisabled,
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
          start_url: base,
          scope: base,
          icons: [
            { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          ],
        },
      }),
    ],
  }
})
