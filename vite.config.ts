import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
// Note: Vite provides import.meta.env; we use process.env here without adding dotenv dependency

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        // 支持通过环境变量 BACKEND_URL 或 VITE_API_BASE_URL 指定代理目标（回退到本地）
        target: (process.env.BACKEND_URL || process.env.VITE_API_BASE_URL || 'http://localhost:8080').toString(),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500
  }
})
