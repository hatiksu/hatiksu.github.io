import type { Stat } from '../../../types'
import { CountUp } from '../../ui/CountUp/CountUp'
import { Reveal } from '../../ui/Reveal/Reveal'
import styles from './Stats.module.css'

export function Stats({ stats }: { stats: Stat[] }) {
  return (
    <section id="stats" className={styles.section}>
      <div className={`container ${styles.grid}`}>
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.1} className={styles.stat}>
            <strong className={styles.value}>
              <CountUp value={stat.value} suffix={stat.suffix} />
            </strong>
            <span className={styles.label}>{stat.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
