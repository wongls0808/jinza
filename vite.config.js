import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Element Plus 主包
          if (id.includes('node_modules/element-plus') && !id.includes('icons-vue')) {
            return 'element-plus'
          }
          // Element Plus 图标 - 按需分割避免循环依赖
          if (id.includes('@element-plus/icons-vue')) {
            return 'element-icons'
          }
          // ECharts
          if (id.includes('node_modules/echarts')) {
            return 'echarts'
          }
          // Vue 核心库
          if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router') || id.includes('node_modules/vue-i18n')) {
            return 'vendor'
          }
          // 工具库
          if (id.includes('node_modules/papaparse') || id.includes('node_modules/qrcode')) {
            return 'utils'
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    cssCodeSplit: true
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'vue-i18n',
      'element-plus',
      '@element-plus/icons-vue',
      'echarts'
    ]
  }
})