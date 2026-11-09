import { usePreferences } from '../../../hooks/usePreferences'
import { formatMegabytes } from '../../../lib/format'
import { latestInstaller } from '../../../lib/projects'
import type { Project } from '../../../types'
import { Button } from '../../ui/Button/Button'

/** «Скачать для Windows» с версией и размером из последнего релиза; без релиза не показывается */
export function DownloadButton({ project, variant = 'ghost' }: { project: Project; variant?: 'primary' | 'ghost' }) {
  const { t, lang } = usePreferences()
  const installer = latestInstaller(project)
  if (!installer) return null
  return (
    <Button href={installer.url} variant={variant} icon="windows" note={`${installer.tag} · ${formatMegabytes(installer.size, lang, t.units.mb)}`}>
      {t.projects.download}
    </Button>
  )
}
