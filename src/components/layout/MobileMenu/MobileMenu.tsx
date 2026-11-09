import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import type { Contacts, NavLink } from '../../../types'
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll'
import { usePreferences } from '../../../hooks/usePreferences'
import { PrefsToggles } from '../../ui/PrefsToggles/PrefsToggles'
import { copyEmail } from '../../../lib/toast'
import styles from './MobileMenu.module.css'

interface MobileMenuProps {
  id: string
  open: boolean
  links: NavLink[]
  active: string | null
  contacts: Contacts
  onClose: () => void
}

const overlay: Variants = {
  closed: {
    clipPath: 'circle(0px at calc(100% - 40px) 36px)',
    transition: { duration: 0.5, ease: [0.65, 0, 0.35, 1], when: 'afterChildren' },
  },
  open: {
    clipPath: 'circle(150% at calc(100% - 40px) 36px)',
    transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1], when: 'beforeChildren', staggerChildren: 0.07 },
  },
}

const item: Variants = {
  closed: { opacity: 0, y: 40, transition: { duration: 0.2 } },
  open: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

/** Полноэкранное мобильное меню с раскрытием кругом из бургера. */
export function MobileMenu({ id, open, links, active, contacts, onClose }: MobileMenuProps) {
  const { t } = usePreferences()
  const firstLink = useRef<HTMLAnchorElement>(null)
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => firstLink.current?.focus(), 400)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, onClose])

  const socials = [
    contacts.github && { label: 'GitHub', href: contacts.github },
    contacts.telegram && { label: 'Telegram', href: contacts.telegram },
    contacts.email && { label: t.nav.mail, href: `mailto:${contacts.email}` },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={id}
          className={styles.menu}
          role="dialog"
          aria-modal="true"
          aria-label={t.nav.menu}
          variants={overlay}
          initial="closed"
          animate="open"
          exit="closed"
        >
          <nav className={styles.nav}>
            {links.map((link, i) => (
              <motion.a
                key={link.id}
                ref={i === 0 ? firstLink : undefined}
                href={`#${link.id}`}
                className={`${styles.link} ${active === link.id ? styles.active : ''}`}
                variants={item}
                onClick={onClose}
              >
                <span className={styles.index}>0{i + 1}</span>
                {link.label}
              </motion.a>
            ))}
          </nav>
          <motion.div className={styles.footer} variants={item}>
            <PrefsToggles />
            {socials.map((s) =>
              s.href.startsWith('mailto:') ? (
                // mailto: — без новой вкладки: на телефоне в новой вкладке она часто не срабатывает
                <a key={s.label} href={s.href} onClick={() => copyEmail(contacts.email, t.contact.mailCopied)}>
                  {s.label} ↗
                </a>
              ) : (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label} ↗
                </a>
              ),
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
