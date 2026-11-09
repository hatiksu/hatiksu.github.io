import { MotionConfig } from 'motion/react'
import { site } from '../../data/site'
import { Background } from '../../components/ui/Background/Background'
import { PrefsToggles } from '../../components/ui/PrefsToggles/PrefsToggles'
import { NotFound } from './NotFound'

/** Оболочка отдельной страницы 404.html: фон, логотип, переключатели и игра */
export function NotFoundApp() {
  return (
    <MotionConfig reducedMotion="user">
      <Background />
      <header
        className="container"
        style={{
          position: 'absolute',
          inset: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 'var(--nav-h)',
        }}
      >
        <a href="/" style={{ font: '800 20px var(--font-display)' }}>
          {site.name}
          <span style={{ color: 'var(--a2)' }}>.</span>
        </a>
        <PrefsToggles />
      </header>
      <main>
        <NotFound homeHref="/" />
      </main>
    </MotionConfig>
  )
}
