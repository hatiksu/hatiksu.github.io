import { useEffect } from 'react'

/** Блокирует прокрутку страницы, пока locked = true (для мобильного меню). */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    document.body.classList.add('scroll-locked')
    return () => document.body.classList.remove('scroll-locked')
  }, [locked])
}
