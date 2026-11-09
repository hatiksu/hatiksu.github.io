import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { site } from '../../../data/site'
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll'
import { usePreferences } from '../../../hooks/usePreferences'
import { latestInstaller, localizeProject } from '../../../lib/projects'
import { complete, runCommand, type TermContext, type TermLine } from '../../../lib/terminal'
import styles from './Terminal.module.css'

interface TerminalProps {
  open: boolean
  onClose: () => void
  onPlay: (slug: string) => void
}

const BANNER = String.raw` _           _   _ _
| |__   __ _| |_(_) | _____ _   _
| '_ \ / _' | __| | |/ / __| | | |
| | | | (_| | |_| |   <\__ \ |_| |
|_| |_|\__,_|\__|_|_|\_\___/\__,_|`

/** Терминал-пасхалка: открывается клавишей ` (ё), команды help, projects, play, open, contact… */
export function Terminal({ open, onClose, onPlay }: TerminalProps) {
  useLockBodyScroll(open)
  return <AnimatePresence>{open && <Console onClose={onClose} onPlay={onPlay} />}</AnimatePresence>
}

interface Entry {
  id: number
  input?: string
  lines: TermLine[]
}

function Console({ onClose, onPlay }: Omit<TerminalProps, 'open'>) {
  const { t, lang, toggleLang, toggleTheme } = usePreferences()
  const ru = lang === 'ru'
  const [entries, setEntries] = useState<Entry[]>(() => [
    {
      id: 0,
      lines: [
        { text: BANNER, tone: 'accent' },
        { text: ru ? 'Добро пожаловать! Набери help — список команд.' : 'Welcome! Type help to list commands.', tone: 'muted' },
      ],
    },
  ])
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  const ctx = useMemo<TermContext>(
    () => ({
      lang,
      name: site.name,
      stack: site.stack.map((s) => s.name),
      contacts: site.contacts,
      projects: site.projects.map((raw) => {
        const p = localizeProject(raw, lang)
        const installer = latestInstaller(raw)
        return {
          slug: p.slug,
          title: p.title,
          aliases: [raw.title, raw.en?.title ?? ''].filter(Boolean),
          tags: p.tags,
          playable: Boolean(site.apps[p.slug]),
          ...(installer ? { download: { url: installer.url, tag: installer.tag } } : {}),
        }
      }),
    }),
    [lang],
  )

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [])

  // Новые строки — всегда внизу
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [entries])

  const push = (entry: Omit<Entry, 'id'>) => setEntries((list) => [...list, { ...entry, id: nextId.current++ }])

  const submit = () => {
    const input = value
    setValue('')
    setCursor(-1)
    if (input.trim()) setHistory((h) => [...h.filter((x) => x !== input), input].slice(-50))
    const result = runCommand(input, ctx)
    if (result.effect?.type === 'clear') {
      setEntries([])
      return
    }
    push({ input, lines: result.lines })
    const effect = result.effect
    if (!effect) return
    // Действия — после того как ответ отрисуется
    window.setTimeout(() => {
      switch (effect.type) {
        case 'navigate':
          onClose()
          location.hash = effect.hash
          break
        case 'play':
          onClose()
          onPlay(effect.slug)
          break
        case 'download':
          location.href = effect.url
          break
        case 'link':
          window.open(effect.url, '_blank', 'noopener')
          break
        case 'theme':
          toggleTheme()
          break
        case 'lang':
          toggleLang()
          break
        case 'exit':
          onClose()
          break
      }
    }, 250)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const { value: next, options } = complete(value, ctx)
      setValue(next)
      if (options.length) push({ input: value, lines: [{ text: options.join('   '), tone: 'muted' }] })
    } else if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault()
      const i = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1)
      setCursor(i)
      setValue(history[i])
    } else if (e.key === 'ArrowDown' && cursor >= 0) {
      e.preventDefault()
      const i = cursor + 1
      setCursor(i >= history.length ? -1 : i)
      setValue(i >= history.length ? '' : history[i])
    } else if (e.key === 'Escape' || (e.key === '`' && !value) || (e.key === 'l' && e.ctrlKey)) {
      e.preventDefault()
      if (e.key === 'l') setEntries([])
      else onClose()
    }
  }

  return (
    <>
      <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.section
        className={styles.terminal}
        role="dialog"
        aria-modal="true"
        aria-label={t.terminal.title}
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        exit={{ y: '-100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        onClick={() => inputRef.current?.focus()}
      >
        <header className={styles.bar}>
          <span className={styles.dots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className={styles.title}>guest@hatiksu: ~</span>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t.project.close}>
            esc
          </button>
        </header>
        <div ref={bodyRef} className={styles.body} aria-live="polite">
          {entries.map((entry) => (
            <div key={entry.id} className={styles.entry}>
              {entry.input !== undefined && (
                <div className={styles.prompt}>
                  <span className={styles.ps1}>guest@hatiksu:~$</span> {entry.input}
                </div>
              )}
              {entry.lines.map((l, i) => (
                <pre key={i} className={`${styles.line} ${l.tone ? styles[l.tone] : ''}`}>
                  {l.text}
                </pre>
              ))}
            </div>
          ))}
          <label className={styles.inputRow}>
            <span className={styles.ps1} aria-hidden="true">
              guest@hatiksu:~$
            </span>
            <input
              ref={inputRef}
              className={styles.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label={t.terminal.input}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
            />
          </label>
        </div>
        <footer className={styles.hints}>
          {['help', 'projects', 'play orbit', 'contact'].map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setValue(cmd)
                inputRef.current?.focus()
              }}
            >
              {cmd}
            </button>
          ))}
        </footer>
      </motion.section>
    </>
  )
}
