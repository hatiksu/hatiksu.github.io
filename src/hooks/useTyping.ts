import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/** Эффект печатной машинки: печатает и стирает фразы по очереди. */
export function useTyping(phrases: string[], { typeMs = 70, deleteMs = 35, holdMs = 1600 } = {}) {
  const reduce = useReducedMotion()
  const [text, setText] = useState('')

  useEffect(() => {
    if (!phrases.length || reduce) return
    let phrase = 0
    let length = 0
    let deleting = false
    let timer: number

    const tick = () => {
      const word = phrases[phrase]
      length += deleting ? -1 : 1
      setText(word.slice(0, length))

      let delay = deleting ? deleteMs : typeMs
      if (!deleting && length === word.length) {
        deleting = true
        delay = holdMs
      } else if (deleting && length === 0) {
        deleting = false
        phrase = (phrase + 1) % phrases.length
        delay = 300
      }
      timer = window.setTimeout(tick, delay)
    }
    timer = window.setTimeout(tick, 600)
    return () => window.clearTimeout(timer)
  }, [phrases, reduce, typeMs, deleteMs, holdMs])

  // При «уменьшить движение» сразу показываем первую фразу без анимации
  return reduce ? (phrases[0] ?? '') : text
}
