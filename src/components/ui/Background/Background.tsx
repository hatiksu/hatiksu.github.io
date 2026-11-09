import { useEffect } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'
import styles from './Background.module.css'

/** Фон страницы: плавающие градиентные пятна, сетка и прожектор за курсором. */
export function Background() {
  const x = useSpring(useMotionValue(-1000), { stiffness: 80, damping: 20 })
  const y = useSpring(useMotionValue(-1000), { stiffness: 80, damping: 20 })
  const spotlight = useMotionTemplate`radial-gradient(600px circle at ${x}px ${y}px, rgba(124, 92, 255, 0.10), transparent 60%)`

  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [x, y])

  return (
    <div className={styles.root} aria-hidden="true">
      <div className={`${styles.blob} ${styles.b1}`} />
      <div className={`${styles.blob} ${styles.b2}`} />
      <div className={`${styles.blob} ${styles.b3}`} />
      <div className={styles.grid} />
      <motion.div className={styles.spotlight} style={{ background: spotlight }} />
    </div>
  )
}
