// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const repoName = 'fezeaix-commission'; 

export default defineConfig({
  base: `/${repoName}/`, 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
      },
      manifest: {
        name: 'Fezeaix Commission',
        short_name: 'Fezeaix',
        description: 'Fezeaix Artist Commission Dashboard',
        theme_color: '#1e3a8a', 
        start_url: `/${repoName}/`, 
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
}); 
// ☝️ สังเกตว่าโค้ดที่ถูกต้องต้องมีวงเล็บปิดครบถ้วน