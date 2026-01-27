export default defineConfig({
  plugins: [react()],
  base: '/centr2/', // لازم يكون نفس اسم الريبو بالظبط
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
