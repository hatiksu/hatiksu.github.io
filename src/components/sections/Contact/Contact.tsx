import { usePreferences } from '../../../hooks/usePreferences'
import type { Contacts } from '../../../types'
import { Button } from '../../ui/Button/Button'
import { Reveal } from '../../ui/Reveal/Reveal'
import { site } from '../../../data/site'
import { ContactForm } from './ContactForm/ContactForm'
import styles from './Contact.module.css'

export function Contact({ contacts }: { contacts: Contacts }) {
  const { t } = usePreferences()
  const hasEmail = Boolean(contacts.email)
  return (
    <section id="contact" className={styles.section}>
      <div className="container">
        <Reveal className={styles.card}>
          <div className={styles.inner}>
            <span className={styles.eyebrow}>{t.contact.eyebrow}</span>
            <h2 className={styles.title}>
              {t.contact.title} <span className="gradient-text">{t.contact.accent}</span>
            </h2>
            <p className={styles.text}>
              {t.contact.text}
            </p>
            {site.contactEndpoint && (
              <>
                <ContactForm endpoint={site.contactEndpoint} />
                <p className={styles.or}>{t.contact.or}</p>
              </>
            )}
            <div className={styles.actions}>
              {hasEmail && (
                <Button href={`mailto:${contacts.email}`} variant={site.contactEndpoint ? 'ghost' : 'primary'}>
                  {t.contact.mail}
                </Button>
              )}
              {contacts.telegram && (
                <Button href={contacts.telegram} icon="send" external>
                  Telegram
                </Button>
              )}
              {contacts.github && (
                <Button href={contacts.github} variant={hasEmail ? 'ghost' : 'primary'} icon="github" external>
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
