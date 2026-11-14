import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: { main: 'index.html', notFound: '404.html' },
    },
  },
})
