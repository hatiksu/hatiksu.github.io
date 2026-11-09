import { useEffect, useState } from 'react'

interface ScrollState {
  /** Страница прокручена дальше порога */
  scrolled: boolean
  /** Пользователь листает вниз (для скрытия шапки) */
  hidden: boolean
  y: number
}

export function useScrollState(threshold = 24): ScrollState {
  const [state, setState] = useState<ScrollState>({ scrolled: false, hidden: false, y: 0 })

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const goingDown = y > lastY + 4
        const goingUp = y < lastY - 4
        setState((prev) => ({
          y,
          scrolled: y > threshold,
          hidden: y < 200 ? false : goingDown ? true : goingUp ? false : prev.hidden,
        }))
        lastY = y
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return state
}
