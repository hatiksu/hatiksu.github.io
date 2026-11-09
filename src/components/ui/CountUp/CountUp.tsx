import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'

interface CountUpProps {
  value: number | string
  suffix?: string
  duration?: number
}

/** Число, которое «набегает» от нуля, когда появляется на экране. */
export function CountUp({ value, suffix = '', duration = 1.6 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const isNumber = typeof value === 'number'
  const [display, setDisplay] = useState(isNumber && !reduce ? 0 : value)

  useEffect(() => {
    if (!isNumber || !inView || reduce) return
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, isNumber, value, duration, reduce])

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}
