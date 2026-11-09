// Cloudflare Worker для формы «Написать мне»: принимает сообщение с сайта и пересылает его в Telegram.
// Токен бота хранится в секретах Worker и никогда не попадает на сайт.
import { formatTelegram, validateMessage } from '../../src/lib/contact.ts'

export interface Env {
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_CHAT_ID: string
  /** Сайты, с которых можно отправлять форму, через запятую */
  ALLOWED_ORIGINS: string
}

const MAX_BODY = 10_000
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 3

/** Ограничение частоты в памяти изолята: защищает от потока сообщений с одного адреса */
const hits = new Map<string, number[]>()

export function rateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  // Не даём карте разрастаться
  if (hits.size > 5000) hits.clear()
  return false
}

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  return origin && allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
    : { Vary: 'Origin' }
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } })

export async function handle(request: Request, env: Env, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const origin = request.headers.get('Origin')
  const headers = cors(origin, env)
  const allowedOrigin = 'Access-Control-Allow-Origin' in headers

  if (request.method === 'OPTIONS') return new Response(null, { status: allowedOrigin ? 204 : 403, headers })
  if (request.method === 'GET') return new Response('hatiksu contact worker: ok', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, headers)
  if (!allowedOrigin) return json({ ok: false, error: 'origin' }, 403, headers)
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ ok: false, error: 'config' }, 500, headers)

  const text = await request.text()
  if (text.length > MAX_BODY) return json({ ok: false, error: 'tooLarge' }, 413, headers)
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return json({ ok: false, error: 'json' }, 400, headers)
  }

  const result = validateMessage(body)
  // Спамеру отвечаем «успехом», чтобы он не подбирал обход
  if (!result.ok && result.spam) return json({ ok: true }, 200, headers)
  if (!result.ok) return json({ ok: false, error: 'invalid', fields: result.errors }, 422, headers)

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  if (rateLimited(ip)) return json({ ok: false, error: 'rate' }, 429, headers)

  const country = (request as Request & { cf?: { country?: string } }).cf?.country
  const page = typeof (body as { page?: unknown }).page === 'string' ? (body as { page: string }).page.slice(0, 100) : undefined
  const tg = await fetchImpl(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: formatTelegram(result.value, { country, page }), parse_mode: 'HTML', disable_web_page_preview: true }),
  })
  if (!tg.ok) return json({ ok: false, error: 'telegram' }, 502, headers)
  return json({ ok: true }, 200, headers)
}
