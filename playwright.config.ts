import { defineConfig, devices } from '@playwright/test'

const PORT = 4182

// E2E-тесты против собранной версии: компьютер и телефон.
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: 'off',
    // Язык сайта выбирается по браузеру — тесты проверяют русскую версию, английскую включают кнопкой
    locale: 'ru-RU',
    colorScheme: 'dark',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Форма «Написать мне» в тестах отправляется на подставной адрес, запросы перехватываются
    env: { VITE_CONTACT_ENDPOINT: 'https://formsubmit.test/ajax/test' },
  },
})
