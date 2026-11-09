import { useState } from 'react'
import { motion } from 'motion/react'
import { site } from '../../data/site'
import { usePreferences } from '../../hooks/usePreferences'
import { formatDate, formatMegabytes, formatNumber } from '../../lib/format'
import { isGame as checkGame, latestInstaller, localizeProject } from '../../lib/projects'
import { projectHref } from '../../lib/router'
import { copyText, toast } from '../../lib/toast'
import { DownloadButton } from '../../components/project/DownloadButton/DownloadButton'
import { PlayFrame } from '../../components/project/PlayFrame/PlayFrame'
import { ProjectShot } from '../../components/project/ProjectShot/ProjectShot'
import { ReleaseList } from '../../components/project/ReleaseList/ReleaseList'
import { Button } from '../../components/ui/Button/Button'
import { Icon } from '../../components/ui/Icon/Icon'
import { Reveal } from '../../components/ui/Reveal/Reveal'
import { NotFound } from '../NotFound/NotFound'
import styles from './ProjectPage.module.css'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
})

/** Страница проекта: #/project/<slug> */
export function ProjectPage({ slug }: { slug: string }) {
  const { t, lang } = usePreferences()
  const [playing, setPlaying] = useState(false)
  const index = site.projects.findIndex((p) => p.slug === slug)

  if (index < 0) return <NotFound title={t.project.notFound} text={t.project.notFoundText} />

  const project = localizeProject(site.projects[index], lang)
  const next = localizeProject(site.projects[(index + 1) % site.projects.length], lang)
  const embedded = Boolean(site.apps[slug])
  const installer = latestInstaller(project)
  const isGame = checkGame(site.projects[index])
  const shareUrl = `${site.url}p/${slug}/`

  const share = async () => {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ title: project.title, text: project.text, url: shareUrl }).catch(() => undefined)
    } else if (await copyText(shareUrl)) toast(t.project.copied)
  }

  const facts = [
    installer && { label: t.project.version, value: installer.tag },
    installer && { label: t.project.size, value: formatMegabytes(installer.size, lang, t.units.mb) },
    installer && { label: t.project.released, value: formatDate(installer.publishedAt, lang) },
    installer && { label: t.projects.downloads, value: formatNumber(installer.downloads, lang) },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <article className={styles.page}>
      <div className="container">
        <motion.a href="#projects" className={styles.back} {...fade()}>
          <Icon name="back" size={16} /> {t.project.back}
        </motion.a>

        <header className={styles.header}>
          <motion.span className={styles.eyebrow} {...fade(0.05)}>
            {String(index + 1).padStart(2, '0')} · {project.tags.slice(0, 3).join(' · ')}
          </motion.span>
          <motion.h1 className={styles.title} {...fade(0.1)}>
            {project.title}
          </motion.h1>
          <motion.p className={styles.lead} {...fade(0.15)}>
            {project.text}
          </motion.p>
          <motion.div className={styles.actions} {...fade(0.2)}>
            {embedded && (
              <Button variant="primary" icon="play" onClick={() => setPlaying(true)}>
                {isGame ? t.projects.play : t.projects.tryIt}
              </Button>
            )}
            <DownloadButton project={project} variant={embedded ? 'ghost' : 'primary'} />
            {project.code && (
              <Button href={project.code} icon="github" external>
                {t.projects.code}
              </Button>
            )}
            <Button icon="share" onClick={share} ariaLabel={t.project.share}>
              {t.project.share}
            </Button>
          </motion.div>
        </header>

        <div className={styles.hero}>
          <ProjectShot project={project} variant="hero" eager />
          {embedded && (
            <button type="button" className={styles.playOverlay} onClick={() => setPlaying(true)} aria-label={isGame ? t.projects.play : t.projects.tryIt}>
              <span>
                <Icon name="play" size={28} />
              </span>
            </button>
          )}
        </div>

        <div className={styles.grid}>
          <Reveal className={styles.block}>
            <h2 className={styles.h2}>{t.project.inside}</h2>
            <ul className={styles.points}>
              {project.points.map((point, i) => (
                <li key={point}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {point}
                </li>
              ))}
            </ul>
            <div className={styles.tags}>
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </Reveal>

          {facts.length > 0 && (
            <Reveal className={`${styles.block} ${styles.facts}`} delay={0.1}>
              <dl>
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              <p className={styles.hint}>{t.project.installHint}</p>
            </Reveal>
          )}
        </div>

        <Reveal className={styles.block}>
          <h2 className={styles.h2}>{t.project.releases}</h2>
          {project.releases?.length ? <ReleaseList releases={project.releases} /> : <p className={styles.hint}>{t.project.noReleases}</p>}
        </Reveal>

        {next.slug !== project.slug && (
          <Reveal>
            <a href={projectHref(next.slug)} className={`${styles.next} shot-hover`}>
              <span className={styles.nextLabel}>
                {t.project.next} <Icon name="next" size={16} />
              </span>
              <strong>{next.title}</strong>
            </a>
          </Reveal>
        )}
      </div>

      {embedded && <PlayFrame open={playing} slug={slug} title={project.title} onClose={() => setPlaying(false)} />}
    </article>
  )
}
