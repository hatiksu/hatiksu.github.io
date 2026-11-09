// Встраивает приложения в сайт и снимает их скриншоты.
//
// Для каждого проекта из src/data/projects.generated.json с публичным репозиторием на GitHub:
//   1. клонирует репозиторий (кеш — .apps-cache/<slug>), ставит зависимости и собирает приложение
//      без Service Worker (DESKTOP=1), чтобы оно не кешировалось внутри сайта;
//   2. кладёт сборку в public/apps/<slug>/ — на сайте её можно открыть и поиграть прямо на странице;
//   3. открывает приложение в Playwright и снимает экраны компьютера и телефона в public/shots/
//      (JPEG для превью и уменьшенный WebP для сайта);
//   4. записывает список в src/data/apps.generated.json.
// Если коммит не изменился и всё на месте, проект пропускается.
//
// Запуск: npm run apps  (--force — пересобрать всё, --no-shots — без скриншотов)
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PortfolioProject } from '../src/lib/projects.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, '.apps-cache')
const PUBLIC = join(ROOT, 'public')
const APPS = join(PUBLIC, 'apps')
const SHOTS = join(PUBLIC, 'shots')
const OUT = join(ROOT, 'src', 'data', 'apps.generated.json')
const FORCE = process.argv.includes('--force')
const SHOOT = !process.argv.includes('--no-shots')

export interface AppsData {
  apps: Record<string, { commit: string; shots: { desktop: string; mobile: string } | null }>
}

const run = (cmd: string, args: string[], cwd: string, env: Record<string, string> = {}) =>
  execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', env: { ...process.env, ...env } }).trim()

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

/** Клонирует или обновляет репозиторий; возвращает хеш коммита */
function checkout(repo: string, dir: string): string {
  const url = `https://github.com/${repo}.git`
  if (existsSync(join(dir, '.git'))) {
    run('git', ['fetch', '--depth', '1', 'origin', 'HEAD'], dir)
    run('git', ['reset', '--hard', 'FETCH_HEAD'], dir)
  } else {
    rmSync(dir, { recursive: true, force: true })
    run('git', ['clone', '--depth', '1', url, dir], ROOT)
  }
  return run('git', ['rev-parse', 'HEAD'], dir)
}

function build(dir: string) {
  run('npm', ['ci', '--no-audit', '--no-fund', '--loglevel=error'], dir, { ELECTRON_SKIP_BINARY_DOWNLOAD: '1' })
  run('npm', ['run', 'build'], dir, { DESKTOP: '1' })
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
  '.woff2': 'font/woff2',
}

/** Простой статический сервер для скриншотов */
function serve(dir: string): Promise<{ server: Server; port: number }> {
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)
    if (path.endsWith('/')) path += 'index.html'
    const file = normalize(join(dir, path))
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: (server.address() as { port: number }).port })))
}

async function shoot(projects: PortfolioProject[]) {
  const { chromium } = await import('@playwright/test')
  const { server, port } = await serve(PUBLIC)
  const browser = await chromium.launch()
  mkdirSync(SHOTS, { recursive: true })
  try {
    for (const { slug, shot } of projects) {
      const views = [
        { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false },
        { name: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true },
      ] as const
      for (const v of views) {
        const context = await browser.newContext({
          viewport: v.viewport,
          deviceScaleFactor: v.deviceScaleFactor,
          isMobile: v.isMobile,
          hasTouch: v.isMobile,
          colorScheme: 'dark',
          locale: 'ru-RU',
          reducedMotion: 'no-preference',
        })
        const page = await context.newPage()
        await page.goto(`http://127.0.0.1:${port}/apps/${slug}/`, { waitUntil: 'networkidle' })
        // Даём отыграть стартовые анимации
        await page.waitForTimeout(1500)
        if (shot?.click) {
          await page.getByText(shot.click).first().click({ timeout: 5000 }).catch(() => console.warn(`  ⚠ ${slug}: нет кнопки «${shot.click}»`))
          // Ждём, пока исчезнут всплывающие уведомления
          await page.waitForTimeout(5000)
        }
        await page.screenshot({ path: join(SHOTS, `${slug}-${v.name}.jpg`), type: 'jpeg', quality: 82 })
        await context.close()
        console.log(`  📸 ${slug}-${v.name}.jpg`)
      }
    }
  } finally {
    await browser.close()
    server.close()
  }
}

/** Уменьшенные WebP-копии скриншотов для сайта (кодирует сам Chromium через canvas) */
async function makeWebp() {
  const { chromium } = await import('@playwright/test')
  const sizes: Record<string, number> = { desktop: 960, mobile: 420 }
  const jobs = Object.values(readJson<AppsData>(OUT, { apps: {} }).apps)
    .flatMap((a) => (a.shots ? [a.shots.desktop, a.shots.mobile] : []))
    .map((rel) => ({ jpg: join(PUBLIC, rel), webp: join(PUBLIC, rel.replace(/\.jpg$/, '.webp')), width: sizes[rel.includes('-mobile') ? 'mobile' : 'desktop'] }))
    .filter((j) => existsSync(j.jpg) && (!existsSync(j.webp) || statSync(j.webp).mtimeMs < statSync(j.jpg).mtimeMs))
  if (!jobs.length) return
  const browser = await chromium.launch()
  const page = await browser.newPage()
  for (const j of jobs) {
    const src = `data:image/jpeg;base64,${readFileSync(j.jpg).toString('base64')}`
    const data = await page.evaluate(
      async ({ src, width }) => {
        const img = new Image()
        img.src = src
        await img.decode()
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = Math.round((img.height / img.width) * width)
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/webp', 0.8).split(',')[1]
      },
      { src, width: j.width },
    )
    writeFileSync(j.webp, Buffer.from(data, 'base64'))
    console.log(`  🗜  ${j.webp.split('/public/')[1]}`)
  }
  await browser.close()
}

async function main() {
  const { projects } = readJson<{ projects: PortfolioProject[] }>(join(ROOT, 'src', 'data', 'projects.generated.json'), { projects: [] })
  const prev = readJson<AppsData>(OUT, { apps: {} })
  const next: AppsData = { apps: {} }
  const toShoot: PortfolioProject[] = []
  mkdirSync(CACHE, { recursive: true })

  for (const p of projects) {
    if (!p.repo) continue
    const dir = join(CACHE, p.slug)
    const target = join(APPS, p.slug)
    try {
      console.log(`[apps] ${p.repo}`)
      const commit = checkout(p.repo, dir)
      const shotsExist = existsSync(join(SHOTS, `${p.slug}-desktop.jpg`)) && existsSync(join(SHOTS, `${p.slug}-mobile.jpg`))
      const fresh = !FORCE && prev.apps[p.slug]?.commit === commit && existsSync(join(target, 'index.html'))
      if (!fresh) {
        build(dir)
        rmSync(target, { recursive: true, force: true })
        cpSync(join(dir, 'dist'), target, { recursive: true })
        console.log(`  ✓ собрано → public/apps/${p.slug}/`)
      } else {
        console.log('  ✓ без изменений')
      }
      if (SHOOT && (!fresh || !shotsExist)) toShoot.push(p)
      next.apps[p.slug] = {
        commit,
        shots: SHOOT || shotsExist ? { desktop: `shots/${p.slug}-desktop.jpg`, mobile: `shots/${p.slug}-mobile.jpg` } : null,
      }
    } catch (err) {
      console.warn(`  ⚠ ${p.repo} не собран: ${err instanceof Error ? err.message.split('\n')[0] : err}`)
      if (process.argv.includes('--strict')) process.exit(1)
    }
  }

  if (toShoot.length) await shoot(toShoot)
  writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n')
  await makeWebp()
  console.log(`[apps] встроено приложений: ${Object.keys(next.apps).length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
