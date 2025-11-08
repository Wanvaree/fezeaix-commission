// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs'; // 🚨 Import Node.js Module 'fs'
import path from 'path'; // 🚨 Import Node.js Module 'path'

// ชื่อ Repository ของคุณ
const repoName = 'fezeaix-commission'; 

// 🚨 ฟังก์ชันสำหรับคัดลอก index.html ไปเป็น 404.html
const copyIndexTo404Plugin = () => ({
  name: 'copy-index-to-404',
  closeBundle() {
    // กำหนดพาธของไฟล์ index.html และ 404.html ในโฟลเดอร์ dist
    const indexPath = path.resolve(__dirname, 'dist', 'index.html');
    const notFoundPath = path.resolve(__dirname, 'dist', '404.html');
    
    // ตรวจสอบว่า index.html มีอยู่จริง แล้วคัดลอก
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, notFoundPath);
      // ข้อความใน Console เมื่อคัดลอกสำเร็จ
      console.log('Copied index.html to 404.html for GitHub Pages SPA routing.');
    }
  },
});


export default defineConfig({
  // กำหนด Base Path ให้กับ Vite สำหรับ GitHub Pages
  base: `/${repoName}/`, 
  
  // แก้ไข: เพิ่ม build object เพื่อเพิ่มขีดจำกัด Warning Size
  build: {
    chunkSizeWarningLimit: 1000, // 1000 kB = 1 MB 
  },
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        // แก้ไข: เพิ่มขีดจำกัด PWA
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, 
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
    // 🚨 เพิ่ม Plugin คัดลอกไฟล์ที่นี่
    copyIndexTo404Plugin(),
  ],
});