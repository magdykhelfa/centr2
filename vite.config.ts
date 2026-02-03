import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url' // سطر إضافي للأمان

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  base: '/centr2/', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
