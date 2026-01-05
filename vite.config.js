import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000, // رفع الحد لـ 2000 كيلوبايت
    rollupOptions: {
      output: {
        manualChunks(id) {
          // تجزئة المكتبات الكبيرة لملفات منفصلة لتقليل حجم الـ Chunk الواحد
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('framer-motion')) return 'vendor-framer';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor'; // باقي المكتبات
          }
        },
      },
    },
  },
})
