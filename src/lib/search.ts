// Поиск для командной палитры: все слова запроса должны встретиться, совпадение в начале — выше.

export interface Searchable {
  id: string
  label: string
  /** Дополнительные слова для поиска (теги, синонимы) */
  keywords?: string
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')

export function score(item: Searchable, query: string): number {
  const q = norm(query).trim()
  if (!q) return 1
  const label = norm(item.label)
  const hay = `${label} ${norm(item.keywords ?? '')}`
  const words = q.split(/\s+/)
  if (!words.every((w) => hay.includes(w))) return 0
  if (label.startsWith(q)) return 3
  if (label.split(/[\s—-]+/).some((w) => w.startsWith(words[0]))) return 2
  return 1
}

/** Отфильтрованный список: сначала лучшие совпадения, при равенстве — исходный порядок */
export function search<T extends Searchable>(items: T[], query: string): T[] {
  return items
    .map((item, i) => ({ item, i, s: score(item, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.item)
}
