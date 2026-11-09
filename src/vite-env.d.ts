/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Адрес Cloudflare Worker формы «Написать мне»; пусто — формы нет */
  readonly VITE_CONTACT_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
