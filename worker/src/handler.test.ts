import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handle, rateLimited, type Env } from './handler.ts'

const env: Env = { TELEGRAM_BOT_TOKEN: 'TOKEN', TELEGRAM_CHAT_ID: '42', ALLOWED_ORIGINS: 'https://hatiksu.github.io, http://localhost:5173' }
const body = { name: 'Анна', contact: 'anna@example.com', message: 'Привет! Есть идея проекта.', elapsedMs: 8000, website: '', lang: 'ru' }

let ipCounter = 0
const req = (init: { method?: string; origin?: string; body?: unknown; ip?: string } = {}) =>
  new Request('https://worker.test/', {
    method: init.method ?? 'POST',
    headers: { Origin: init.origin ?? 'https://hatiksu.github.io', 'Content-Type': 'application/json', 'CF-Connecting-IP': init.ip ?? `10.0.0.${++ipCounter}` },
    body: init.method === 'OPTIONS' || init.method === 'GET' ? undefined : typeof init.body === 'string' ? init.body : JSON.stringify(init.body ?? body),
  })

describe('worker', () => {
  let telegram: ReturnType<typeof vi.fn>
  beforeEach(() => {
    telegram = vi.fn(async () => new Response('{"ok":true}'))
  })

  it('пересылает сообщение в Telegram и отвечает с CORS', async () => {
    const res = await handle(req(), env, telegram as unknown as typeof fetch)
    expect(res.status).toBe(200)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://hatiksu.github.io')
    expect(await res.json()).toEqual({ ok: true })
    const [url, init] = telegram.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.telegram.org/botTOKEN/sendMessage')
    const sent = JSON.parse(init.body as string)
    expect(sent.chat_id).toBe('42')
    expect(sent.text).toContain('Анна')
  })

  it('preflight и чужой сайт', async () => {
    expect((await handle(req({ method: 'OPTIONS' }), env, telegram as unknown as typeof fetch)).status).toBe(204)
    const foreign = await handle(req({ origin: 'https://evil.example' }), env, telegram as unknown as typeof fetch)
    expect(foreign.status).toBe(403)
    expect(telegram).not.toHaveBeenCalled()
  })

  it('ошибки проверки — 422 с полями, спам — тихий «успех»', async () => {
    const bad = await handle(req({ body: { ...body, contact: 'никак' } }), env, telegram as unknown as typeof fetch)
    expect(bad.status).toBe(422)
    expect(await bad.json()).toMatchObject({ error: 'invalid', fields: { contact: 'invalid' } })
    const spam = await handle(req({ body: { ...body, website: 'x' } }), env, telegram as unknown as typeof fetch)
    expect(spam.status).toBe(200)
    expect(telegram).not.toHaveBeenCalled()
    expect((await handle(req({ body: '{oops' }), env, telegram as unknown as typeof fetch)).status).toBe(400)
  })

  it('ограничение частоты: не больше трёх за 10 минут', async () => {
    const ip = '192.168.1.1'
    for (let i = 0; i < 3; i++) expect((await handle(req({ ip }), env, telegram as unknown as typeof fetch)).status).toBe(200)
    expect((await handle(req({ ip }), env, telegram as unknown as typeof fetch)).status).toBe(429)
    expect(rateLimited('1.1.1.1', 0)).toBe(false)
    expect(rateLimited('1.1.1.1', 11 * 60_000)).toBe(false)
  })

  it('Telegram недоступен — 502, без настроек — 500', async () => {
    const down = vi.fn(async () => new Response('', { status: 500 }))
    expect((await handle(req(), env, down as unknown as typeof fetch)).status).toBe(502)
    expect((await handle(req(), { ...env, TELEGRAM_BOT_TOKEN: '' }, telegram as unknown as typeof fetch)).status).toBe(500)
  })
})
