import type { Lang } from './projects'

const locale = (lang: Lang) => (lang === 'ru' ? 'ru-RU' : 'en-US')

/** 120876666 → «115 МБ» / «115 MB» */
export function formatMegabytes(bytes: number, lang: Lang, unit: string): string {
  const mb = bytes / 1024 / 1024
  return `${new Intl.NumberFormat(locale(lang), { maximumFractionDigits: mb < 10 ? 1 : 0 }).format(mb)} ${unit}`
}

/** «9 ноября 2026» / «November 9, 2026» */
export function formatDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale(lang), { timeZone: 'UTC', ...opts }).format(d).replace(' г.', '')
}

export const formatNumber = (n: number, lang: Lang) => new Intl.NumberFormat(locale(lang)).format(n)
