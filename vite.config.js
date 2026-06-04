import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    host: true, // 允许局域网访问
  },
  // GitHub Pages 部署路径（项目名）
  // 如果部署到自定义域名或根路径，改为 base: '/'
  base: '/novel-writer/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
