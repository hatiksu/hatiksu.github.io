import { useState } from 'react'
import { site } from '../../../data/site'
import { usePreferences } from '../../../hooks/usePreferences'
import { formatDate } from '../../../lib/format'
import { isGame, localizeProject } from '../../../lib/projects'
import { projectHref } from '../../../lib/router'
import type { Project } from '../../../types'
import { DownloadButton } from '../../project/DownloadButton/DownloadButton'
import { PlayFrame } from '../../project/PlayFrame/PlayFrame'
import { ProjectShot } from '../../project/ProjectShot/ProjectShot'
import { Button } from '../../ui/Button/Button'
import { Reveal } from '../../ui/Reveal/Reveal'
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading'
import styles from './Projects.module.css'

export function Projects({ projects }: { projects: Project[] }) {
  const { t, lang } = usePreferences()
  const [playing, setPlaying] = useState<Project | null>(null)

  return (
    <section id="projects" className={styles.section}>
      <div className="container">
        <SectionHeading eyebrow={t.projects.eyebrow} title={t.projects.title} />
        <div className={styles.list}>
          {projects.map((raw, i) => {
            const project = localizeProject(raw, lang)
            const embedded = Boolean(site.apps[project.slug])
            return (
              <Reveal as="article" key={project.id} className={`${styles.project} shot-hover`}>
                <a href={projectHref(project.slug)} className={styles.shot} tabIndex={-1} aria-hidden="true">
                  <ProjectShot project={project} />
                </a>
                <div className={styles.body}>
                  <span className={styles.number}>
                    {String(i + 1).padStart(2, '0')} · {t.projects.updated} {formatDate(project.updatedAt, lang)}
                  </span>
                  <h3 className={styles.title}>
                    <a href={projectHref(project.slug)}>{project.title}</a>
                  </h3>
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
                    <Button href={projectHref(project.slug)} variant="primary" icon="next">
                      {t.projects.more}
                    </Button>
                    {embedded && (
                      <Button icon="play" onClick={() => setPlaying(project)}>
                        {isGame(raw) ? t.projects.play : t.projects.tryIt}
                      </Button>
                    )}
                    <DownloadButton project={project} />
                    {project.demo && (
                      <Button href={project.demo} icon="external" external>
                        {t.projects.demo}
                      </Button>
                    )}
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
      <PlayFrame open={Boolean(playing)} slug={playing?.slug ?? ''} title={playing?.title ?? ''} onClose={() => setPlaying(null)} />
    </section>
  )
}
