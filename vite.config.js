import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // رفع الحد لـ 3000 كيلوبايت لضمان عدم ظهور التحذير في Vercel
    chunkSizeWarningLimit: 3000, 
    rollupOptions: {
      output: {
        // توزيع المكتبات لملفات منفصلة (Code Splitting) لزيادة الأداء
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor';
          }
        },
      },
    },
  },
})
