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
          // Helper nội bộ của Vite/Rollup (preload, CommonJS interop) mà không gán chunk
          // thì Rollup nhét vào vendor chunk đầu tiên dùng nó — trang chủ từng phải tải
          // cả vendor-jspdf + vendor-qrcode (~436 KB) chỉ vì hai helper vài trăm byte.
          if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers')) return 'runtime-helpers';
          if (!id.includes('node_modules')) return undefined;
          // JSZip (và phụ thuộc của nó) phải có chunk riêng: không gán thì Rollup nhét nó vào
          // vendor-docx-preview/vendor-mammoth, và mọi miniapp chỉ cần nén ZIP phải tải
          // kèm ~566 KB thư viện đọc Word.
          if (/\/node_modules\/(jszip|pako|lie|immediate|setimmediate|readable-stream|process-nextick-args|core-util-is|isarray|safe-buffer|string_decoder|util-deprecate|inherits)\//.test(id)) {
            return 'vendor-jszip';
          }
          // Bản legacy (có polyfill cho Safari/Chrome cũ) dùng bởi utils/pdfjs.js; tách riêng để
          // miniapp PDF không phải tải cả hai bản build của pdf.js.
          if (id.includes('pdfjs-dist/legacy')) return 'vendor-pdfjs-legacy';
          if (id.includes('pdfjs-dist')) return 'vendor-pdfjs';
          if (id.includes('pdf-lib')) return 'vendor-pdf-lib';
          if (id.includes('/exceljs/')) return 'vendor-exceljs';
          if (id.includes('/xlsx/')) return 'vendor-xlsx';
          if (id.includes('/mammoth/')) return 'vendor-mammoth';
          if (id.includes('/docx-preview/')) return 'vendor-docx-preview';
          if (id.includes('/docx/')) return 'vendor-docx';
          if (id.includes('/jspdf/')) return 'vendor-jspdf';
          if (id.includes('/html2canvas/')) return 'vendor-html2canvas';
          if (id.includes('qr-code-styling')) return 'vendor-qrcode';
          if (id.includes('/jsbarcode/')) return 'vendor-jsbarcode';
          if (id.includes('@imgly/background-removal')) return 'vendor-imgly';
          if (id.includes('@mediapipe')) return 'vendor-mediapipe';
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
