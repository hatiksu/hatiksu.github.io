// Данные сайта: всё, что нужно менять, — здесь.
import type { SiteConfig } from '../types'
import generated from './projects.generated.json'

const stack = [
  { name: 'React', color: '#61dafb' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'JavaScript', color: '#f7df1e' },
  { name: 'HTML5', color: '#e34f26' },
  { name: 'CSS3', color: '#1572b6' },
  { name: 'Vite', color: '#a855f7' },
  { name: 'Motion', color: '#ff4d8d' },
  { name: 'Canvas API', color: '#22d3ee' },
  { name: 'SVG', color: '#ffb13b' },
  { name: 'Web Workers', color: '#e879f9' },
  { name: 'Web Audio', color: '#38bdf8' },
  { name: 'Claude API', color: '#d97757' },
  { name: 'ONNX / ML в браузере', color: '#7c5cff' },
  { name: 'PWA', color: '#5a0fc8' },
  { name: 'IndexedDB', color: '#f59e0b' },
  { name: 'Node.js', color: '#5fa04e' },
  { name: 'Git', color: '#f05032' },
  { name: 'GitHub', color: '#ffffff' },
  { name: 'Playwright', color: '#2ead33' },
  { name: 'Vitest', color: '#fcc72b' },
]

// Проекты подтягиваются автоматически: скрипт npm run sync находит файлы portfolio.json
// в репозиториях на GitHub и записывает их сюда. Вручную этот список не правим.
const projects: SiteConfig['projects'] = generated.projects as SiteConfig['projects']

export const site: SiteConfig = {
  name: 'Hatiksu',
  status: 'Открыт к новым проектам',
  roles: ['Веб-разработчик', 'Фронтенд на React', 'Интегрирую ИИ в продукты', 'Делаю быстрые интерфейсы'],
  about:
    'Создаю веб-приложения, которые приятно открыть: быстрые интерфейсы, аккуратный код и умные функции на базе ИИ — от обработки изображений до ассистентов на LLM.',

  nav: [
    { id: 'skills', label: 'Навыки' },
    { id: 'stack', label: 'Стек' },
    { id: 'projects', label: 'Проекты' },
    { id: 'contact', label: 'Контакты' },
  ],

  stats: [
    { value: stack.length, label: 'технологий в арсенале' },
    { value: projects.length, label: 'проектов в портфолио' },
    { value: '∞', label: 'идей в работе' },
  ],

  skills: [
    { icon: '⚡', title: 'Фронтенд', text: 'Современные интерфейсы на React и TypeScript — быстрые, адаптивные, без лишнего веса.' },
    { icon: '🤖', title: 'Интеграция ИИ', text: 'Встраиваю Claude API и нейросети прямо в браузер: ассистенты, анализ, генерация.' },
    { icon: '🎨', title: 'Работа с графикой', text: 'Canvas API, обработка изображений по пикселям, фильтры и эффекты в реальном времени.' },
    { icon: '🧩', title: 'UI/UX и анимации', text: 'Плавные анимации и продуманный интерфейс, которым удобно пользоваться с первого раза.' },
    { icon: '🚀', title: 'Быстрый запуск', text: 'От идеи до работающего прототипа за дни, а не месяцы. Сборка и деплой на GitHub Pages.' },
    { icon: '🛠️', title: 'Чистый код', text: 'Понятная структура, типизация, Git — проект легко поддерживать и развивать.' },
  ],

  stack,
  projects,

  contacts: {
    github: 'https://github.com/hatiksu',
    email: 'hatiksuofficial@gmail.com',
    telegram: 'https://t.me/whoareyou_q',
  },
}
