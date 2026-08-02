/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** '1' khi build bang `npm run build:release`. */
  readonly VITE_RELEASE?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Version nhung luc build tu package.json — xem `define` trong vite.config.ts. */
declare const __VERSION__: string
