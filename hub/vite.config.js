import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const appVersion = (
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.npm_package_version ||
  'local'
).slice(0, 7);

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion)
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Thư viện nặng dùng chung được đặt tên riêng: nhiều miniapp cùng dùng thì
        // chỉ tải một lần, và khi bundle phình lên còn biết thủ phạm là ai.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('pdfjs-dist')) return 'vendor-pdfjs';
          if (id.includes('pdf-lib')) return 'vendor-pdf-lib';
          if (id.includes('/exceljs/')) return 'vendor-exceljs';
          if (id.includes('/xlsx/')) return 'vendor-xlsx';
          if (id.includes('/mammoth/')) return 'vendor-mammoth';
          if (id.includes('/docx-preview/')) return 'vendor-docx-preview';
          if (id.includes('/docx/')) return 'vendor-docx';
          if (id.includes('/jspdf/')) return 'vendor-jspdf';
          if (id.includes('/html2canvas/')) return 'vendor-html2canvas';
          if (id.includes('/pptxgenjs/')) return 'vendor-pptxgenjs';
          if (id.includes('qr-code-styling')) return 'vendor-qrcode';
          if (id.includes('/jsbarcode/')) return 'vendor-jsbarcode';
          return undefined;
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
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
