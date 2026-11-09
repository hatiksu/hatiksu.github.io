export interface Tech {
  name: string
  color: string
}

/** Карточка проекта — собирается автоматически из файлов portfolio.json (см. scripts/sync-projects.ts) */
export type { PortfolioProject as Project } from './lib/projects'

export interface Contacts {
  github: string
  /** Пустая строка — не показывать */
  email: string
  telegram: string
}

/** Встроенные приложения и их скриншоты (scripts/build-apps.ts) */
export interface AppsData {
  apps: Record<string, { commit: string; shots: { desktop: string; mobile: string } | null }>
}

export interface NavLink {
  id: string
  label: string
}
