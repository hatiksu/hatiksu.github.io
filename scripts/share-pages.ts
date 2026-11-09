// После сборки: страницы для шаринга dist/p/<slug>/index.html.
// Мессенджеры и соцсети не видят адреса с # (#/project/…), поэтому для каждого проекта есть обычная страница
// с превью (Open Graph) — она сразу перенаправляет посетителя на страницу проекта внутри сайта.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PortfolioProject } from '../src/lib/projects.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const SITE_URL = process.env.SITE_URL ?? 'https://hatiksu.github.io/'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const { projects } = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'projects.generated.json'), 'utf8')) as { projects: PortfolioProject[] }

for (const p of projects) {
  const target = `../../#/project/${p.slug}`
  const url = `${SITE_URL}p/${p.slug}/`
  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)} — Hatiksu</title>
<meta name="description" content="${esc(p.text)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.text)}">
<meta property="og:image" content="${SITE_URL}og/${p.slug}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${url}">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)})</script>
</head>
<body style="background:#07080c;color:#eef0f6;font-family:system-ui,sans-serif">
<p><a href="${target}" style="color:#22d3ee">${esc(p.title)}</a></p>
</body>
</html>
`
  mkdirSync(join(DIST, 'p', p.slug), { recursive: true })
  writeFileSync(join(DIST, 'p', p.slug, 'index.html'), html)
}
// Карта сайта для поисковиков: главная и страницы проектов
const urls = [SITE_URL, ...projects.map((p) => `${SITE_URL}p/${p.slug}/`)]
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`,
)
console.log(`[share] страниц для шаринга: ${projects.length} → dist/p/, sitemap.xml`)
