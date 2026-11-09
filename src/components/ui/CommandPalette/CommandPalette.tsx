import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { site } from '../../../data/site'
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll'
import { usePreferences } from '../../../hooks/usePreferences'
import { latestInstaller, localizeProject } from '../../../lib/projects'
import { projectHref } from '../../../lib/router'
import { search } from '../../../lib/search'
import { copyText, toast } from '../../../lib/toast'
import { Icon, type IconName } from '../Icon/Icon'
import styles from './CommandPalette.module.css'

interface Command {
  id: string
  group: string
  label: string
  keywords?: string
  icon: IconName
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  /** Открыть встроенное приложение проекта */
  onPlay: (slug: string) => void
}

/** Командная палитра (Ctrl+K / ⌘K): разделы, проекты и действия с поиском и управлением с клавиатуры */
export function CommandPalette({ open, onClose, onPlay }: CommandPaletteProps) {
  useLockBodyScroll(open)
  return <AnimatePresence>{open && <Palette onClose={onClose} onPlay={onPlay} />}</AnimatePresence>
}

function Palette({ onClose, onPlay }: Omit<CommandPaletteProps, 'open'>) {
  const { t, lang, theme, toggleLang, toggleTheme } = usePreferences()
  const [query, setQueryState] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const setQuery = (q: string) => {
    setQueryState(q)
    setActive(0)
  }

  const commands = useMemo<Command[]>(() => {
    const go = (hash: string) => () => {
      location.hash = hash
    }
    const sections: Command[] = site.sections.map((id) => ({
      id: `s-${id}`,
      group: t.palette.sections,
      label: t.nav[id],
      keywords: id,
      icon: 'hash',
      run: go(id),
    }))
    const projects: Command[] = site.projects.flatMap((raw) => {
      const p = localizeProject(raw, lang)
      const installer = latestInstaller(p)
      const keywords = `${p.tags.join(' ')} ${raw.title} ${raw.en?.title ?? ''} ${p.slug}`
      return [
        {
          id: `p-${p.slug}`,
          group: t.palette.projects,
          label: p.title,
          keywords,
          icon: 'next' as IconName,
          run: go(projectHref(p.slug).slice(1)),
        },
        ...(site.apps[p.slug]
          ? [
              {
                id: `play-${p.slug}`,
                group: t.palette.actions,
                label: `${t.palette.play}: ${p.title}`,
                keywords: `${keywords} play играть`,
                icon: 'play' as IconName,
                run: () => onPlay(p.slug),
              },
            ]
          : []),
        ...(installer
          ? [
              {
                id: `dl-${p.slug}`,
                group: t.palette.actions,
                label: `${t.palette.download}: ${p.title} ${installer.tag}`,
                keywords: `${keywords} windows exe download скачать`,
                icon: 'windows' as IconName,
                run: () => window.open(installer.url, '_self'),
              },
            ]
          : []),
      ]
    })
    const actions: Command[] = [
      {
        id: 'theme',
        group: t.palette.actions,
        label: theme === 'dark' ? t.prefs.toLight : t.prefs.toDark,
        keywords: 'theme тема dark light',
        icon: theme === 'dark' ? 'sun' : 'moon',
        run: toggleTheme,
      },
      {
        id: 'lang',
        group: t.palette.actions,
        label: t.prefs.lang,
        keywords: 'language язык english русский',
        icon: 'globe',
        run: toggleLang,
      },
      {
        id: 'email',
        group: t.palette.actions,
        label: `${t.palette.copyEmail}: ${site.contacts.email}`,
        keywords: 'email mail почта',
        icon: 'copy',
        run: () => void copyText(site.contacts.email).then((ok) => ok && toast(t.palette.emailCopied)),
      },
    ]
    const links: Command[] = [
      {
        id: 'gh',
        group: t.palette.links,
        label: 'GitHub',
        keywords: 'code код',
        icon: 'github',
        run: () => window.open(site.contacts.github, '_blank', 'noopener'),
      },
      {
        id: 'tg',
        group: t.palette.links,
        label: 'Telegram',
        keywords: 'телеграм',
        icon: 'send',
        run: () => window.open(site.contacts.telegram, '_blank', 'noopener'),
      },
      {
        id: 'mail',
        group: t.palette.links,
        label: t.nav.mail,
        keywords: 'email',
        icon: 'mail',
        run: () => (location.href = `mailto:${site.contacts.email}`),
      },
    ]
    return [
      ...projects.filter((c) => c.id.startsWith('p-')),
      ...sections,
      ...projects.filter((c) => !c.id.startsWith('p-')),
      ...actions,
      ...links,
    ]
  }, [t, lang, theme, toggleLang, toggleTheme, onPlay])

  const results = useMemo(() => search(commands, query), [commands, query])

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [])

  // Прокручиваем список к выбранному пункту
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const runCommand = (c: Command | undefined) => {
    if (!c) return
    onClose()
    // Действие — после закрытия, чтобы фокус и прокрутка вернулись к странице
    requestAnimationFrame(() => c.run())
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (results.length ? (i + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runCommand(results[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.search}
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      >
        <div className={styles.field}>
          <Icon name="search" />
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.palette.placeholder}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>Esc</kbd>
        </div>
        <ul ref={listRef} id={listId} className={styles.list} role="listbox" aria-label={t.nav.search}>
          {results.length === 0 && <li className={styles.empty}>{t.palette.empty}</li>}
          {results.map((c, i) => (
            <li key={c.id} role="presentation">
              {(i === 0 || results[i - 1].group !== c.group) && <span className={styles.group}>{c.group}</span>}
              <div
                id={`${listId}-${c.id}`}
                role="option"
                aria-selected={i === active}
                data-index={i}
                className={`${styles.item} ${i === active ? styles.active : ''}`}
                onMouseMove={() => setActive(i)}
                onClick={() => runCommand(c)}
              >
                <Icon name={c.icon} size={17} />
                <span className={styles.label}>{c.label}</span>
                {i === active && <span className={styles.enter}>↵</span>}
              </div>
            </li>
          ))}
        </ul>
        <footer className={styles.footer}>{t.palette.hint}</footer>
      </motion.div>
    </motion.div>
  )
}
