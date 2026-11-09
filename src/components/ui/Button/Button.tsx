import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'
import styles from './Button.module.css'

interface ButtonProps {
  href: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
  external?: boolean
  onClick?: () => void
}

/** Ссылка-кнопка с «магнитным» эффектом: тянется за курсором. */
export function Button({ href, children, variant = 'ghost', external, onClick }: ButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null)
  const reduce = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 18, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 18, mass: 0.4 })

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * 0.3)
    y.set((e.clientY - (r.top + r.height / 2)) * 0.3)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      className={`${styles.button} ${styles[variant]}`}
      style={{ x, y }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span className={styles.label}>{children}</span>
    </motion.a>
  )
}
