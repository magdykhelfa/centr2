import { defineConfig } from 'vite' // السطر ده هو اللي ناقص!
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/centr2/', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
