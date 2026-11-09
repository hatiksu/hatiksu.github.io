import type { Project } from '../../../types'
import { Button } from '../../ui/Button/Button'
import { Reveal } from '../../ui/Reveal/Reveal'
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading'
import styles from './Projects.module.css'

/** Схематичный макет интерфейса проекта. */
function Mockup() {
  return (
    <div className={styles.shot} aria-hidden="true">
      <div className={styles.mock}>
        <div className={styles.bar}>
          <i />
          <i />
          <i />
        </div>
        <div className={styles.screen}>
          <div className={styles.image} />
          <div className={styles.side}>
            <b />
            <b />
            <b />
            <b />
            <b />
          </div>
        </div>
      </div>
    </div>
  )
}

export function Projects({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" className={styles.section}>
      <div className="container">
        <SectionHeading eyebrow="Проекты" title="Что я уже сделал" />
        <div className={styles.list}>
          {projects.map((project, i) => (
            <Reveal as="article" key={project.title} className={styles.project}>
              <Mockup />
              <div className={styles.body}>
                <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={styles.title}>{project.title}</h3>
                <p className={styles.text}>{project.text}</p>
                <div className={styles.tags}>
                  {project.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <ul className={styles.points}>
                  {project.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <div className={styles.actions}>
                  {project.demo && (
                    <Button href={project.demo} variant="primary" external>
                      Открыть демо →
                    </Button>
                  )}
                  {project.code && (
                    <Button href={project.code} external>
                      Код на GitHub
                    </Button>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
