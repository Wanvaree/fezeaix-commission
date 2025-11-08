// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// ชื่อ Repository ของคุณ
const repoName = 'fezeaix-commission'; 

export default defineConfig({
  // กำหนด Base Path ให้กับ Vite สำหรับ GitHub Pages
  base: `/${repoName}/`, 
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Cache assets ที่จำเป็น
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        
        // 🚨 แก้ไข: เพิ่มขีดจำกัดขนาดไฟล์เป็น 100MB เพื่อรองรับรูปภาพขนาดใหญ่
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, 
      },
      manifest: {
        name: 'Fezeaix Commission',
        short_name: 'Fezeaix',
        description: 'Fezeaix Artist Commission Dashboard',
        theme_color: '#1e3a8a', 
        // start_url ต้องใช้ Base Path
        start_url: `/${repoName}/`, 
        icons: [
          // **NOTE:** คุณต้องสร้างและวางไฟล์เหล่านี้ไว้ในโฟลเดอร์ `public`
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});