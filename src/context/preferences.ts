import { createContext } from 'react'
import type { Dict } from '../i18n/ru'
import type { Theme } from '../lib/prefs'
import type { Lang } from '../lib/projects'

export interface Preferences {
  lang: Lang
  t: Dict
  theme: Theme
  setLang: (lang: Lang) => void
  toggleLang: () => void
  toggleTheme: () => void
}

export const PreferencesContext = createContext<Preferences | null>(null)
