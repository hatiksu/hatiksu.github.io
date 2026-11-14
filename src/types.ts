export interface Tech {
  name: string
  color: string
}

export type { PortfolioProject as Project } from './lib/projects'

export interface Contacts {
  github: string
  email: string
  telegram: string
}

export interface AppsData {
  apps: Record<string, { commit: string; shots: { desktop: string; mobile: string } | null; embedded?: boolean }>
}

export interface NavLink {
  id: string
  label: string
}
