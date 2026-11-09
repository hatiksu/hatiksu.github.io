import styles from './EditorMockup.module.css'

/** Схематичный макет фоторедактора в окне браузера (если скриншотов ещё нет). */
export function EditorMockup() {
  return (
    <div className={styles.mock}>
      <div className={styles.bar}>
        <i />
        <i />
        <i />
      </div>
      <div className={styles.screen}>
        <div className={styles.image} />
        <div className={styles.side}>
          <b />
          <b />
          <b />
          <b />
          <b />
        </div>
      </div>
    </div>
  )
}
