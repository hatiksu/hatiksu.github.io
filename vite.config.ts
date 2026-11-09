import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Сайт живёт в корне https://hatiksu.github.io: абсолютные пути нужны странице 404,
  // которую GitHub Pages отдаёт по любому адресу (в том числе /a/b/c)
  base: '/',
  plugins: [react()],
  build: {
    rolldownOptions: {
      // Две страницы: сам сайт и 404 с мини-игрой
      input: { main: 'index.html', notFound: '404.html' },
    },
  },
})
