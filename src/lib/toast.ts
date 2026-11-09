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
