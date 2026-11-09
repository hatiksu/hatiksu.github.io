import { describe, expect, it } from 'vitest'
import { mergeProjects, parseManifest, type PortfolioProject } from './projects'

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
      title: 'Трекер',
      text: 'Описание',
      tags: ['React', 'PWA'],
      points: ['Раз', 'Два'],
      mockup: 'finance',
      icon: '💰',
      demo: 'https://example.com/app',
      code: 'https://github.com/hatiksu/demo/tree/main',
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
