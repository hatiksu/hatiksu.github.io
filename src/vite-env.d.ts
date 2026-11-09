/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Адрес FormSubmit для формы «Написать мне» (по умолчанию — на почту из контактов) */
  readonly VITE_CONTACT_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
