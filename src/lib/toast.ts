// Простые всплывающие уведомления: любой код вызывает toast('…'), компонент Toaster показывает.
type Listener = (message: string) => void
const listeners = new Set<Listener>()

export function toast(message: string) {
  for (const l of listeners) l(message)
}

export function onToast(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Копирует текст; true — получилось */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Нажатие на «Написать на почту»: адрес сразу копируется и показывается в уведомлении.
 * На телефоне без настроенного почтового приложения (или во встроенном браузере Telegram/Instagram)
 * ссылка mailto: ничего не открывает — так посетитель всё равно получит адрес.
 */
export function copyEmail(email: string, message: (email: string) => string) {
  void copyText(email).then((ok) => toast(ok ? message(email) : email))
}
