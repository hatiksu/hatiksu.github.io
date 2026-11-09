import { useContext } from 'react'
import { PreferencesContext, type Preferences } from '../context/preferences'

/** Текущий язык, тексты (t) и тема */
export function usePreferences(): Preferences {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences нужно вызывать внутри PreferencesProvider')
  return ctx
}
