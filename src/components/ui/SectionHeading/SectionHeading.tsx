import { Reveal } from '../Reveal/Reveal'
import styles from './SectionHeading.module.css'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  center?: boolean
}

export function SectionHeading({ eyebrow, title, center }: SectionHeadingProps) {
  return (
    <div className={`${styles.heading} ${center ? styles.center : ''}`}>
      <Reveal>
        <span className={styles.eyebrow}>{eyebrow}</span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className={styles.title}>{title}</h2>
      </Reveal>
    </div>
  )
}
