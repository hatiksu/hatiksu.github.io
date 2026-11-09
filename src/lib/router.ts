// Маршруты на hash: сайт статический (GitHub Pages), поэтому адреса вида #/project/<slug>.
// Обычные якоря (#projects) остаются якорями главной страницы.

export type Route = { page: 'home'; section?: string } | { page: 'project'; slug: string } | { page: 'notfound' }

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#/, '')
  const project = h.match(/^\/project\/([a-z0-9-]+)\/?$/)
  if (project) return { page: 'project', slug: project[1] }
  if (!h || h === '/') return { page: 'home' }
  if (h.startsWith('/')) return { page: 'notfound' }
  return { page: 'home', section: decodeURIComponent(h) }
}

export const projectHref = (slug: string) => `#/project/${slug}`
export const sectionHref = (id: string) => `#${id}`
