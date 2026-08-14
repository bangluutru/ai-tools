import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Ensure assets use relative paths (important for Cloudflare Pages)
    assetsDir: 'assets',
  },
})
