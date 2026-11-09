import { motion } from 'motion/react'
import { site } from '../../../data/site'
import type { Project } from '../../../types'
import { EditorMockup } from '../../sections/Projects/EditorMockup/EditorMockup'
import { FinanceMockup } from '../../sections/Projects/FinanceMockup/FinanceMockup'
import { GenericMockup } from '../../sections/Projects/GenericMockup/GenericMockup'
import styles from './ProjectShot.module.css'

interface ProjectShotProps {
  project: Project
  /** card — в списке на главной, hero — крупно на странице проекта */
  variant?: 'card' | 'hero'
  /** Картинка в первом экране: грузим сразу */
  eager?: boolean
}

/**
 * Скриншоты приложения: экран компьютера в окне браузера и телефон поверх.
 * Пока скриншотов нет — схематичный макет. layoutId связывает карточку и страницу проекта
 * для плавного перехода.
 */
export function ProjectShot({ project, variant = 'card', eager }: ProjectShotProps) {
  const shots = site.apps[project.slug]?.shots
  const loading = eager ? 'eager' : 'lazy'
  // В карточке — лёгкий WebP, крупно на странице проекта — исходный JPEG в полном разрешении
  const pick = (jpg: string) => (variant === 'card' ? jpg.replace(/\.jpg$/, '.webp') : jpg)

  return (
    <motion.div layoutId={`shot-${project.slug}`} className={`${styles.stage} ${styles[variant]}`} aria-hidden="true">
      {shots ? (
        <>
          <div className={styles.browser}>
            <div className={styles.bar}>
              <i />
              <i />
              <i />
              <span>{project.slug}</span>
            </div>
            <img src={pick(shots.desktop)} alt="" width={1440} height={900} loading={loading} decoding="async" fetchPriority={eager ? 'high' : 'auto'} />
          </div>
          <div className={styles.phone}>
            <img src={pick(shots.mobile)} alt="" width={780} height={1688} loading={loading} decoding="async" />
          </div>
        </>
      ) : project.mockup === 'finance' ? (
        <FinanceMockup />
      ) : project.mockup === 'editor' ? (
        <EditorMockup />
      ) : (
        <GenericMockup icon={project.icon} title={project.title} />
      )}
    </motion.div>
  )
}
