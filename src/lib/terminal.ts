// Терминал-пасхалка: разбор команд, ответы и автодополнение. Чистые функции — всё, что
// меняет страницу (переходы, запуск приложения, тема), возвращается как effect и выполняется компонентом.
import type { Lang } from './projects'

export interface TermProject {
  slug: string
  title: string
  /** Заголовки на обоих языках — для поиска «orbit» и «орбита» */
  aliases: string[]
  tags: string[]
  playable: boolean
  download?: { url: string; tag: string }
}

export interface TermContext {
  lang: Lang
  name: string
  projects: TermProject[]
  stack: string[]
  contacts: { email: string; telegram: string; github: string }
}

export type Tone = 'muted' | 'accent' | 'ok' | 'error'
export interface TermLine {
  text: string
  tone?: Tone
}

export type TermEffect =
  | { type: 'navigate'; hash: string }
  | { type: 'play'; slug: string }
  | { type: 'download'; url: string }
  | { type: 'link'; url: string }
  | { type: 'theme' }
  | { type: 'lang' }
  | { type: 'clear' }
  | { type: 'exit' }

export interface TermResult {
  lines: TermLine[]
  effect?: TermEffect
}

interface Command {
  name: string
  aliases?: string[]
  /** Аргумент — проект (для автодополнения) */
  takesProject?: boolean
  hidden?: boolean
  help: Record<Lang, string>
  run: (args: string[], ctx: TermContext) => TermResult
}

const L = (ctx: TermContext, ru: string, en: string) => (ctx.lang === 'ru' ? ru : en)
const line = (text: string, tone?: Tone): TermLine => (tone ? { text, tone } : { text })

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim()

/** Проект по началу slug или любому слову названия: «orbit», «орбита», «prism-puzzle» */
export function findProject(query: string, projects: TermProject[]): TermProject | undefined {
  const q = norm(query)
  if (!q) return undefined
  return (
    projects.find((p) => p.slug === q) ??
    projects.find((p) => p.slug.startsWith(q)) ??
    projects.find((p) =>
      p.aliases.some((a) =>
        norm(a)
          .split(/[\s—-]+/)
          .some((w) => w.startsWith(q)),
      ),
    )
  )
}

function needProject(cmd: string, args: string[], ctx: TermContext, filter?: (p: TermProject) => boolean): TermProject | TermResult {
  if (!args.length) {
    return {
      lines: [
        line(L(ctx, `Использование: ${cmd} <проект>`, `Usage: ${cmd} <project>`), 'error'),
        line(L(ctx, 'Список: projects', 'List: projects'), 'muted'),
      ],
    }
  }
  const p = findProject(args.join(' '), filter ? ctx.projects.filter(filter) : ctx.projects)
  if (!p) return { lines: [line(L(ctx, `Проект не найден: ${args.join(' ')}`, `Project not found: ${args.join(' ')}`), 'error')] }
  return p
}

const COMMANDS: Command[] = [
  {
    name: 'help',
    aliases: ['?', 'помощь'],
    help: { ru: 'список команд', en: 'list commands' },
    run: (_a, ctx) => ({
      lines: [
        line(L(ctx, 'Доступные команды:', 'Available commands:'), 'accent'),
        ...COMMANDS.filter((c) => !c.hidden).map((c) =>
          line(`  ${(c.name + (c.takesProject ? ' <p>' : '')).padEnd(16)}${c.help[ctx.lang]}`),
        ),
        line(L(ctx, 'Tab — дополнить, ↑↓ — история, Esc — закрыть', 'Tab — complete, ↑↓ — history, Esc — close'), 'muted'),
      ],
    }),
  },
  {
    name: 'whoami',
    aliases: ['about', 'cat about.txt'],
    help: { ru: 'кто я', en: 'who I am' },
    run: (_a, ctx) => ({
      lines: [
        line(ctx.name, 'accent'),
        line(L(ctx, 'Веб-разработчик: React, TypeScript, интеграции с ИИ.', 'Web developer: React, TypeScript, AI integrations.')),
        line(
          L(ctx, `Проектов: ${ctx.projects.length}. Открыт к новым задачам.`, `Projects: ${ctx.projects.length}. Open to new work.`),
          'muted',
        ),
      ],
    }),
  },
  {
    name: 'projects',
    aliases: ['ls', 'проекты'],
    help: { ru: 'все проекты', en: 'all projects' },
    run: (_a, ctx) => ({
      lines: [
        ...ctx.projects.map((p) =>
          line(`  ${p.slug.padEnd(18)}${p.title}${p.playable ? '  ▶' : ''}${p.download ? `  ⬇ ${p.download.tag}` : ''}`),
        ),
        line(
          L(ctx, '▶ — можно запустить (play), ⬇ — есть установщик (download)', '▶ — playable (play), ⬇ — installer (download)'),
          'muted',
        ),
      ],
    }),
  },
  {
    name: 'open',
    aliases: ['cd'],
    takesProject: true,
    help: { ru: 'страница проекта', en: 'project page' },
    run: (args, ctx) => {
      if (args[0] === '~' || args[0] === '/' || args[0] === '..')
        return { lines: [line('~', 'muted')], effect: { type: 'navigate', hash: 'top' } }
      const p = needProject('open', args, ctx)
      if (!('slug' in p)) return p
      return {
        lines: [line(L(ctx, `Открываю ${p.title}…`, `Opening ${p.title}…`), 'ok')],
        effect: { type: 'navigate', hash: `/project/${p.slug}` },
      }
    },
  },
  {
    name: 'play',
    aliases: ['run'],
    takesProject: true,
    help: { ru: 'запустить приложение прямо тут', en: 'launch the app right here' },
    run: (args, ctx) => {
      const p = needProject('play', args, ctx)
      if (!('slug' in p)) return p
      if (!p.playable) return { lines: [line(L(ctx, `${p.title} нельзя запустить на сайте`, `${p.title} can't run on the site`), 'error')] }
      return { lines: [line(L(ctx, `Запускаю ${p.title}…`, `Launching ${p.title}…`), 'ok')], effect: { type: 'play', slug: p.slug } }
    },
  },
  {
    name: 'download',
    aliases: ['wget', 'curl'],
    takesProject: true,
    help: { ru: 'скачать установщик для Windows', en: 'download the Windows installer' },
    run: (args, ctx) => {
      const p = needProject('download', args, ctx)
      if (!('slug' in p)) return p
      if (!p.download) return { lines: [line(L(ctx, `У ${p.title} нет установщика`, `${p.title} has no installer`), 'error')] }
      return {
        lines: [line(L(ctx, `Скачиваю ${p.title} ${p.download.tag}…`, `Downloading ${p.title} ${p.download.tag}…`), 'ok')],
        effect: { type: 'download', url: p.download.url },
      }
    },
  },
  {
    name: 'stack',
    aliases: ['skills'],
    help: { ru: 'технологии', en: 'tech stack' },
    run: (_a, ctx) => ({ lines: [line(ctx.stack.join(' · '))] }),
  },
  {
    name: 'contact',
    aliases: ['mail', 'контакты'],
    help: { ru: 'как связаться', en: 'get in touch' },
    run: (_a, ctx) => ({
      lines: [
        ...(ctx.contacts.email ? [line(`  email     ${ctx.contacts.email}`)] : []),
        ...(ctx.contacts.telegram ? [line(`  telegram  ${ctx.contacts.telegram.replace('https://t.me/', '@')}`)] : []),
        ...(ctx.contacts.github ? [line(`  github    ${ctx.contacts.github.replace('https://', '')}`)] : []),
        line(L(ctx, 'Форма «Написать мне» — внизу страницы', 'The contact form is at the bottom of the page'), 'muted'),
      ],
      effect: { type: 'navigate', hash: 'contact' },
    }),
  },
  {
    name: 'github',
    help: { ru: 'открыть GitHub', en: 'open GitHub' },
    run: (_a, ctx) => ({ lines: [line(ctx.contacts.github, 'ok')], effect: { type: 'link', url: ctx.contacts.github } }),
  },
  {
    name: 'theme',
    help: { ru: 'сменить тему', en: 'toggle theme' },
    run: (_a, ctx) => ({ lines: [line(L(ctx, 'Тема переключена', 'Theme toggled'), 'ok')], effect: { type: 'theme' } }),
  },
  {
    name: 'lang',
    help: { ru: 'English / русский', en: 'русский / English' },
    run: (_a, ctx) => ({ lines: [line(L(ctx, 'Switching to English', 'Переключаю на русский'), 'ok')], effect: { type: 'lang' } }),
  },
  {
    name: 'clear',
    aliases: ['cls'],
    help: { ru: 'очистить экран', en: 'clear the screen' },
    run: () => ({ lines: [], effect: { type: 'clear' } }),
  },
  {
    name: 'exit',
    aliases: ['quit', 'q'],
    help: { ru: 'закрыть терминал', en: 'close the terminal' },
    run: (_a, ctx) => ({ lines: [line(L(ctx, 'Пока!', 'Bye!'), 'muted')], effect: { type: 'exit' } }),
  },
  // Скрытые команды-пасхалки
  {
    name: 'sudo',
    hidden: true,
    help: { ru: '', en: '' },
    run: (args, ctx) => ({
      lines: [
        line(
          args[0] === 'hire'
            ? L(ctx, 'Права получены. Пиши: contact 😉', 'Permission granted. Type: contact 😉')
            : L(ctx, 'Хорошая попытка 😏', 'Nice try 😏'),
          args[0] === 'hire' ? 'ok' : 'error',
        ),
      ],
    }),
  },
  {
    name: 'rm',
    hidden: true,
    help: { ru: '', en: '' },
    run: (_a, ctx) => ({ lines: [line(L(ctx, 'rm: портфолио защищено от удаления 🛡', 'rm: the portfolio is delete-proof 🛡'), 'error')] }),
  },
  {
    name: 'echo',
    hidden: true,
    help: { ru: '', en: '' },
    run: (args) => ({ lines: [line(args.join(' '))] }),
  },
  {
    name: 'date',
    hidden: true,
    help: { ru: '', en: '' },
    run: (_a, ctx) => ({ lines: [line(new Date().toLocaleString(ctx.lang === 'ru' ? 'ru-RU' : 'en-US'))] }),
  },
  {
    name: 'hello',
    aliases: ['hi', 'привет'],
    hidden: true,
    help: { ru: '', en: '' },
    run: (_a, ctx) => ({ lines: [line(L(ctx, 'Привет! 👋 Набери help', 'Hi! 👋 Type help'), 'accent')] }),
  },
]

function resolve(input: string): { cmd?: Command; args: string[] } {
  const text = input.trim()
  const lower = text.toLowerCase()
  // Многословные синонимы вроде «cat about.txt»
  const multi = COMMANDS.find((c) => c.aliases?.some((a) => a.includes(' ') && lower === a))
  if (multi) return { cmd: multi, args: [] }
  const [head = '', ...args] = text.split(/\s+/)
  const name = head.toLowerCase()
  return { cmd: COMMANDS.find((c) => c.name === name || c.aliases?.includes(name)), args }
}

export function runCommand(input: string, ctx: TermContext): TermResult {
  const text = input.trim()
  if (!text) return { lines: [] }
  const { cmd, args } = resolve(text)
  if (!cmd) {
    const head = text.split(/\s+/)[0]
    // Если ввели название проекта без команды — подскажем
    const p = findProject(text, ctx.projects)
    return {
      lines: [
        line(L(ctx, `Команда не найдена: ${head}`, `Command not found: ${head}`), 'error'),
        line(p ? L(ctx, `Может, open ${p.slug}?`, `Maybe open ${p.slug}?`) : L(ctx, 'Набери help', 'Type help'), 'muted'),
      ],
    }
  }
  return cmd.run(args, ctx)
}

/** Общее начало строк */
function commonPrefix(list: string[]): string {
  if (!list.length) return ''
  let prefix = list[0]
  for (const s of list) while (!s.startsWith(prefix)) prefix = prefix.slice(0, -1)
  return prefix
}

/**
 * Автодополнение по Tab. Возвращает новую строку ввода и варианты, если их несколько.
 */
export function complete(input: string, ctx: TermContext): { value: string; options: string[] } {
  const parts = input.replace(/^\s+/, '').split(/\s+/)
  if (parts.length <= 1) {
    const q = (parts[0] ?? '').toLowerCase()
    const names = COMMANDS.filter((c) => !c.hidden)
      .map((c) => c.name)
      .filter((n) => n.startsWith(q))
    if (names.length === 1) return { value: `${names[0]} `, options: [] }
    const prefix = commonPrefix(names)
    return { value: prefix.length > q.length ? prefix : input, options: names.length > 1 ? names : [] }
  }
  const { cmd } = resolve(parts[0])
  if (!cmd?.takesProject) return { value: input, options: [] }
  const q = norm(parts.slice(1).join(' '))
  const pool =
    cmd.name === 'play'
      ? ctx.projects.filter((p) => p.playable)
      : cmd.name === 'download'
        ? ctx.projects.filter((p) => p.download)
        : ctx.projects
  const slugs = pool.map((p) => p.slug).filter((s) => s.startsWith(q))
  if (slugs.length === 1) return { value: `${parts[0]} ${slugs[0]}`, options: [] }
  const prefix = commonPrefix(slugs)
  return { value: prefix.length > q.length ? `${parts[0]} ${prefix}` : input, options: slugs.length > 1 ? slugs : [] }
}
