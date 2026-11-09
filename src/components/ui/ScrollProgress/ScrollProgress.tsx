import { motion, useScroll, useSpring } from 'motion/react'
import styles from './ScrollProgress.module.css'

/** Полоса прогресса прокрутки вверху страницы. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25, restDelta: 0.001 })
  return <motion.div className={styles.bar} style={{ scaleX }} aria-hidden="true" />
}
