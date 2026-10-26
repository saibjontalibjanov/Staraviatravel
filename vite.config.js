import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: 'django-backend',
  server: {
    port: 3000,
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/django-backend/**', '**/legacy/**'] },
    watch: { ignored: ['**/django-backend/**', '**/legacy/**'] },
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/office': { target: 'http://127.0.0.1:8000', changeOrigin: false },
      '/static': { target: 'http://127.0.0.1:8000', changeOrigin: false },
      '/uploads': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
    open: true
  }
})
