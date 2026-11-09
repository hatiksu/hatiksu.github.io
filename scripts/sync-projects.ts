// Синхронизация проектов: обходит репозитории на GitHub, находит файлы portfolio.json
// и записывает карточки в src/data/projects.generated.json, а статистику — в src/data/github.generated.json.
//
// Где ищем проекты:
//   • основная ветка каждого публичного репозитория владельца — здесь живут приложения и их релизы;
//   • все ветки текущего репозитория.
// На сайт попадают только проекты с portfolio.json — лабораторные и прочее не появятся сами.
//
// Для каждого проекта с репозиторием на GitHub подтягиваются релизы (версия, установщик .exe, скачивания).
// Статистика: карта коммитов за год, языки по объёму кода, звёзды, релизы и скачивания.
//
// Как обращаемся к GitHub:
//   • прямой запрос к API — с GITHUB_TOKEN, если он есть (в GitHub Actions он есть всегда),
//     иначе без авторизации (лимит 60 запросов в час);
//   • если токен не подошёл (401) или кончился лимит, а установлен CLI `gh` с выполненным входом — дальше через него.
//   • если список репозиториев владельца недоступен, берём репозитории из прошлого списка проектов.
//
// Если GitHub недоступен, файлы не трогаем: сайт соберётся с прошлыми данными.
//
// Запуск: npm run sync
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildHeatmap, mergeLanguages, type GithubStats } from '../src/lib/github.ts'
import { mergeProjects, parseManifest, parseReleases, type PortfolioProject } from '../src/lib/projects.ts'

const OWNER = process.env.PORTFOLIO_OWNER ?? 'hatiksu'
const SELF_REPO = process.env.GITHUB_REPOSITORY ?? `${OWNER}/${OWNER}.github.io`
const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data')
const PROJECTS_OUT = join(DATA, 'projects.generated.json')
const STATS_OUT = join(DATA, 'github.generated.json')
const YEAR_MS = 365 * 86_400_000

interface Repo {
  full_name: string
  default_branch: string
  private: boolean
  fork: boolean
  archived: boolean
  stargazers_count: number
  pushed_at: string
}

class NotFound extends Error {}

function hasGh(): boolean {
  try {
    execFileSync('gh', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const token = process.env.GITHUB_TOKEN
let useGh = false

async function api<T>(path: string): Promise<T> {
  if (useGh) {
    try {
      return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })) as T
    } catch (err) {
      const stderr = String((err as { stderr?: unknown }).stderr ?? '')
      if (stderr.includes('404') || stderr.includes('Not Found')) throw new NotFound(path)
      throw new Error(`gh api ${path}: ${stderr.split('\n')[0]}`)
    }
  }
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portfolio-sync',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (res.status === 404) throw new NotFound(path)
  const limited = res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0'
  if ((res.status === 401 || limited) && hasGh()) {
    console.log(`[sync] API ответил ${res.status} — переключаюсь на gh`)
    useGh = true
    return api<T>(path)
  }
  if (!res.ok) throw new Error(`GitHub API ${res.status} для ${path}`)
  return (await res.json()) as T
}

/** Запрос, который при ошибке возвращает fallback: второстепенные данные не должны ломать синхронизацию */
async function optional<T>(path: string, fallback: T): Promise<T> {
  try {
    return await api<T>(path)
  } catch (err) {
    if (!(err instanceof NotFound)) console.warn(`  ⚠ ${path}: ${err instanceof Error ? err.message : err}`)
    return fallback
  }
}

async function readManifest(repo: Repo, branch: string): Promise<PortfolioProject | null> {
  let file: { content: string; encoding: string }
  try {
    file = await api(`repos/${repo.full_name}/contents/portfolio.json?ref=${encodeURIComponent(branch)}`)
  } catch (err) {
    if (err instanceof NotFound) return null
    throw err
  }
  let raw: unknown
  try {
    raw = JSON.parse(Buffer.from(file.content, file.encoding as BufferEncoding).toString('utf8'))
  } catch {
    console.warn(`  ⚠ ${repo.full_name}@${branch}: portfolio.json — не JSON, пропускаю`)
    return null
  }
  const commit = await api<{ commit: { committer: { date: string } } }>(`repos/${repo.full_name}/commits/${encodeURIComponent(branch)}`)
  const project = parseManifest(raw, {
    repo: repo.full_name,
    branch,
    isPrivate: repo.private,
    updatedAt: commit.commit.committer.date,
  })
  if (!project) console.warn(`  ⚠ ${repo.full_name}@${branch}: в portfolio.json нет title или description`)
  return project
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T
  } catch {
    return null
  }
}

/** Пишет файл, только если данные (без отметки времени) изменились — чтобы не плодить коммиты */
function writeIfChanged(file: string, key: string, data: Record<string, unknown>): boolean {
  const prev = readJson<Record<string, unknown>>(file)
  const strip = (o: Record<string, unknown> | null) => (o ? JSON.stringify({ ...o, generatedAt: undefined }) : '')
  const next = { generatedAt: new Date().toISOString(), ...data }
  if (strip(prev) === strip(next)) {
    console.log(`[sync] ${key}: без изменений`)
    return false
  }
  writeFileSync(file, JSON.stringify(next, null, 2) + '\n')
  console.log(`[sync] ${key}: обновлено → ${file.split('/src/')[1] ? 'src/' + file.split('/src/')[1] : file}`)
  return true
}

/** Публичные репозитории владельца; если список недоступен — репозитории из прошлого списка проектов */
async function ownerRepos(): Promise<Repo[]> {
  try {
    const repos = await api<Repo[]>(`users/${OWNER}/repos?per_page=100&type=owner`)
    return repos.filter((r) => !r.private && !r.fork && !r.archived)
  } catch (err) {
    console.warn(`  ⚠ список репозиториев недоступен (${err instanceof Error ? err.message : err}) — беру из прошлого списка проектов`)
    const prev = readJson<{ projects: PortfolioProject[] }>(PROJECTS_OUT)?.projects ?? []
    const names = new Set([...prev.map((p) => p.repo).filter(Boolean), ...(process.env.PORTFOLIO_REPOS?.split(',') ?? [])] as string[])
    const repos: Repo[] = []
    for (const name of names) {
      const r = await optional<Repo | null>(`repos/${name.trim()}`, null)
      if (r && !r.private) repos.push(r)
    }
    return repos
  }
}

/** Даты коммитов за последний год (до 500 на репозиторий) */
async function commitDates(repo: string, since: string): Promise<string[]> {
  const dates: string[] = []
  for (let page = 1; page <= 5; page++) {
    const list = await optional<{ commit: { author: { date: string } } }[]>(
      `repos/${repo}/commits?since=${since}&per_page=100&page=${page}`,
      [],
    )
    dates.push(...list.map((c) => c.commit.author.date))
    if (list.length < 100) break
  }
  return dates
}

async function main() {
  console.log(`[sync] владелец ${OWNER}, текущий репозиторий ${SELF_REPO}, токен: ${token ? 'есть' : 'нет'}`)
  const found: PortfolioProject[] = []

  // 1. Основные ветки публичных репозиториев владельца
  const repos = await ownerRepos()
  for (const r of repos) {
    const p = await readManifest(r, r.default_branch)
    if (p) {
      console.log(`  ✓ ${r.full_name}: ${p.title}`)
      found.push(p)
    }
  }

  // 2. Все ветки текущего репозитория (необязательно: репозитория может не быть или он закрыт)
  const self = await optional<Repo | null>(`repos/${SELF_REPO}`, null)
  if (self) {
    const branches = await optional<{ name: string }[]>(`repos/${SELF_REPO}/branches?per_page=100`, [])
    for (const b of branches) {
      if (!self.private && b.name === self.default_branch && repos.some((r) => r.full_name === self.full_name)) continue
      const p = await readManifest(self, b.name)
      if (p) {
        console.log(`  ✓ ${self.full_name}@${b.name}: ${p.title}`)
        found.push(p)
      }
    }
  }

  const projects = mergeProjects(found)
  if (!projects.length) {
    console.warn('[sync] ни одного portfolio.json не найдено — оставляю прежние данные')
    return
  }

  // 3. Релизы и языки проектов
  const languages: Record<string, number>[] = []
  for (const p of projects) {
    if (!p.repo) continue
    const releases = parseReleases(await optional<unknown>(`repos/${p.repo}/releases?per_page=20`, []))
    if (releases.length) {
      p.releases = releases
      console.log(`  ↳ ${p.repo}: релизов ${releases.length}, последний ${releases[0].tag}`)
    }
    languages.push(await optional<Record<string, number>>(`repos/${p.repo}/languages`, {}))
  }

  // 4. Активность за год: коммиты во всех публичных репозиториях, где были пуши за последний год
  const now = new Date()
  const since = new Date(now.getTime() - YEAR_MS).toISOString()
  const active = repos.filter((r) => r.pushed_at >= since)
  const dates: string[] = []
  for (const r of active) dates.push(...(await commitDates(r.full_name, since)))
  const heatmap = buildHeatmap(dates, now)

  const stats: Omit<GithubStats, 'generatedAt'> = {
    heatmap,
    languages: mergeLanguages(languages),
    totals: {
      repos: repos.length,
      commits: heatmap.days.reduce((a, b) => a + b, 0),
      releases: projects.reduce((a, p) => a + (p.releases?.length ?? 0), 0),
      downloads: projects.reduce((a, p) => a + (p.releases ?? []).reduce((s, r) => s + (r.installer?.downloads ?? 0), 0), 0),
      stars: repos.reduce((a, r) => a + (r.stargazers_count ?? 0), 0),
    },
  }

  writeIfChanged(PROJECTS_OUT, `проектов ${projects.length}`, { projects })
  writeIfChanged(STATS_OUT, `статистика: коммитов ${stats.totals.commits}, репозиториев ${stats.totals.repos}`, stats)
}

main().catch((err) => {
  // Сеть или лимиты GitHub не должны ломать сборку сайта
  console.warn(`[sync] не удалось обновить данные: ${err instanceof Error ? err.message : err}`)
  console.warn('[sync] сайт соберётся с прошлыми данными')
  if (process.argv.includes('--strict')) process.exit(1)
})
