import type { NavLink } from '../../../types'
import styles from './Footer.module.css'

const YEAR = new Date().getFullYear()

interface FooterProps {
  name: string
  links: NavLink[]
}

export function Footer({ name, links }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <a href="#top" className={styles.logo}>
          {name}
          <span>.</span>
        </a>
        <nav className={styles.links} aria-label="Навигация в подвале">
          {links.map((l) => (
            <a key={l.id} href={`#${l.id}`}>
              {l.label}
            </a>
          ))}
        </nav>
        <p className={styles.copy}>
          © {YEAR} {name}. Сделано на React с душой.
        </p>
      </div>
    </footer>
  )
}
