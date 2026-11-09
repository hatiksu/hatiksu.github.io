import type { Tech } from '../../../types'
import { Reveal } from '../../ui/Reveal/Reveal'
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading'
import styles from './Stack.module.css'

function Row({ items, reverse }: { items: Tech[]; reverse?: boolean }) {
  // Дублируем список, чтобы лента прокручивалась бесшовно
  const loop = [...items, ...items]
  return (
    <div className={styles.marquee}>
      <div className={`${styles.track} ${reverse ? styles.reverse : ''}`}>
        {loop.map((tech, i) => (
          <span key={`${tech.name}-${i}`} className={styles.chip} aria-hidden={i >= items.length}>
            <i style={{ background: tech.color, boxShadow: `0 0 14px ${tech.color}` }} />
            {tech.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Stack({ stack }: { stack: Tech[] }) {
  const half = Math.ceil(stack.length / 2)
  return (
    <section id="stack" className={styles.section}>
      <div className="container">
        <SectionHeading eyebrow="На чём пишу" title="Технологии и инструменты" />
      </div>
      <Reveal className={styles.rows}>
        <Row items={stack.slice(0, half)} />
        <Row items={stack.slice(half)} reverse />
      </Reveal>
    </section>
  )
}
