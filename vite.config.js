// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const repoName = 'fezeaix-commission'; 

export default defineConfig({
  base: `/${repoName}/`, 
  // 🚨 เพิ่ม build object ตรงนี้
  build: {
    chunkSizeWarningLimit: 1000, // 1000 kB = 1 MB (เพิ่มจากค่าเริ่มต้น 500)
  },
  
  plugins: [
    react(),
    VitePWA({
      // ... (โค้ด PWA เดิม)
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, 
      },
      // ...
    }),
  ],
});