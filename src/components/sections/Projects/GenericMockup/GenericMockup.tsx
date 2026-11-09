import styles from './GenericMockup.module.css'

interface GenericMockupProps {
  icon: string
  title: string
}

/** Универсальный макет для новых проектов: большая иконка на «карточке приложения». */
export function GenericMockup({ icon, title }: GenericMockupProps) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.title}>{title}</span>
      <span className={styles.lines}>
        <i />
        <i />
        <i />
      </span>
    </div>
  )
}
