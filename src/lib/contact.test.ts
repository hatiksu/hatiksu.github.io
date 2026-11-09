import { describe, expect, it } from 'vitest'
import { formatTelegram, isReachable, validateMessage } from './contact'

const good = { name: 'Анна', contact: 'anna@example.com', message: 'Привет! Есть идея проекта.', elapsedMs: 9000, website: '' }

describe('validateMessage', () => {
  it('принимает корректное сообщение и чистит пробелы', () => {
    const r = validateMessage({ ...good, name: '  Анна ', lang: 'en' })
    expect(r).toEqual({ ok: true, value: { name: 'Анна', contact: 'anna@example.com', message: 'Привет! Есть идея проекта.', lang: 'en' } })
  })

  it('ошибки по полям', () => {
    const r = validateMessage({ name: '', contact: 'не контакт', message: 'кор', elapsedMs: 9000 })
    expect(r).toEqual({ ok: false, errors: { name: 'required', contact: 'invalid', message: 'tooShort' } })
    const long = validateMessage({ ...good, message: 'x'.repeat(2001) })
    expect(long.ok === false && !long.spam && long.errors.message).toBe('tooLong')
  })

  it('антиспам: скрытое поле и слишком быстрая отправка', () => {
    expect(validateMessage({ ...good, website: 'http://spam' })).toEqual({ ok: false, spam: true })
    expect(validateMessage({ ...good, elapsedMs: 300 })).toEqual({ ok: false, spam: true })
    expect(validateMessage(null)).toMatchObject({ ok: false })
  })

  it('куда ответить: почта, @ник, t.me', () => {
    expect(['a@b.co', '@whoareyou_q', 'whoareyou_q', 'https://t.me/someone'].every(isReachable)).toBe(true)
    expect(['', 'a@b', '@ab', 'hello world', 'http://t.me/x'].some(isReachable)).toBe(false)
  })
})

describe('formatTelegram', () => {
  it('экранирует HTML и добавляет подпись', () => {
    const text = formatTelegram({ name: '<b>Хакер</b>', contact: '@nick', message: 'a < b & c', lang: 'ru' }, { country: 'DE' })
    expect(text).toContain('&lt;b&gt;Хакер&lt;/b&gt;')
    expect(text).toContain('a &lt; b &amp; c')
    expect(text).toContain('@nick')
    expect(text).toContain('🇷🇺 RU · DE')
  })
})
