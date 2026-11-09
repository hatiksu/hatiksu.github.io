import { describe, expect, it } from 'vitest'
import { plural } from '../i18n/ru'
import { formatDate, formatMegabytes } from './format'
import { detectLang, detectTheme } from './prefs'
import { parseRoute, projectHref } from './router'

describe('parseRoute', () => {
  it('страница проекта', () => {
    expect(parseRoute('#/project/orbit-game')).toEqual({ page: 'project', slug: 'orbit-game' })
    expect(parseRoute(projectHref('prism-puzzle') + '/')).toEqual({ page: 'project', slug: 'prism-puzzle' })
  })

  it('главная и якоря разделов', () => {
    expect(parseRoute('')).toEqual({ page: 'home' })
    expect(parseRoute('#')).toEqual({ page: 'home' })
    expect(parseRoute('#projects')).toEqual({ page: 'home', section: 'projects' })
    expect(parseRoute('#/unknown')).toEqual({ page: 'home' })
    expect(parseRoute('#/project/<script>')).toEqual({ page: 'home' })
  })
})

describe('язык и тема', () => {
  it('сохранённый выбор важнее браузера', () => {
    expect(detectLang('en', ['ru-RU'])).toBe('en')
    expect(detectLang(null, ['ru-RU', 'en'])).toBe('ru')
    expect(detectLang(null, ['uk'])).toBe('ru')
    expect(detectLang(null, ['de-DE'])).toBe('en')
    expect(detectLang('xx', [])).toBe('ru')
  })

  it('тема: сохранённая, иначе системная', () => {
    expect(detectTheme('light', false)).toBe('light')
    expect(detectTheme(null, true)).toBe('light')
    expect(detectTheme(null, false)).toBe('dark')
  })
})

describe('форматирование', () => {
  it('мегабайты и даты', () => {
    expect(formatMegabytes(120_876_666, 'ru', 'МБ')).toBe('115 МБ')
    expect(formatMegabytes(5 * 1024 * 1024 + 300_000, 'en', 'MB')).toBe('5.3 MB')
    expect(formatDate('2026-11-09T11:35:31Z', 'ru')).toBe('9 ноября 2026')
    expect(formatDate('2026-11-09T11:35:31Z', 'en')).toBe('November 9, 2026')
    expect(formatDate('мусор', 'ru')).toBe('')
  })

  it('склонение', () => {
    expect([1, 2, 5, 11, 21, 22, 112].map((n) => plural(n, 'коммит', 'коммита', 'коммитов'))).toEqual([
      'коммит',
      'коммита',
      'коммитов',
      'коммитов',
      'коммит',
      'коммита',
      'коммитов',
    ])
  })
})
