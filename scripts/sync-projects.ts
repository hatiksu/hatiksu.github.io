// Синхронизация проектов: обходит репозитории на GitHub, находит файлы portfolio.json
// и записывает карточки в src/data/projects.generated.json.
//
// Где ищем:
//   • все ветки текущего репозитория (в том числе приватного) — здесь живут проекты;
//   • основная ветка каждого публичного репозитория владельца.
// На сайт попадают только проекты с portfolio.json — лабораторные и прочее не появятся сами.
//
// Как обращаемся к GitHub:
//   • прямой запрос к API — с GITHUB_TOKEN, если он есть (в GitHub Actions он есть всегда),
//     иначе без авторизации (видны только публичные репозитории, лимит 60 запросов в час);
//   • если API ответил 401/403, а установлен CLI `gh` с выполненным входом — дальше работаем через него.
//
// Если GitHub недоступен, файл не трогаем: сайт соберётся с прошлой версией списка.
//
// Запуск: npm run sync
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeProjects, parseManifest, type PortfolioProject } from '../src/lib/projects.ts'

const OWNER = process.env.PORTFOLIO_OWNER ?? 'hatiksu'
const SELF_REPO = process.env.GITHUB_REPOSITORY ?? `${OWNER}/Claude-Code`
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'projects.generated.json')

interface Repo {
  full_name: string
  default_branch: string
  private: boolean
  fork: boolean
  archived: boolean
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
      throw err
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
  if ((res.status === 401 || res.status === 403) && hasGh()) {
    console.log(`[sync] API ответил ${res.status} — переключаюсь на gh`)
    useGh = true
    return api<T>(path)
  }
  if (!res.ok) throw new Error(`GitHub API ${res.status} для ${path}`)
  return (await res.json()) as T
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

async function main() {
  console.log(`[sync] владелец ${OWNER}, текущий репозиторий ${SELF_REPO}, токен: ${token ? 'есть' : 'нет'}`)
  const found: PortfolioProject[] = []

  // 1. Все ветки текущего репозитория
  const self = await api<Repo>(`repos/${SELF_REPO}`)
  const branches = await api<{ name: string }[]>(`repos/${SELF_REPO}/branches?per_page=100`)
  for (const b of branches) {
    const p = await readManifest(self, b.name)
    if (p) {
      console.log(`  ✓ ${self.full_name}@${b.name}: ${p.title}`)
      found.push(p)
    }
  }

  // 2. Основные ветки публичных репозиториев владельца. Этот шаг необязательный:
  //    если список репозиториев недоступен, публикуем то, что нашли в текущем.
  try {
    const repos = await api<Repo[]>(`users/${OWNER}/repos?per_page=100&type=owner`)
    for (const r of repos) {
      if (r.full_name === self.full_name || r.fork || r.archived) continue
      const p = await readManifest(r, r.default_branch)
      if (p) {
        console.log(`  ✓ ${r.full_name}: ${p.title}`)
        found.push(p)
      }
    }
  } catch (err) {
    console.warn(`  ⚠ другие репозитории не проверены: ${err instanceof Error ? err.message.split('\n')[0] : err}`)
  }

  const projects = mergeProjects(found)
  if (!projects.length) {
    console.warn('[sync] ни одного portfolio.json не найдено — оставляю прежний список')
    return
  }

  // Не переписываем файл, если ничего не изменилось (чтобы не плодить коммиты)
  let previous = ''
  try {
    previous = JSON.stringify(JSON.parse(readFileSync(OUT, 'utf8')).projects)
  } catch {
    // файла ещё нет
  }
  if (previous === JSON.stringify(projects)) {
    console.log(`[sync] без изменений, проектов: ${projects.length}`)
    return
  }
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), projects }, null, 2) + '\n')
  console.log(`[sync] записано проектов: ${projects.length} → src/data/projects.generated.json`)
}

main().catch((err) => {
  // Сеть или лимиты GitHub не должны ломать сборку сайта
  console.warn(`[sync] не удалось обновить список проектов: ${err instanceof Error ? err.message : err}`)
  console.warn('[sync] сайт соберётся с прошлой версией списка')
  if (process.argv.includes('--strict')) process.exit(1)
})
