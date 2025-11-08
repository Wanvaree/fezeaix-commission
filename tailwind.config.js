/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-up': {
          '0%': { transform: 'scale(0.95)', opacity: '0' }, // อาจปรับ scale เล็กน้อยเพื่อให้เร็วขึ้น
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out forwards', // ลดเวลา animation ให้เหลือ 0.2s
        'scale-up': 'scale-up 0.2s ease-out forwards', // ลดเวลา animation ให้เหลือ 0.2s
      },
    },
  },
  plugins: [],
}