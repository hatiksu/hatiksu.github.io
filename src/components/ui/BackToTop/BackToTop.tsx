import { AnimatePresence, motion } from 'motion/react'
import { usePreferences } from '../../../hooks/usePreferences'
import { useScrollState } from '../../../hooks/useScrollState'
import styles from './BackToTop.module.css'

/** Кнопка «Наверх», появляется после прокрутки. */
export function BackToTop() {
  const { t } = usePreferences()
  const { y } = useScrollState()
  const visible = y > 700

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className={styles.button}
          aria-label={t.nav.toTop}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
