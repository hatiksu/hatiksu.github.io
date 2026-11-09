import { motion } from 'motion/react'
import { usePreferences } from '../../../hooks/usePreferences'
import styles from './Burger.module.css'

interface BurgerProps {
  open: boolean
  onToggle: () => void
  controls: string
}

const transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] } as const

/** Кнопка-бургер, которая превращается в крестик. */
export function Burger({ open, onToggle, controls }: BurgerProps) {
  const { t } = usePreferences()
  return (
    <button
      type="button"
      className={styles.burger}
      onClick={onToggle}
      aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
      aria-expanded={open}
      aria-controls={controls}
    >
      <motion.span
        className={styles.line}
        animate={open ? { y: 7, rotate: 45 } : { y: 0, rotate: 0 }}
        transition={transition}
      />
      <motion.span
        className={styles.line}
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={transition}
      />
      <motion.span
        className={`${styles.line} ${styles.short}`}
        animate={open ? { y: -7, rotate: -45, width: 22 } : { y: 0, rotate: 0, width: 14 }}
        transition={transition}
      />
    </button>
  )
}
