// Статистика активности на GitHub: карта коммитов за год и языки по объёму кода.
// Считается при синхронизации (scripts/sync-projects.ts), на сайте только отображается.

export interface LanguageShare {
  name: string
  bytes: number
  /** Доля от 0 до 1 */
  share: number
}

export interface Heatmap {
  /** Первый день карты (понедельник), YYYY-MM-DD */
  start: string
  /** Число коммитов по дням подряд, начиная со start */
  days: number[]
}

export interface GithubStats {
  generatedAt: string
  heatmap: Heatmap
  languages: LanguageShare[]
  totals: {
    repos: number
    commits: number
    releases: number
    downloads: number
    stars: number
  }
}

const DAY = 86_400_000

/** YYYY-MM-DD в UTC */
export const isoDay = (d: Date): string => d.toISOString().slice(0, 10)

/**
 * Карта активности за последние weeks недель: колонки — недели с понедельника, последняя содержит сегодня.
 * dates — даты коммитов (ISO); всё, что вне окна, отбрасывается.
 */
export function buildHeatmap(dates: string[], today: Date, weeks = 53): Heatmap {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const weekday = (end.getUTCDay() + 6) % 7 // 0 — понедельник
  const start = new Date(end.getTime() - (weekday + (weeks - 1) * 7) * DAY)
  const length = Math.round((end.getTime() - start.getTime()) / DAY) + 1
  const days = new Array<number>(length).fill(0)
  for (const iso of dates) {
    const t = Date.parse(iso)
    if (Number.isNaN(t)) continue
    const day = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth(), new Date(t).getUTCDate())
    const i = Math.round((day - start.getTime()) / DAY)
    if (i >= 0 && i < length) days[i]++
  }
  return { start: isoDay(start), days }
}

/** Делит дни карты на недели (по 7, последняя может быть неполной) */
export function heatmapWeeks(h: Heatmap): number[][] {
  const weeks: number[][] = []
  for (let i = 0; i < h.days.length; i += 7) weeks.push(h.days.slice(i, i + 7))
  return weeks
}

/** Уровень цвета клетки 0–4 относительно самого активного дня */
export function heatLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0
  const r = count / max
  return r > 0.75 ? 4 : r > 0.5 ? 3 : r > 0.25 ? 2 : 1
}

/** Самая длинная серия дней подряд с коммитами */
export function longestStreak(days: number[]): number {
  let best = 0
  let cur = 0
  for (const d of days) {
    cur = d > 0 ? cur + 1 : 0
    best = Math.max(best, cur)
  }
  return best
}

/** Складывает языки нескольких репозиториев; всё мелкое после top — в «Другое» (Other) */
export function mergeLanguages(list: Record<string, number>[], top = 6): LanguageShare[] {
  const sum = new Map<string, number>()
  for (const langs of list) for (const [name, bytes] of Object.entries(langs)) sum.set(name, (sum.get(name) ?? 0) + bytes)
  const total = [...sum.values()].reduce((a, b) => a + b, 0)
  if (!total) return []
  const sorted = [...sum.entries()].sort((a, b) => b[1] - a[1])
  const head = sorted.slice(0, top)
  const rest = sorted.slice(top).reduce((a, [, b]) => a + b, 0)
  const result = head.map(([name, bytes]) => ({ name, bytes, share: bytes / total }))
  if (rest > 0) result.push({ name: 'Other', bytes: rest, share: rest / total })
  return result
}
