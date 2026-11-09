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

export interface Project {
  /** Какой схематичный макет показать в карточке */
  mockup: 'editor' | 'finance'
  title: string
  text: string
  tags: string[]
  points: string[]
  demo?: string
  code?: string
}

export interface Contacts {
  github: string
  /** Пустая строка — не показывать */
  email: string
  telegram: string
}

export interface SiteConfig {
  name: string
  status: string
  roles: string[]
  about: string
  nav: NavLink[]
  stats: Stat[]
  skills: Skill[]
  stack: Tech[]
  projects: Project[]
  contacts: Contacts
}
