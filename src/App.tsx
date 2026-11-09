import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LayoutGroup, MotionConfig } from 'motion/react'
import { site } from './data/site'
import { PreferencesProvider } from './context/PreferencesProvider'
import { usePreferences } from './hooks/usePreferences'
import { useRoute } from './hooks/useRoute'
import { localizeProject } from './lib/projects'
import { Navbar } from './components/layout/Navbar/Navbar'
import { Footer } from './components/layout/Footer/Footer'
import { PlayFrame } from './components/project/PlayFrame/PlayFrame'
import { Background } from './components/ui/Background/Background'
import { BackToTop } from './components/ui/BackToTop/BackToTop'
import { CommandPalette } from './components/ui/CommandPalette/CommandPalette'
import { ScrollProgress } from './components/ui/ScrollProgress/ScrollProgress'
import { Toaster } from './components/ui/Toaster/Toaster'
import { Home } from './pages/Home/Home'
import { ProjectPage } from './pages/ProjectPage/ProjectPage'

function Shell() {
  const { t, lang } = usePreferences()
  const route = useRoute()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [playSlug, setPlaySlug] = useState<string | null>(null)
  const prevPage = useRef(route.page)
  const links = site.sections.map((id) => ({ id, label: t.nav[id] }))

  // Прокрутка при смене маршрута: страница проекта — сверху, раздел главной — к разделу
  useLayoutEffect(() => {
    const changedPage = prevPage.current !== route.page
    prevPage.current = route.page
    if (route.page === 'project') {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    if (route.section) {
      const id = route.section
      // Ждём кадр, пока главная отрисуется после страницы проекта
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: changedPage ? 'instant' : 'smooth' }))
    } else if (changedPage) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route])

  // Ctrl+K / ⌘K и «/» — командная палитра
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const closePalette = useCallback(() => setPaletteOpen(false), [])
  const play = useCallback((slug: string) => setPlaySlug(slug), [])
  const playing = playSlug ? site.projects.find((p) => p.slug === playSlug) : undefined

  return (
    // reducedMotion="user" — уважаем системную настройку «уменьшить движение»
    <MotionConfig reducedMotion="user">
      <Background />
      <ScrollProgress />
      <Navbar name={site.name} links={links} contacts={site.contacts} spy={route.page === 'home'} onSearch={() => setPaletteOpen(true)} />
      <LayoutGroup>
        <main>{route.page === 'project' ? <ProjectPage key={route.slug} slug={route.slug} /> : <Home />}</main>
      </LayoutGroup>
      <Footer name={site.name} links={links} />
      <BackToTop />
      <CommandPalette open={paletteOpen} onClose={closePalette} onPlay={play} />
      <PlayFrame
        open={Boolean(playing)}
        slug={playSlug ?? ''}
        title={playing ? localizeProject(playing, lang).title : ''}
        onClose={() => setPlaySlug(null)}
      />
      <Toaster />
    </MotionConfig>
  )
}

export default function App() {
  return (
    <PreferencesProvider>
      <Shell />
    </PreferencesProvider>
  )
}

