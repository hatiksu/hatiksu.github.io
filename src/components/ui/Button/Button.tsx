import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'
import { Icon, type IconName } from '../Icon/Icon'
import styles from './Button.module.css'

interface ButtonProps {
  /** Ссылка; без неё рендерится кнопка */
  href?: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
  icon?: IconName
  external?: boolean
  /** Подпись мелким шрифтом под текстом (например, версия и размер) */
  note?: string
  onClick?: () => void
  ariaLabel?: string
}

/** Ссылка-кнопка с «магнитным» эффектом: тянется за курсором. */
export function Button({ href, children, variant = 'ghost', icon, external, note, onClick, ariaLabel }: ButtonProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 18, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 18, mass: 0.4 })

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * 0.25)
    y.set((e.clientY - (r.top + r.height / 2)) * 0.25)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const common = {
    className: `${styles.button} ${styles[variant]} ${note ? styles.withNote : ''}`,
    style: { x, y },
    onPointerMove,
    onPointerLeave: reset,
    whileTap: { scale: 0.96 },
    onClick,
    'aria-label': ariaLabel,
  }
  const content = (
    <>
      {icon && <Icon name={icon} className={styles.icon} />}
      <span className={styles.label}>
        {children}
        {note && <small className={styles.note}>{note}</small>}
      </span>
    </>
  )

  if (!href) {
    return (
      <motion.button ref={ref as React.Ref<HTMLButtonElement>} type="button" {...common}>
        {content}
      </motion.button>
    )
  }
  return (
    <motion.a ref={ref as React.Ref<HTMLAnchorElement>} href={href} {...common} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {content}
    </motion.a>
  )
}
