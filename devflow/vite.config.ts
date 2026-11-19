import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type PluginOption } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    ...(mode === 'analyze'
      ? [
          visualizer({
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
          }) as PluginOption,
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'echarts',
              test: /[\\/]node_modules[\\/](echarts|zrender)[\\/]/,
              priority: 30,
            },
            {
              name: 'markdown',
              test: /[\\/]node_modules[\\/](markdown-it|dompurify|linkify-it|mdurl|uc\.micro)[\\/]/,
              priority: 20,
            },
            {
              name: 'pdf',
              test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/,
              priority: 25,
            },
            {
              name: 'mammoth',
              test: /[\\/]node_modules[\\/]mammoth[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 5,
              maxSize: 300_000,
            },
          ],
        },
      },
    },
  },
}))
