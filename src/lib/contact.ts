// Сообщение из формы «Написать мне»: проверка полей, антиспам и данные для FormSubmit
// (сервис пересылает форму на почту — без своего сервера и ключей).

export const LIMITS = { name: 80, contact: 120, message: 2000, minMessage: 10, minFillMs: 2500 }

export interface ContactMessage {
  name: string
  /** Почта, @telegram или любой способ связи */
  contact: string
  message: string
  lang: 'ru' | 'en'
}

export type ContactField = 'name' | 'contact' | 'message'
export type ContactError = 'required' | 'tooLong' | 'tooShort' | 'invalid'

export type Validation =
  | { ok: true; value: ContactMessage }
  | { ok: false; spam: true }
  | { ok: false; spam?: false; errors: Partial<Record<ContactField, ContactError>> }

const str = (v: unknown) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : '')

/** Почта или ник Telegram/ссылка — чтобы было куда ответить */
export function isReachable(contact: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact) || /^@?[a-z0-9_]{4,32}$/i.test(contact) || /^https:\/\/t\.me\/[a-z0-9_]{4,32}$/i.test(contact)
}

/**
 * Проверяет данные формы. Антиспам: скрытое поле website должно быть пустым,
 * а форму не могли заполнить быстрее чем за пару секунд (elapsedMs).
 */
export function validateMessage(raw: unknown): Validation {
  if (!raw || typeof raw !== 'object') return { ok: false, errors: { message: 'required' } }
  const r = raw as Record<string, unknown>
  if (str(r.website) || (typeof r.elapsedMs === 'number' && r.elapsedMs < LIMITS.minFillMs)) return { ok: false, spam: true }

  const name = str(r.name)
  const contact = str(r.contact)
  const message = str(r.message)
  const errors: Partial<Record<ContactField, ContactError>> = {}
  if (!name) errors.name = 'required'
  else if (name.length > LIMITS.name) errors.name = 'tooLong'
  if (!contact) errors.contact = 'required'
  else if (contact.length > LIMITS.contact) errors.contact = 'tooLong'
  else if (!isReachable(contact)) errors.contact = 'invalid'
  if (!message) errors.message = 'required'
  else if (message.length < LIMITS.minMessage) errors.message = 'tooShort'
  else if (message.length > LIMITS.message) errors.message = 'tooLong'
  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, value: { name, contact, message, lang: r.lang === 'en' ? 'en' : 'ru' } }
}

/** Тело запроса к FormSubmit (https://formsubmit.co/ajax/<почта>): письмо с ответом на контакт отправителя */
export function toFormSubmit(m: ContactMessage, honey = '') {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.contact)
  return {
    name: m.name,
    contact: m.contact,
    message: m.message,
    lang: m.lang === 'en' ? 'English' : 'Русский',
    _subject: `Сообщение с сайта от ${m.name}`,
    _template: 'table',
    _captcha: 'false',
    _honey: honey,
    ...(isEmail ? { _replyto: m.contact } : {}),
  }
}
