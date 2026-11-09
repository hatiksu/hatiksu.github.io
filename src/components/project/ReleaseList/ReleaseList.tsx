import { Fragment } from 'react'
import { usePreferences } from '../../../hooks/usePreferences'
import { formatDate, formatMegabytes, formatNumber } from '../../../lib/format'
import { parseMarkdown, type MdInline } from '../../../lib/markdown'
import type { Release } from '../../../lib/projects'
import { Icon } from '../../ui/Icon/Icon'
import styles from './ReleaseList.module.css'

function Inline({ parts }: { parts: MdInline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.type === 'code' ? <code key={i}>{p.value}</code> : p.type === 'bold' ? <strong key={i}>{p.value}</strong> : <Fragment key={i}>{p.value}</Fragment>,
      )}
    </>
  )
}

function Notes({ md }: { md: string }) {
  return (
    <div className={styles.notes}>
      {parseMarkdown(md).map((b, i) =>
        b.type === 'heading' ? (
          <h4 key={i}>
            <Inline parts={b.inline} />
          </h4>
        ) : b.type === 'list' ? (
          (() => {
            const List = b.ordered ? 'ol' : 'ul'
            return (
              <List key={i}>
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Inline parts={item} />
                  </li>
                ))}
              </List>
            )
          })()
        ) : (
          <p key={i}>
            <Inline parts={b.inline} />
          </p>
        ),
      )}
    </div>
  )
}

/** Лента релизов: версия, дата, установщик и описание */
export function ReleaseList({ releases }: { releases: Release[] }) {
  const { t, lang } = usePreferences()
  return (
    <ol className={styles.list}>
      {releases.map((r, i) => (
        <li key={r.tag} className={styles.item}>
          <div className={styles.head}>
            <span className={styles.tag}>{r.name}</span>
            {i === 0 && <span className={styles.latest}>{t.project.latest}</span>}
            <time className={styles.date} dateTime={r.publishedAt}>
              {formatDate(r.publishedAt, lang)}
            </time>
          </div>
          {r.installer && (
            <a className={styles.asset} href={r.installer.url}>
              <Icon name="download" size={16} />
              <span>{r.installer.name}</span>
              <small>
                {formatMegabytes(r.installer.size, lang, t.units.mb)} · {formatNumber(r.installer.downloads, lang)} {t.projects.downloads}
              </small>
            </a>
          )}
          {r.notes && <Notes md={r.notes} />}
        </li>
      ))}
    </ol>
  )
}
