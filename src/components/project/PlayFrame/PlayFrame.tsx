import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll'
import { usePreferences } from '../../../hooks/usePreferences'
import { Icon } from '../../ui/Icon/Icon'
import styles from './PlayFrame.module.css'

interface PlayFrameProps {
  open: boolean
  slug: string
  title: string
  onClose: () => void
}

/** Приложение, встроенное в сайт: открывается поверх страницы в окне-«устройстве» */
export function PlayFrame({ open, slug, title, onClose }: PlayFrameProps) {
  useLockBodyScroll(open)
  return <AnimatePresence>{open && <Player key={slug} slug={slug} title={title} onClose={onClose} />}</AnimatePresence>
}

function Player({ slug, title, onClose }: Omit<PlayFrameProps, 'open'>) {
  const { t } = usePreferences()
  const src = `apps/${slug}/`
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Сборки приложений появляются после npm run apps; без них показываем подсказку, а не 404
    let alive = true
    fetch(`${src}index.html`, { method: 'HEAD' })
      .then((r) => alive && !r.ok && setState('missing'))
      .catch(() => alive && setState('missing'))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => {
      alive = false
      window.removeEventListener('keydown', onKey)
    }
  }, [src, onClose])

  return (
    <motion.div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className={styles.window}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <header className={styles.toolbar}>
          <span className={styles.title}>{title}</span>
          <a className={styles.tool} href={src} target="_blank" rel="noopener" aria-label={t.project.newTab} title={t.project.newTab}>
            <Icon name="external" />
          </a>
          <button
            ref={closeRef}
            type="button"
            className={styles.tool}
            onClick={onClose}
            aria-label={t.project.close}
            title={t.project.close}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.screen}>
          {state === 'missing' ? (
            <p className={styles.message}>{t.project.unavailable}</p>
          ) : (
            <>
              {state === 'loading' && <p className={styles.message}>{t.project.loading}</p>}
              <iframe
                className={styles.frame}
                src={src}
                title={title}
                allow="fullscreen; clipboard-write; autoplay"
                onLoad={() => setState((s) => (s === 'missing' ? s : 'ready'))}
                style={{ opacity: state === 'ready' ? 1 : 0 }}
              />
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
