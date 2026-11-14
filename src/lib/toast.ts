type Listener = (message: string) => void
const listeners = new Set<Listener>()

export function toast(message: string) {
  for (const l of listeners) l(message)
}

export function onToast(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function copyEmail(email: string, message: (email: string) => string) {
  void copyText(email).then((ok) => toast(ok ? message(email) : email))
}
