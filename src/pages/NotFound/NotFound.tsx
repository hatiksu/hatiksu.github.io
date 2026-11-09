import { usePreferences } from '../../hooks/usePreferences'
import { BreakoutGame } from '../../components/ui/BreakoutGame/BreakoutGame'
import { Button } from '../../components/ui/Button/Button'
import styles from './NotFound.module.css'

interface NotFoundProps {
  title?: string
  text?: string
  /** Ссылка «На главную»: на странице 404.html — абсолютная, внутри сайта — якорь */
  homeHref?: string
}

/** «Страница не найдена» с мини-игрой, чтобы было не так обидно */
export function NotFound({ title, text, homeHref = '#top' }: NotFoundProps) {
  const { t } = usePreferences()
  return (
    <section className={`container ${styles.page}`}>
      <div className={styles.copy}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>{title ?? t.notFound.title}</h1>
        <p className={styles.text}>{text ?? t.notFound.text}</p>
        <p className={styles.hint}>{t.notFound.hint}</p>
        <Button href={homeHref} variant="primary" icon="back">
          {t.project.home}
        </Button>
      </div>
      <BreakoutGame />
    </section>
  )
}
