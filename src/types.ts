export interface NavLink {
  id: string
  label: string
}

export interface Stat {
  /** Число для анимации счётчика или готовая строка (например, «∞») */
  value: number | string
  suffix?: string
  label: string
}

export interface Skill {
  icon: string
  title: string
  text: string
}

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

import type { PortfolioProject } from './lib/projects'

export interface SiteConfig {
  name: string
  status: string
  roles: string[]
  about: string
  nav: NavLink[]
  stats: Stat[]
  skills: Skill[]
  stack: Tech[]
  projects: PortfolioProject[]
  contacts: Contacts
}
