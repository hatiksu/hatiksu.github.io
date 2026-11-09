// Язык и тема: выбор посетителя (localStorage) важнее настроек браузера и системы.
import type { Lang } from './projects'

export type Theme = 'light' | 'dark'

export function detectLang(stored: string | null, languages: readonly string[]): Lang {
  if (stored === 'ru' || stored === 'en') return stored
  // Русскоязычным (и соседним языкам, где русский понимают) — русский, остальным — английский
  const first = languages.find(Boolean)?.toLowerCase() ?? 'ru'
  return /^(ru|uk|be|kk|ky|uz|tg|hy|az|ka)\b/.test(first) ? 'ru' : 'en'
}

export function detectTheme(stored: string | null, prefersLight: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored
  return prefersLight ? 'light' : 'dark'
}

/** Безопасный доступ к localStorage: в приватном режиме он может бросать исключения */
export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value)
    } catch {
      // не страшно: выбор просто не запомнится
    }
  },
}
