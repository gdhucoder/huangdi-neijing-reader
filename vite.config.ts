import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const deployBase = process.env.GITHUB_ACTIONS ? '/huangdi-neijing-reader/' : '/'

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    devOptions: { enabled: true },
    manifest: { name: '黄帝内经·精选', short_name: '黄帝内经', lang: 'zh-CN', display: 'standalone', start_url: './', scope: './', theme_color: '#173f36', background_color: '#f5f0e7', icons: [{ src: './favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] },
    workbox: { navigateFallback: `${deployBase}index.html`, runtimeCaching: [{ urlPattern: ({ url }) => /\/books\/.*\.json$/.test(url.pathname), handler: 'StaleWhileRevalidate', options: { cacheName: 'publication-json', expiration: { maxEntries: 32, maxAgeSeconds: 2592000 } } }] },
  })],
  base: deployBase,
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], css: true },
})
