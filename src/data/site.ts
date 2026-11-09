// Данные сайта, не зависящие от языка. Тексты — в src/i18n/ru.ts и en.ts.
import type { AppsData, Contacts, Tech } from '../types'
import type { GithubStats } from '../lib/github'
import type { PortfolioProject } from '../lib/projects'
import apps from './apps.generated.json'
import github from './github.generated.json'
import generated from './projects.generated.json'

const stack: Tech[] = [
  { name: 'React', color: '#61dafb' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'JavaScript', color: '#f7df1e' },
  { name: 'HTML5', color: '#e34f26' },
  { name: 'CSS3', color: '#1572b6' },
  { name: 'Vite', color: '#a855f7' },
  { name: 'Motion', color: '#ff4d8d' },
  { name: 'Canvas API', color: '#22d3ee' },
  { name: 'WebGL', color: '#e0457b' },
  { name: 'SVG', color: '#ffb13b' },
  { name: 'Web Workers', color: '#e879f9' },
  { name: 'Web Audio', color: '#38bdf8' },
  { name: 'Claude API', color: '#d97757' },
  { name: 'ONNX / ML', color: '#7c5cff' },
  { name: 'PWA', color: '#5a0fc8' },
  { name: 'IndexedDB', color: '#f59e0b' },
  { name: 'Electron', color: '#47848f' },
  { name: 'Node.js', color: '#5fa04e' },
  { name: 'Git', color: '#f05032' },
  { name: 'GitHub Actions', color: '#2088ff' },
  { name: 'Playwright', color: '#2ead33' },
  { name: 'Vitest', color: '#fcc72b' },
]

export const site = {
  name: 'Hatiksu',
  /** Адрес сайта — для ссылок «Поделиться» и картинок превью */
  url: 'https://hatiksu.github.io/',
  /** Разделы главной в порядке появления */
  sections: ['skills', 'stack', 'projects', 'activity', 'contact'] as const,
  stack,
  // Проекты, встроенные приложения и статистика собираются скриптами npm run sync и npm run apps.
  // Вручную эти списки не правим.
  projects: generated.projects as PortfolioProject[],
  apps: (apps as AppsData).apps,
  github: github as GithubStats,
  /** Cloudflare Worker формы «Написать мне» (worker/); задаётся при сборке переменной VITE_CONTACT_ENDPOINT */
  contactEndpoint: (import.meta.env.VITE_CONTACT_ENDPOINT ?? '').trim(),
  contacts: {
    github: 'https://github.com/hatiksu',
    email: 'hatiksuofficial@gmail.com',
    telegram: 'https://t.me/whoareyou_q',
  } satisfies Contacts,
}

export type SectionId = (typeof site.sections)[number]
