import { MotionConfig } from 'motion/react'
import { site } from './data/site'
import { Navbar } from './components/layout/Navbar/Navbar'
import { Footer } from './components/layout/Footer/Footer'
import { Background } from './components/ui/Background/Background'
import { ScrollProgress } from './components/ui/ScrollProgress/ScrollProgress'
import { BackToTop } from './components/ui/BackToTop/BackToTop'
import { Hero } from './components/sections/Hero/Hero'
import { Stats } from './components/sections/Stats/Stats'
import { Skills } from './components/sections/Skills/Skills'
import { Stack } from './components/sections/Stack/Stack'
import { Projects } from './components/sections/Projects/Projects'
import { Contact } from './components/sections/Contact/Contact'

export default function App() {
  return (
    // reducedMotion="user" — уважаем системную настройку «уменьшить движение»
    <MotionConfig reducedMotion="user">
      <Background />
      <ScrollProgress />
      <Navbar name={site.name} links={site.nav} contacts={site.contacts} />
      <main>
        <Hero name={site.name} status={site.status} roles={site.roles} about={site.about} github={site.contacts.github} />
        <Stats stats={site.stats} />
        <Skills skills={site.skills} />
        <Stack stack={site.stack} />
        <Projects projects={site.projects} />
        <Contact contacts={site.contacts} />
      </main>
      <Footer name={site.name} links={site.nav} />
      <BackToTop />
    </MotionConfig>
  )
}
