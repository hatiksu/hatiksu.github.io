import { describe, expect, it } from 'vitest'
import { complete, findProject, runCommand, type TermContext } from './terminal'

const ctx: TermContext = {
  lang: 'ru',
  name: 'Hatiksu',
  stack: ['React', 'TypeScript'],
  contacts: { email: 'me@example.com', telegram: 'https://t.me/someone', github: 'https://github.com/someone' },
  projects: [
    { slug: 'orbit-game', title: 'Орбита', aliases: ['Орбита — аркада', 'Orbit — a one-tap arcade'], tags: [], playable: true, download: { url: 'https://x/orbit.exe', tag: 'v1.0.0' } },
    { slug: 'prism-puzzle', title: 'Призма', aliases: ['Призма', 'Prism'], tags: [], playable: true },
    { slug: 'portfolio', title: 'Портфолио', aliases: ['Портфолио'], tags: [], playable: false },
  ],
}

describe('findProject', () => {
  it('по slug, началу slug и словам названия на обоих языках', () => {
    expect(findProject('orbit-game', ctx.projects)?.slug).toBe('orbit-game')
    expect(findProject('orb', ctx.projects)?.slug).toBe('orbit-game')
    expect(findProject('орбита', ctx.projects)?.slug).toBe('orbit-game')
    expect(findProject('Prism', ctx.projects)?.slug).toBe('prism-puzzle')
    expect(findProject('xyz', ctx.projects)).toBeUndefined()
  })
})

describe('runCommand', () => {
  it('help перечисляет команды, но не пасхалки', () => {
    const text = runCommand('help', ctx).lines.map((l) => l.text).join('\n')
    expect(text).toContain('play <p>')
    expect(text).toContain('contact')
    expect(text).not.toContain('sudo')
  })

  it('play и open возвращают действие', () => {
    expect(runCommand('play orbit', ctx).effect).toEqual({ type: 'play', slug: 'orbit-game' })
    expect(runCommand('open призма', ctx).effect).toEqual({ type: 'navigate', hash: '/project/prism-puzzle' })
    expect(runCommand('cd ~', ctx).effect).toEqual({ type: 'navigate', hash: 'top' })
  })

  it('понятные ошибки', () => {
    expect(runCommand('play', ctx).lines[0].tone).toBe('error')
    expect(runCommand('play portfolio', ctx).effect).toBeUndefined()
    expect(runCommand('download prism', ctx).lines[0].text).toContain('нет установщика')
    const unknown = runCommand('orbit', ctx).lines.map((l) => l.text)
    expect(unknown[0]).toContain('Команда не найдена')
    expect(unknown[1]).toContain('open orbit-game')
  })

  it('download, синонимы и пасхалки', () => {
    expect(runCommand('download orbit', ctx).effect).toEqual({ type: 'download', url: 'https://x/orbit.exe' })
    expect(runCommand('LS', ctx).lines.some((l) => l.text.includes('orbit-game'))).toBe(true)
    expect(runCommand('cat about.txt', ctx).lines[0].text).toBe('Hatiksu')
    expect(runCommand('sudo hire', ctx).lines[0].tone).toBe('ok')
    expect(runCommand('clear', ctx).effect).toEqual({ type: 'clear' })
    expect(runCommand('   ', ctx).lines).toEqual([])
  })

  it('отвечает на английском', () => {
    expect(runCommand('nope', { ...ctx, lang: 'en' }).lines[0].text).toBe('Command not found: nope')
  })
})

describe('complete', () => {
  it('дополняет команды', () => {
    expect(complete('pl', ctx)).toEqual({ value: 'play ', options: [] })
    expect(complete('c', ctx).options).toEqual(['contact', 'clear'])
  })

  it('дополняет проекты с учётом команды', () => {
    expect(complete('play o', ctx).value).toBe('play orbit-game')
    expect(complete('play p', ctx).value).toBe('play prism-puzzle')
    expect(complete('open p', ctx).options).toEqual(['prism-puzzle', 'portfolio'])
    expect(complete('download ', ctx).value).toBe('download orbit-game')
  })
})
