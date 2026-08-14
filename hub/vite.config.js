import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pdfjs-dist')) return 'vendor-pdf';
            if (id.includes('docx') || id.includes('exceljs') || id.includes('xlsx')) return 'vendor-office';
            if (id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
        }
      }
    }
  },

  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: [react()],
  server: {
    port: 3000,
    open: false
  }
});
