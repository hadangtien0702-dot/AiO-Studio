/**
 * node.ts — truy cập Node.js bên trong panel CEP.
 *
 * CEP bật Node qua manifest (`--enable-nodejs --mixed-context`). Module Node
 * lấy qua `window.cep_node.require` — dùng thuộc tính này thay vì `require`
 * trần vì Vite sẽ không đụng tới nó lúc đóng gói.
 *
 * ☠️ Biến môi trường (%APPDATA%…) KHÔNG đọc bằng `process.env.X` — Vite thay
 * `process.env` bằng `{}` lúc build, nhánh đó chết im lặng (bài 5ak brain).
 * Dùng `bienMT()` ở dưới: truy cập ĐỘNG qua `cep_node.process`.
 */

type NodeRequire = (id: string) => any

export function nodeRequire(): NodeRequire | null {
  const w = window as any
  if (w.cep_node && typeof w.cep_node.require === 'function') return w.cep_node.require
  if (typeof w.require === 'function') return w.require as NodeRequire
  return null
}

export function nodeAvailable(): boolean {
  return nodeRequire() !== null
}

export function getFs(): any {
  const r = nodeRequire()
  return r ? r('fs') : null
}

export function getPath(): any {
  const r = nodeRequire()
  return r ? r('path') : null
}

export function getChildProcess(): any {
  const r = nodeRequire()
  return r ? r('child_process') : null
}

/** Biến môi trường, đọc ĐỘNG lúc chạy (không qua bundler). */
export function bienMT(ten: string): string {
  const w = window as any
  try {
    const pr = w.cep_node && w.cep_node.process
    if (pr && pr.env && pr.env[ten]) return String(pr.env[ten])
  } catch {}
  try {
    const r = nodeRequire()
    const pr = r ? r('process') : null
    if (pr && pr['env'] && pr['env'][ten]) return String(pr['env'][ten])
  } catch {}
  return ''
}
