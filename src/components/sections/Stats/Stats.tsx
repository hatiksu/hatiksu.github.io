import { site } from '../../../data/site'
import { usePreferences } from '../../../hooks/usePreferences'
import { CountUp } from '../../ui/CountUp/CountUp'
import { Reveal } from '../../ui/Reveal/Reveal'
import styles from './Stats.module.css'

export function Stats() {
  const { t } = usePreferences()
  const stats = [
    { value: site.stack.length, label: t.stats.tech },
    { value: site.projects.length, label: t.stats.projects },
    { value: '∞', label: t.stats.ideas },
  ]
  return (
    <section id="stats" className={styles.section}>
      <div className={`container ${styles.grid}`}>
        {stats.map((stat, i) => (
          <Reveal key={i} delay={i * 0.1} className={styles.stat}>
            <strong className={styles.value}>
              <CountUp value={stat.value} />
            </strong>
            <span className={styles.label}>{stat.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
