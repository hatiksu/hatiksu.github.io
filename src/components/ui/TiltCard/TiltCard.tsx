import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react'
import styles from './TiltCard.module.css'

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Максимальный наклон в градусах */
  max?: number
}

/** Карточка с 3D-наклоном и подсветкой за курсором. */
export function TiltCard({ children, className = '', max = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const spring = { stiffness: 200, damping: 20 }
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring)

  const onPointerMove = (e: React.PointerEvent) => {
    if (!ref.current || e.pointerType !== 'mouse') return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    ref.current.style.setProperty('--mx', `${x * 100}%`)
    ref.current.style.setProperty('--my', `${y * 100}%`)
    if (!reduce) {
      px.set(x)
      py.set(y)
    }
  }
  const reset = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      className={`${styles.card} ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  )
}
