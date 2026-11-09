import { AnimatePresence, motion } from 'motion/react'
import { usePreferences } from '../../../hooks/usePreferences'
import { Icon } from '../Icon/Icon'
import styles from './PrefsToggles.module.css'

/** Переключатели языка (RU/EN) и темы */
export function PrefsToggles({ className = '' }: { className?: string }) {
  const { t, lang, theme, toggleLang, toggleTheme } = usePreferences()
  return (
    <div className={`${styles.group} ${className}`}>
      <button type="button" className={styles.button} onClick={toggleLang} aria-label={t.prefs.lang} title={t.prefs.lang}>
        <span className={styles.lang}>{lang === 'ru' ? 'EN' : 'RU'}</span>
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? t.prefs.toLight : t.prefs.toDark}
        title={theme === 'dark' ? t.prefs.toLight : t.prefs.toDark}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            className={styles.icon}
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}
