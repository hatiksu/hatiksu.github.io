// Разбор карточек проектов из файлов portfolio.json и релизов GitHub. Чистые функции без сети —
// их использует скрипт синхронизации (scripts/sync-projects.ts) и покрывают тесты.

export type Mockup = 'finance' | 'editor' | 'generic'
export type Lang = 'ru' | 'en'

/** Тексты карточки на втором языке (поле "en" в portfolio.json) */
export interface ProjectTranslation {
  title: string
  text: string
  points: string[]
}

export interface ReleaseAsset {
  name: string
  url: string
  /** Размер в байтах */
  size: number
  downloads: number
}

export interface Release {
  tag: string
  name: string
  publishedAt: string
  /** Описание релиза (Markdown), обрезанное */
  notes: string
  /** Установщик для Windows, если он есть */
  installer?: ReleaseAsset
}

export interface PortfolioProject {
  /** Уникальный ключ: репозиторий@ветка */
  id: string
  /** Адрес страницы проекта: #/project/<slug> */
  slug: string
  title: string
  text: string
  tags: string[]
  points: string[]
  mockup: Mockup
  /** Эмодзи для универсального макета */
  icon: string
  demo?: string
  code?: string
  /** Репозиторий с кодом и релизами на GitHub (owner/name), если code ведёт на GitHub */
  repo?: string
  en?: ProjectTranslation
  /** Подготовка к автоскриншоту: нажать кнопку с этим текстом (поле "shot" в portfolio.json) */
  shot?: { click: string }
  /** Релизы, новые сверху */
  releases?: Release[]
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
const MAX_RELEASES = 10
const NOTES_LIMIT = 700

const str = (v: unknown, max = 400): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const strList = (v: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems) : []
const httpsUrl = (v: unknown): string | undefined => {
  const s = str(v, 500)
  return /^https:\/\/\S+$/.test(s) ? s : undefined
}
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0)

/** owner/name из ссылки на репозиторий GitHub (без ветки и путей) или undefined */
export function githubRepo(url: string | undefined): string | undefined {
  const m = url?.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/)
  return m ? `${m[1]}/${m[2]}` : undefined
}

/** Безопасный для адреса идентификатор: латиница, цифры и дефисы */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function parseTranslation(raw: unknown): ProjectTranslation | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const m = raw as Record<string, unknown>
  const title = str(m.title, 80)
  const text = str(m.description)
  if (!title || !text) return undefined
  return { title, text, points: strList(m.highlights, MAX_POINTS, 200) }
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
  // Явная ссылка из манифеста важнее; иначе — ветка, если репозиторий публичный
  const code = httpsUrl(m.code) ?? (source.isPrivate ? undefined : treeUrl)
  const repo = githubRepo(code)
  const branchName = source.branch.replace(/^(feature|project)\//, '')
  const isMainBranch = ['main', 'master'].includes(source.branch)
  const slug =
    slugify(str(m.slug, 60)) ||
    slugify(repo?.split('/')[1] ?? '') ||
    slugify(isMainBranch ? source.repo.split('/')[1] : branchName) ||
    slugify(title) ||
    'project'
  const en = parseTranslation(m.en)
  const shotClick = m.shot && typeof m.shot === 'object' ? str((m.shot as Record<string, unknown>).click, 80) : ''

  return {
    id: `${source.repo}@${source.branch}`,
    slug,
    title,
    text,
    tags: strList(m.tags, MAX_TAGS, 30),
    points: strList(m.highlights, MAX_POINTS, 200),
    mockup,
    icon: str(m.icon, 8) || '🚀',
    demo: httpsUrl(m.demo),
    code,
    ...(repo ? { repo } : {}),
    ...(en ? { en } : {}),
    ...(shotClick ? { shot: { click: shotClick } } : {}),
    updatedAt: source.updatedAt,
    ...(order !== undefined ? { order } : {}),
  }
}

/** Релизы из ответа GitHub API: без черновиков, новые сверху, с установщиком .exe, если он есть. */
export function parseReleases(raw: unknown): Release[] {
  if (!Array.isArray(raw)) return []
  const releases: Release[] = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue
    const rel = r as Record<string, unknown>
    if (rel.draft || rel.prerelease) continue
    const tag = str(rel.tag_name, 60)
    const publishedAt = str(rel.published_at, 40)
    if (!tag || !publishedAt) continue
    const assets = Array.isArray(rel.assets) ? (rel.assets as Record<string, unknown>[]) : []
    const exe = assets.find((a) => /\.exe$/i.test(str(a?.name, 200)))
    const url = exe && httpsUrl(exe.browser_download_url)
    let notes = str(rel.body, 5000).replace(/\r\n/g, '\n')
    if (notes.length > NOTES_LIMIT) notes = notes.slice(0, NOTES_LIMIT).replace(/\s+\S*$/, '') + '…'
    releases.push({
      tag,
      name: str(rel.name, 100) || tag,
      publishedAt,
      notes,
      ...(exe && url ? { installer: { name: str(exe.name, 200), url, size: num(exe.size), downloads: num(exe.download_count) } } : {}),
    })
  }
  return releases.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, MAX_RELEASES)
}

/**
 * Один проект может лежать в нескольких местах (ветка разработки и отдельный репозиторий) —
 * оставляем самую свежую версию с тем же адресом. Затем сортируем: сначала по order, потом новые сверху.
 */
export function mergeProjects(projects: PortfolioProject[]): PortfolioProject[] {
  const bySlug = new Map<string, PortfolioProject>()
  for (const p of projects) {
    const prev = bySlug.get(p.slug)
    if (!prev || p.updatedAt > prev.updatedAt) bySlug.set(p.slug, p)
  }
  return [...bySlug.values()].sort((a, b) => {
    const oa = a.order ?? Number.POSITIVE_INFINITY
    const ob = b.order ?? Number.POSITIVE_INFINITY
    if (oa !== ob) return oa - ob
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

/** Тексты карточки на нужном языке; если перевода нет — оригинал. */
export function localizeProject(p: PortfolioProject, lang: Lang): PortfolioProject {
  if (lang === 'ru' || !p.en) return p
  return { ...p, title: p.en.title, text: p.en.text, points: p.en.points.length ? p.en.points : p.points }
}

/** Последний релиз с установщиком */
export function latestInstaller(p: PortfolioProject): (ReleaseAsset & { tag: string; publishedAt: string }) | undefined {
  const r = p.releases?.find((x) => x.installer)
  return r?.installer ? { ...r.installer, tag: r.tag, publishedAt: r.publishedAt } : undefined
}
