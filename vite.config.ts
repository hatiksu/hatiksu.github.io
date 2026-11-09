import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Относительные пути: сайт работает из любой подпапки (например, на GitHub Pages)
  base: './',
  plugins: [react()],
})
