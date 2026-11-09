import { useMemo } from 'react'
import { motion } from 'motion/react'
import { usePreferences } from '../../../hooks/usePreferences'
import { formatDate } from '../../../lib/format'
import { heatLevel, heatmapWeeks, longestStreak, type GithubStats } from '../../../lib/github'
import { CountUp } from '../../ui/CountUp/CountUp'
import { Reveal } from '../../ui/Reveal/Reveal'
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading'
import styles from './Activity.module.css'

/** Цвета языков как на GitHub */
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  CSS: '#663399',
  HTML: '#e34c26',
  Python: '#3572a5',
  'C#': '#178600',
  Shell: '#89e051',
  Vue: '#41b883',
  Java: '#b07219',
  Other: '#8a92a6',
}
const DAY = 86_400_000

export function Activity({ stats, github }: { stats: GithubStats; github: string }) {
  const { t, lang } = usePreferences()
  const weeks = useMemo(() => heatmapWeeks(stats.heatmap), [stats.heatmap])
  const max = Math.max(1, ...stats.heatmap.days)
  const start = Date.parse(stats.heatmap.start)

  const totals = [
    { value: stats.totals.commits, label: t.activity.commits },
    { value: longestStreak(stats.heatmap.days), label: t.activity.streak },
    { value: stats.totals.repos, label: t.activity.repos },
    { value: stats.totals.releases, label: t.activity.releases },
  ]

  // Подписи месяцев над первой неделей каждого месяца
  const months = weeks.map((_, w) => {
    const d = new Date(start + w * 7 * DAY)
    const prev = new Date(start + (w - 1) * 7 * DAY)
    return w === 0 || d.getUTCMonth() !== prev.getUTCMonth() ? formatDate(d.toISOString(), lang, { month: 'short' }).replace('.', '') : ''
  })

  return (
    <section id="activity" className={styles.section}>
      <div className="container">
        <SectionHeading eyebrow={t.activity.eyebrow} title={t.activity.title} />

        <div className={styles.totals}>
          {totals.map((s, i) => (
            <Reveal key={i} delay={i * 0.08} className={styles.total}>
              <strong>
                <CountUp value={s.value} />
              </strong>
              <span>{s.label}</span>
            </Reveal>
          ))}
        </div>

        <Reveal className={styles.card}>
          <div className={styles.scroller}>
            <div className={styles.heatmap} style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
              {months.map((m, i) => (
                <span key={`m${i}`} className={styles.month} style={{ gridColumn: i + 1 }}>
                  {m}
                </span>
              ))}
              {weeks.map((week, w) =>
                week.map((count, d) => {
                  const iso = new Date(start + (w * 7 + d) * DAY).toISOString()
                  return (
                    <motion.i
                      key={`${w}-${d}`}
                      className={styles.cell}
                      data-level={heatLevel(count, max)}
                      style={{ gridColumn: w + 1, gridRow: d + 2 }}
                      title={t.activity.day(count, formatDate(iso, lang))}
                      initial={{ opacity: 0, scale: 0.4 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(w * 0.012, 0.6), duration: 0.3 }}
                    />
                  )
                }),
              )}
            </div>
          </div>
          <div className={styles.legend}>
            <a href={github} target="_blank" rel="noopener noreferrer">
              {t.activity.updated} · {formatDate(stats.generatedAt, lang)}
            </a>
            <span className={styles.scale}>
              {t.activity.less}
              {[0, 1, 2, 3, 4].map((l) => (
                <i key={l} className={styles.cell} data-level={l} />
              ))}
              {t.activity.more}
            </span>
          </div>
        </Reveal>

        {stats.languages.length > 0 && (
          <Reveal className={styles.card}>
            <h3 className={styles.h3}>{t.activity.languages}</h3>
            <div className={styles.bar}>
              {stats.languages.map((l, i) => (
                <motion.span
                  key={l.name}
                  style={{ background: LANG_COLORS[l.name] ?? '#7c5cff' }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${l.share * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
            <ul className={styles.langs}>
              {stats.languages.map((l) => (
                <li key={l.name}>
                  <i style={{ background: LANG_COLORS[l.name] ?? '#7c5cff' }} />
                  {l.name === 'Other' ? t.activity.other : l.name}
                  <span>{(l.share * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  )
}
