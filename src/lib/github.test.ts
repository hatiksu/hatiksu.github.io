import { describe, expect, it } from 'vitest'
import { buildHeatmap, heatLevel, heatmapWeeks, longestStreak, mergeLanguages } from './github'

describe('buildHeatmap', () => {
  // Среда, 11 ноября 2026
  const today = new Date('2026-11-11T15:00:00Z')

  it('начинается с понедельника и заканчивается сегодня', () => {
    const h = buildHeatmap([], today, 2)
    expect(h.start).toBe('2026-11-02')
    expect(h.days).toHaveLength(7 + 3)
    expect(heatmapWeeks(h).map((w) => w.length)).toEqual([7, 3])
  })

  it('считает коммиты по дням и отбрасывает лишнее', () => {
    const h = buildHeatmap(
      ['2026-11-11T01:00:00Z', '2026-11-11T23:00:00Z', '2026-11-02T10:00:00Z', '2026-10-01T10:00:00Z', '2026-12-01T00:00:00Z', 'мусор'],
      today,
      2,
    )
    expect(h.days[0]).toBe(1)
    expect(h.days.at(-1)).toBe(2)
    expect(h.days.reduce((a, b) => a + b, 0)).toBe(3)
  })

  it('год по умолчанию — 53 недели', () => {
    expect(heatmapWeeks(buildHeatmap([], today)).length).toBe(53)
  })
})

describe('heatLevel и серии', () => {
  it('уровни относительно максимума', () => {
    expect([0, 1, 3, 6, 10].map((c) => heatLevel(c, 10))).toEqual([0, 1, 2, 3, 4])
    expect(heatLevel(5, 0)).toBe(0)
  })

  it('самая длинная серия', () => {
    expect(longestStreak([1, 1, 0, 2, 3, 1, 0])).toBe(3)
    expect(longestStreak([])).toBe(0)
  })
})

describe('mergeLanguages', () => {
  it('складывает и сортирует, мелочь — в Other', () => {
    const langs = mergeLanguages([{ TypeScript: 600, CSS: 100 }, { TypeScript: 200, HTML: 50, Shell: 50 }], 2)
    expect(langs.map((l) => l.name)).toEqual(['TypeScript', 'CSS', 'Other'])
    expect(langs[0].share).toBeCloseTo(0.8)
    expect(langs[2].bytes).toBe(100)
  })

  it('пусто — пустой список', () => {
    expect(mergeLanguages([])).toEqual([])
  })
})
