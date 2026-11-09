import { site } from '../../data/site'
import { Activity } from '../../components/sections/Activity/Activity'
import { Contact } from '../../components/sections/Contact/Contact'
import { Hero } from '../../components/sections/Hero/Hero'
import { Projects } from '../../components/sections/Projects/Projects'
import { Skills } from '../../components/sections/Skills/Skills'
import { Stack } from '../../components/sections/Stack/Stack'
import { Stats } from '../../components/sections/Stats/Stats'

export function Home() {
  return (
    <>
      <Hero name={site.name} github={site.contacts.github} />
      <Stats />
      <Skills />
      <Stack stack={site.stack} />
      <Projects projects={site.projects} />
      <Activity stats={site.github} github={site.contacts.github} />
      <Contact contacts={site.contacts} />
    </>
  )
}
