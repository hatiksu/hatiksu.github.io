import styles from './FinanceMockup.module.css'

// Доли сегментов кольца и высоты столбиков — просто для иллюстрации
const RING = [
  { share: 0.42, color: '#3987e5' },
  { share: 0.22, color: '#d95926' },
  { share: 0.16, color: '#199e70' },
  { share: 0.12, color: '#d55181' },
  { share: 0.08, color: '#9085e9' },
]
const BARS = [30, 55, 22, 70, 40, 85, 48, 35, 62, 28, 50, 74]
const R = 15.9155 // длина окружности = 100, удобно для stroke-dasharray в процентах

/** Схематичный экран финансового трекера в рамке телефона. */
// Смещения сегментов по кругу (начинаем сверху)
const SEGMENTS: { color: string; dash: number; offset: number }[] = []
for (let i = 0, offset = 25; i < RING.length; i++) {
  const dash = RING[i].share * 100
  SEGMENTS.push({ color: RING[i].color, dash, offset })
  offset -= dash
}

export function FinanceMockup() {
  return (
    <div className={styles.phone}>
      <div className={styles.notch} />
      <div className={styles.balance}>
        <span>Баланс за месяц</span>
        <strong>+58 549 ₽</strong>
      </div>
      <div className={styles.row}>
        <svg viewBox="0 0 42 42" className={styles.ring}>
          {SEGMENTS.map((s) => (
            <circle
              key={s.color}
              cx="21"
              cy="21"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="6"
              strokeDasharray={`${Math.max(s.dash - 1.5, 0)} ${100 - s.dash + 1.5}`}
              strokeDashoffset={s.offset}
            />
          ))}
        </svg>
        <div className={styles.legend}>
          {RING.slice(0, 3).map((s) => (
            <i key={s.color} style={{ background: s.color }} />
          ))}
        </div>
      </div>
      <div className={styles.bars}>
        {BARS.map((h, i) => (
          <i key={i} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className={styles.list}>
        <b />
        <b />
        <b />
      </div>
    </div>
  )
}
