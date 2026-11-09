// Картинки превью для соцсетей и мессенджеров (1200×630): общая для сайта и своя для каждого проекта.
// Рендерит HTML-шаблон в Playwright и сохраняет public/og/*.jpg. Запуск: npm run og
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PortfolioProject } from '../src/lib/projects.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'og')
const NAME = 'Hatiksu'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const dataUrl = (file: string) => (existsSync(file) ? `data:image/jpeg;base64,${readFileSync(file).toString('base64')}` : '')

function page(body: string) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Inter,sans-serif;color:#eef0f6;
background:radial-gradient(circle at 15% 10%,rgba(124,92,255,.55),transparent 50%),radial-gradient(circle at 95% 100%,rgba(34,211,238,.35),transparent 50%),radial-gradient(circle at 60% 40%,rgba(244,114,182,.18),transparent 45%),#07080c}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:60px 60px}
.wrap{position:relative;height:100%;padding:64px 72px;display:flex;flex-direction:column}
.logo{font:800 30px Unbounded}.logo span{color:#22d3ee}
.eyebrow{font:500 20px 'JetBrains Mono';color:#22d3ee;margin-top:auto}
h1{font:800 64px/1.05 Unbounded;letter-spacing:-.02em;margin:14px 0 18px}
.grad{background:linear-gradient(90deg,#7c5cff,#22d3ee,#f472b6);-webkit-background-clip:text;color:transparent}
p{font-size:24px;line-height:1.45;color:#a3aabb;max-width:640px}
.tags{display:flex;gap:10px;margin-top:26px;flex-wrap:wrap}
.tags span{padding:6px 14px;border-radius:999px;font:500 17px 'JetBrains Mono';color:#22d3ee;border:1px solid rgba(34,211,238,.35);background:rgba(34,211,238,.08)}
.shot{position:absolute;right:-40px;top:110px;width:560px;border-radius:16px;overflow:hidden;border:1px solid #2a2f3a;box-shadow:0 40px 80px -20px rgba(0,0,0,.9);transform:perspective(1200px) rotateY(-14deg)}
.shot img{width:100%;display:block}
.phone{position:absolute;right:60px;top:250px;width:180px;padding:5px;border-radius:26px;background:#050608;border:1px solid #2a2f3a;box-shadow:0 30px 60px -10px rgba(0,0,0,.9)}
.phone img{width:100%;display:block;border-radius:21px}
.narrow p,.narrow h1{max-width:580px}.narrow h1{font-size:48px}.narrow p{font-size:22px}
</style></head><body><div class="grid"></div>${body}</body></html>`
}

async function main() {
  const { projects } = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'projects.generated.json'), 'utf8')) as { projects: PortfolioProject[] }
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  mkdirSync(OUT, { recursive: true })

  const render = async (file: string, html: string) => {
    await p.setContent(html, { waitUntil: 'networkidle' })
    await p.evaluate(() => document.fonts.ready)
    await p.screenshot({ path: join(OUT, file), type: 'jpeg', quality: 88 })
    console.log(`  🖼  og/${file}`)
  }

  await render(
    'site.jpg',
    page(`<div class="wrap">
      <div class="logo">${NAME}<span>.</span></div>
      <div class="eyebrow">// портфолио разработчика</div>
      <h1>Привет, я <span class="grad">${NAME}</span></h1>
      <p>Веб-приложения, игры и интеграции с ИИ. ${projects.length} проектов — попробовать прямо на сайте или скачать для Windows.</p>
      <div class="tags">${['React', 'TypeScript', 'WebGL', 'Claude API', 'PWA'].map((t) => `<span>${t}</span>`).join('')}</div>
    </div>`),
  )

  for (const project of projects) {
    const desktop = dataUrl(join(ROOT, 'public', 'shots', `${project.slug}-desktop.jpg`))
    const mobile = dataUrl(join(ROOT, 'public', 'shots', `${project.slug}-mobile.jpg`))
    await render(
      `${project.slug}.jpg`,
      page(`${desktop ? `<div class="shot"><img src="${desktop}"></div>` : ''}${mobile ? `<div class="phone"><img src="${mobile}"></div>` : ''}
      <div class="wrap ${desktop ? 'narrow' : ''}">
        <div class="logo">${NAME}<span>.</span></div>
        <div class="eyebrow">${esc(project.tags.slice(0, 3).join(' · '))}</div>
        <h1>${esc(project.title)}</h1>
        <p>${esc(project.text.length > 120 ? project.text.slice(0, 120).replace(/\s+\S*$/, '') + '…' : project.text)}</p>
      </div>`),
    )
  }
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
