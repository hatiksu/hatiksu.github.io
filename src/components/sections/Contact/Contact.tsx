import type { Contacts } from '../../../types'
import { Button } from '../../ui/Button/Button'
import { Reveal } from '../../ui/Reveal/Reveal'
import styles from './Contact.module.css'

export function Contact({ contacts }: { contacts: Contacts }) {
  const hasEmail = Boolean(contacts.email)
  return (
    <section id="contact" className={styles.section}>
      <div className="container">
        <Reveal className={styles.card}>
          <div className={styles.inner}>
            <span className={styles.eyebrow}>Контакты</span>
            <h2 className={styles.title}>
              Есть идея? <span className="gradient-text">Давай сделаем</span>
            </h2>
            <p className={styles.text}>
              Открыт к проектам, коллаборациям и интересным задачам. Пиши — отвечу быстро.
            </p>
            <div className={styles.actions}>
              {hasEmail && (
                <Button href={`mailto:${contacts.email}`} variant="primary">
                  ✉ Написать на почту
                </Button>
              )}
              {contacts.telegram && (
                <Button href={contacts.telegram} external>
                  Telegram
                </Button>
              )}
              {contacts.github && (
                <Button href={contacts.github} variant={hasEmail ? 'ghost' : 'primary'} external>
                  GitHub
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
