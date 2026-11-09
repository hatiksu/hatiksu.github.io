import { useEffect, useState } from 'react'

/** Возвращает id секции, которая сейчас в зоне видимости. */
export function useScrollSpy(ids: string[], offset = 120): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('|')

  useEffect(() => {
    const sectionIds = key.split('|')
    const update = () => {
      let current: string | null = null
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - offset <= 0) current = id
      }
      // У самого низа страницы подсвечиваем последнюю секцию
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sectionIds[sectionIds.length - 1] ?? current
      }
      setActive(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [key, offset])

  return active
}
