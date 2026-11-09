import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from '../i18n/en'
import { ru } from '../i18n/ru'
import { detectLang, detectTheme, storage, type Theme } from '../lib/prefs'
import type { Lang } from '../lib/projects'
import { PreferencesContext, type Preferences } from './preferences'

/** Язык и тема сайта: запоминаются в браузере, применяются к <html> (lang, data-theme) */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang(storage.get('lang'), navigator.languages ?? [navigator.language]))
  const [theme, setTheme] = useState<Theme>(() => detectTheme(storage.get('theme'), matchMedia('(prefers-color-scheme: light)').matches))
  const t = lang === 'ru' ? ru : en

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
  }, [lang, t])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f6fb' : '#07080c')
  }, [theme])

  const setLang = useCallback((next: Lang) => {
    storage.set('lang', next)
    setLangState(next)
  }, [])

  const toggleLang = useCallback(() => setLang(lang === 'ru' ? 'en' : 'ru'), [lang, setLang])

  const toggleTheme = useCallback(() => {
    const apply = () =>
      setTheme((prev) => {
        const next = prev === 'dark' ? 'light' : 'dark'
        storage.set('theme', next)
        return next
      })
    // Плавная смена темы через View Transitions, где они есть
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) doc.startViewTransition(apply)
    else apply()
  }, [])

  const value = useMemo<Preferences>(() => ({ lang, t, theme, setLang, toggleLang, toggleTheme }), [lang, t, theme, setLang, toggleLang, toggleTheme])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
