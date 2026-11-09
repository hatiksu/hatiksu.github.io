import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import { ScrollProgress } from './components/ui/ScrollProgress/ScrollProgress'
import { Toaster } from './components/ui/Toaster/Toaster'
import { Home } from './pages/Home/Home'

// Страница проекта и палитра нужны не сразу — грузим их отдельными чанками
const ProjectPage = lazy(() => import('./pages/ProjectPage/ProjectPage').then((m) => ({ default: m.ProjectPage })))
const NotFound = lazy(() => import('./pages/NotFound/NotFound').then((m) => ({ default: m.NotFound })))
const Terminal = lazy(() => import('./components/ui/Terminal/Terminal').then((m) => ({ default: m.Terminal })))
const CommandPalette = lazy(() => import('./components/ui/CommandPalette/CommandPalette').then((m) => ({ default: m.CommandPalette })))

function Shell() {
  const { t, lang } = usePreferences()
  const route = useRoute()
  const [paletteOpen, setPaletteOpen] = useState(false)
  // Палитру монтируем после первого открытия, чтобы не грузить её код заранее
  const [paletteUsed, setPaletteUsed] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [terminalUsed, setTerminalUsed] = useState(false)
  const [playSlug, setPlaySlug] = useState<string | null>(null)
  const prevPage = useRef(route.page)
  const links = site.sections.map((id) => ({ id, label: t.nav[id] }))

  // Прокрутка при смене маршрута: страница проекта — сверху, раздел главной — к разделу
  useLayoutEffect(() => {
    const changedPage = prevPage.current !== route.page
    prevPage.current = route.page
    if (route.page !== 'home') {
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
      // ` (на русской раскладке — ё): терминал-пасхалка
      if (e.code === 'Backquote' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setTerminalUsed(true)
        setTerminalOpen((v) => !v)
        return
      }
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setPaletteUsed(true)
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const closePalette = useCallback(() => setPaletteOpen(false), [])
  const closeTerminal = useCallback(() => setTerminalOpen(false), [])
  const openTerminal = useCallback(() => {
    setTerminalUsed(true)
    setTerminalOpen(true)
  }, [])
  const play = useCallback((slug: string) => setPlaySlug(slug), [])
  const playing = playSlug ? site.projects.find((p) => p.slug === playSlug) : undefined

  return (
    // reducedMotion="user" — уважаем системную настройку «уменьшить движение»
    <MotionConfig reducedMotion="user">
      <Background />
      <ScrollProgress />
      <Navbar name={site.name} links={links} contacts={site.contacts} spy={route.page === 'home'} onSearch={() => {
          setPaletteUsed(true)
          setPaletteOpen(true)
        }} />
      <LayoutGroup>
        <main>
          <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
            {route.page === 'project' ? <ProjectPage key={route.slug} slug={route.slug} /> : route.page === 'notfound' ? <NotFound /> : <Home />}
          </Suspense>
        </main>
      </LayoutGroup>
      <Footer name={site.name} links={links} />
      <BackToTop />
      {paletteUsed && (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onClose={closePalette} onPlay={play} onTerminal={openTerminal} />
        </Suspense>
      )}
      {terminalUsed && (
        <Suspense fallback={null}>
          <Terminal open={terminalOpen} onClose={closeTerminal} onPlay={play} />
        </Suspense>
      )}
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

