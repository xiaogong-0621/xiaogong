import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/backend/**', '**/web/**', '**/*.sql', '**/*.md'],
    },
  },
  build: {
    rollupOptions: {
      external: ['react-native-fs'],
    },
  },
})
