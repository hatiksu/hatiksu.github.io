import { describe, expect, it } from 'vitest'
import { githubRepo, latestInstaller, localizeProject, mergeProjects, parseManifest, parseReleases, slugify, type PortfolioProject } from './projects'

const source = { repo: 'hatiksu/demo', branch: 'main', isPrivate: false, updatedAt: '2026-11-01T10:00:00Z' }

describe('parseManifest', () => {
  it('нормализует полный манифест', () => {
    const p = parseManifest(
      {
        title: '  Трекер  ',
        description: 'Описание',
        tags: ['React', '', 42, 'PWA'],
        highlights: ['Раз', 'Два'],
        mockup: 'finance',
        icon: '💰',
        demo: 'https://example.com/app',
        order: 1,
      },
      source,
    )
    expect(p).toEqual({
      id: 'hatiksu/demo@main',
      slug: 'demo',
      title: 'Трекер',
      text: 'Описание',
      tags: ['React', 'PWA'],
      points: ['Раз', 'Два'],
      mockup: 'finance',
      icon: '💰',
      demo: 'https://example.com/app',
      code: 'https://github.com/hatiksu/demo/tree/main',
      repo: 'hatiksu/demo',
      updatedAt: '2026-11-01T10:00:00Z',
      order: 1,
    })
  })

  it('без названия или описания — пропускаем', () => {
    expect(parseManifest({ title: 'Только название' }, source)).toBeNull()
    expect(parseManifest({ description: 'Только описание' }, source)).toBeNull()
    expect(parseManifest('не объект', source)).toBeNull()
    expect(parseManifest(null, source)).toBeNull()
  })

  it('неизвестный макет — универсальный, иконка по умолчанию', () => {
    const p = parseManifest({ title: 'Бот', description: 'Телеграм-бот', mockup: 'space-shuttle' }, source)!
    expect(p.mockup).toBe('generic')
    expect(p.icon).toBe('🚀')
    expect(p.tags).toEqual([])
    expect(p.order).toBeUndefined()
  })

  it('приватный репозиторий — без ссылки на код, если её не указали явно', () => {
    const priv = { ...source, isPrivate: true }
    expect(parseManifest({ title: 'A', description: 'B' }, priv)!.code).toBeUndefined()
    expect(parseManifest({ title: 'A', description: 'B', code: 'https://gitlab.com/x' }, priv)!.code).toBe('https://gitlab.com/x')
  })

  it('принимает только https-ссылки', () => {
    const p = parseManifest({ title: 'A', description: 'B', demo: 'javascript:alert(1)', code: 'http://x.ru' }, source)!
    expect(p.demo).toBeUndefined()
    expect(p.code).toBe('https://github.com/hatiksu/demo/tree/main')
  })

  it('ограничивает длину и количество', () => {
    const p = parseManifest({ title: 'Я'.repeat(200), description: 'B', tags: Array(20).fill('tag'), highlights: Array(9).fill('x') }, source)!
    expect(p.title).toHaveLength(80)
    expect(p.tags).toHaveLength(8)
    expect(p.points).toHaveLength(5)
  })
})

const project = (title: string, updatedAt: string, order?: number): PortfolioProject => ({
  id: `${title}@${updatedAt}`,
  slug: title.toLowerCase(),
  title,
  text: 't',
  tags: [],
  points: [],
  mockup: 'generic',
  icon: '🚀',
  updatedAt,
  ...(order !== undefined ? { order } : {}),
})

describe('mergeProjects', () => {
  it('один проект в нескольких ветках — берём самую свежую версию', () => {
    const merged = mergeProjects([project('Трекер', '2026-10-01'), project('трекер', '2026-11-05'), project('Трекер', '2026-09-01')])
    expect(merged).toHaveLength(1)
    expect(merged[0].updatedAt).toBe('2026-11-05')
  })

  it('сначала по order, затем новые сверху', () => {
    const merged = mergeProjects([
      project('Старый без порядка', '2026-01-01'),
      project('Второй', '2026-05-01', 2),
      project('Новый без порядка', '2026-11-01'),
      project('Первый', '2026-03-01', 1),
    ])
    expect(merged.map((p) => p.title)).toEqual(['Первый', 'Второй', 'Новый без порядка', 'Старый без порядка'])
  })
})

describe('адрес страницы и репозиторий', () => {
  it('slug: из манифеста, затем из репозитория с кодом, затем из ветки', () => {
    const branch = { ...source, repo: 'hatiksu/Claude-Code', branch: 'feature/orbit-game', isPrivate: true }
    expect(parseManifest({ title: 'A', description: 'B', slug: 'My Game!' }, branch)!.slug).toBe('my-game')
    expect(parseManifest({ title: 'A', description: 'B', code: 'https://github.com/hatiksu/prism-puzzle' }, branch)!.slug).toBe('prism-puzzle')
    expect(parseManifest({ title: 'A', description: 'B' }, branch)!.slug).toBe('orbit-game')
    expect(parseManifest({ title: 'A', description: 'B' }, { ...source, repo: 'hatiksu/Cool.App' })!.slug).toBe('cool-app')
  })

  it('githubRepo и slugify', () => {
    expect(githubRepo('https://github.com/hatiksu/orbit-game')).toBe('hatiksu/orbit-game')
    expect(githubRepo('https://github.com/a/b.git')).toBe('a/b')
    expect(githubRepo('https://github.com/a/b/tree/main')).toBe('a/b')
    expect(githubRepo('https://gitlab.com/a/b')).toBeUndefined()
    expect(slugify('  Привет World 2 ')).toBe('world-2')
  })
})

describe('перевод', () => {
  it('берёт поле en и подставляет его для английского', () => {
    const p = parseManifest(
      { title: 'Орбита', description: 'Игра', highlights: ['Раз'], en: { title: 'Orbit', description: 'A game', highlights: ['One'] } },
      source,
    )!
    expect(p.en).toEqual({ title: 'Orbit', text: 'A game', points: ['One'] })
    expect(localizeProject(p, 'en')).toMatchObject({ title: 'Orbit', text: 'A game', points: ['One'] })
    expect(localizeProject(p, 'ru').title).toBe('Орбита')
  })

  it('подготовка к скриншоту', () => {
    expect(parseManifest({ title: 'A', description: 'B', shot: { click: 'Демо' } }, source)!.shot).toEqual({ click: 'Демо' })
    expect(parseManifest({ title: 'A', description: 'B', shot: 'x' }, source)!.shot).toBeUndefined()
  })

  it('неполный перевод игнорируется', () => {
    expect(parseManifest({ title: 'A', description: 'B', en: { title: 'Only title' } }, source)!.en).toBeUndefined()
  })
})

describe('parseReleases', () => {
  const raw = [
    {
      tag_name: 'v1.0.0',
      name: 'v1.0.0',
      published_at: '2026-11-01T10:00:00Z',
      body: 'Первый релиз',
      assets: [
        { name: 'app.blockmap', browser_download_url: 'https://x/app.blockmap', size: 1 },
        { name: 'app-Setup-1.0.0.exe', browser_download_url: 'https://github.com/a/b/releases/download/v1.0.0/app.exe', size: 120_000_000, download_count: 7 },
      ],
    },
    { tag_name: 'v1.1.0', published_at: '2026-11-05T10:00:00Z', body: 'x'.repeat(2000), assets: [] },
    { tag_name: 'v2.0.0-beta', published_at: '2026-11-06T10:00:00Z', prerelease: true },
    { tag_name: 'draft', published_at: '2026-11-07T10:00:00Z', draft: true },
  ]

  it('без черновиков и бет, новые сверху, установщик .exe', () => {
    const r = parseReleases(raw)
    expect(r.map((x) => x.tag)).toEqual(['v1.1.0', 'v1.0.0'])
    expect(r[0].name).toBe('v1.1.0')
    expect(r[0].notes.length).toBeLessThanOrEqual(701)
    expect(r[0].installer).toBeUndefined()
    expect(r[1].installer).toEqual({
      name: 'app-Setup-1.0.0.exe',
      url: 'https://github.com/a/b/releases/download/v1.0.0/app.exe',
      size: 120_000_000,
      downloads: 7,
    })
  })

  it('latestInstaller — свежий релиз, в котором есть .exe', () => {
    const p = { ...parseManifest({ title: 'A', description: 'B' }, source)!, releases: parseReleases(raw) }
    expect(latestInstaller(p)).toMatchObject({ tag: 'v1.0.0', downloads: 7 })
    expect(parseReleases('нет')).toEqual([])
  })
})
