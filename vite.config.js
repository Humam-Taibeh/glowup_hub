import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000, // تم رفع الحد لـ 2000kb لتجنب التنبيه في Vercel
  }
})
