import { useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { Contacts, NavLink } from '../../../types'
import { usePreferences } from '../../../hooks/usePreferences'
import { useScrollSpy } from '../../../hooks/useScrollSpy'
import { useScrollState } from '../../../hooks/useScrollState'
import { Icon } from '../../ui/Icon/Icon'
import { PrefsToggles } from '../../ui/PrefsToggles/PrefsToggles'
import { Burger } from '../Burger/Burger'
import { MobileMenu } from '../MobileMenu/MobileMenu'
import styles from './Navbar.module.css'

interface NavbarProps {
  name: string
  links: NavLink[]
  contacts: Contacts
  /** На странице проекта разделы главной не подсвечиваем */
  spy: boolean
  onSearch: () => void
}

const MENU_ID = 'mobile-menu'
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function Navbar({ name, links, contacts, spy, onSearch }: NavbarProps) {
  const { t } = usePreferences()
  const [open, setOpen] = useState(false)
  const { scrolled, hidden } = useScrollState()
  const spied = useScrollSpy(links.map((l) => l.id))
  const active = spy ? spied : null
  const close = useCallback(() => setOpen(false), [])

  // Закрываем меню, если экран стал широким
  useEffect(() => {
    const mq = matchMedia('(min-width: 961px)')
    const onChange = () => mq.matches && setOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <>
      <motion.header
        className={`${styles.header} ${scrolled && !open ? styles.scrolled : ''}`}
        initial={{ y: -100 }}
        animate={{ y: hidden && !open ? -100 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`container ${styles.inner}`}>
          <a href="#top" className={styles.logo} onClick={close}>
            {name}
            <span>.</span>
          </a>

          <nav className={styles.links} aria-label={t.nav.main}>
            {links.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`${styles.link} ${active === link.id ? styles.active : ''}`}
                aria-current={active === link.id ? 'true' : undefined}
              >
                {active === link.id && (
                  <motion.span layoutId="nav-pill" className={styles.pill} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                <span className={styles.linkLabel}>{link.label}</span>
              </a>
            ))}
          </nav>

          <div className={styles.right}>
            <button type="button" className={styles.search} onClick={onSearch} aria-label={t.nav.search} title={t.nav.search}>
              <Icon name="search" size={17} />
              <kbd className={styles.kbd}>{isMac ? '⌘' : 'Ctrl'} K</kbd>
            </button>
            <PrefsToggles className={styles.prefs} />
            <a href="#contact" className={styles.cta}>
              {t.nav.cta}
            </a>
            <Burger open={open} onToggle={() => setOpen((v) => !v)} controls={MENU_ID} />
          </div>
        </div>
      </motion.header>

      <MobileMenu id={MENU_ID} open={open} links={links} active={active} contacts={contacts} onClose={close} />
    </>
  )
}
