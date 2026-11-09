// Разбор карточек проектов из файлов portfolio.json. Чистые функции без сети —
// их использует скрипт синхронизации (scripts/sync-projects.ts) и покрывают тесты.

export type Mockup = 'finance' | 'editor' | 'generic'

export interface PortfolioProject {
  /** Уникальный ключ: репозиторий@ветка */
  id: string
  title: string
  text: string
  tags: string[]
  points: string[]
  mockup: Mockup
  /** Эмодзи для универсального макета */
  icon: string
  demo?: string
  code?: string
  /** Дата последнего коммита в ветке проекта (ISO) */
  updatedAt: string
  order?: number
}

export interface ManifestSource {
  repo: string
  branch: string
  /** Приватный репозиторий: ссылку на код посетители не откроют, поэтому её не показываем */
  isPrivate: boolean
  updatedAt: string
}

const MOCKUPS: Mockup[] = ['finance', 'editor', 'generic']
const MAX_TAGS = 8
const MAX_POINTS = 5

const str = (v: unknown, max = 400): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const strList = (v: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems) : []
const httpsUrl = (v: unknown): string | undefined => {
  const s = str(v, 500)
  return /^https:\/\/\S+$/.test(s) ? s : undefined
}

/**
 * Проверяет и нормализует содержимое portfolio.json.
 * Возвращает null, если обязательных полей (title, description) нет.
 */
export function parseManifest(raw: unknown, source: ManifestSource): PortfolioProject | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Record<string, unknown>
  const title = str(m.title, 80)
  const text = str(m.description)
  if (!title || !text) return null

  const mockup = MOCKUPS.includes(m.mockup as Mockup) ? (m.mockup as Mockup) : 'generic'
  const treeUrl = `https://github.com/${source.repo}/tree/${source.branch}`
  const order = typeof m.order === 'number' && Number.isFinite(m.order) ? m.order : undefined

  return {
    id: `${source.repo}@${source.branch}`,
    title,
    text,
    tags: strList(m.tags, MAX_TAGS, 30),
    points: strList(m.highlights, MAX_POINTS, 200),
    mockup,
    icon: str(m.icon, 8) || '🚀',
    demo: httpsUrl(m.demo),
    // Явная ссылка из манифеста важнее; иначе — ветка, если репозиторий публичный
    code: httpsUrl(m.code) ?? (source.isPrivate ? undefined : treeUrl),
    updatedAt: source.updatedAt,
    ...(order !== undefined ? { order } : {}),
  }
}

/**
 * Один проект может лежать в нескольких ветках (например, в main и в ветке разработки) —
 * оставляем самую свежую версию с тем же названием. Затем сортируем: сначала по order, потом новые сверху.
 */
export function mergeProjects(projects: PortfolioProject[]): PortfolioProject[] {
  const byTitle = new Map<string, PortfolioProject>()
  for (const p of projects) {
    const key = p.title.toLowerCase()
    const prev = byTitle.get(key)
    if (!prev || p.updatedAt > prev.updatedAt) byTitle.set(key, p)
  }
  return [...byTitle.values()].sort((a, b) => {
    const oa = a.order ?? Number.POSITIVE_INFINITY
    const ob = b.order ?? Number.POSITIVE_INFINITY
    if (oa !== ob) return oa - ob
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}
