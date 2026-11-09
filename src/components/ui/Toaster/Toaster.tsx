import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { onToast } from '../../../lib/toast'
import styles from './Toaster.module.css'

/** Показывает последнее уведомление на пару секунд */
export function Toaster() {
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null)

  useEffect(() => {
    let timer = 0
    const off = onToast((text) => {
      setMessage({ id: Date.now(), text })
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setMessage(null), 2400)
    })
    return () => {
      off()
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className={styles.root} role="status" aria-live="polite">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message.id}
            className={styles.toast}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.2 } }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
