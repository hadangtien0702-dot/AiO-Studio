/// <reference types="vite/client" />

/** Biến môi trường riêng của dự án. */
interface ImportMetaEnv {
  /** '1' khi build bằng `npm run build:release` — bản phát hành, tắt auto-reload. */
  readonly VITE_RELEASE?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Video demo cho chế độ dev (mockData) — Vite trả về URL của file.
declare module '*.mp4' {
  const url: string
  export default url
}

/** Version nhung luc build tu package.json — xem `define` trong vite.config.ts. */
declare const __VERSION__: string
