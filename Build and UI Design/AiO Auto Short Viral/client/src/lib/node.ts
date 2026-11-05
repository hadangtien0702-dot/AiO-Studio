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

/**
 * [Mac 30/09/2026] Panel đang chạy trên macOS?
 *
 * Đọc `platform` của Node lúc chạy qua `cep_node.process` (cùng cách `bienMT`
 * dưới đây — không viết chữ `process.` cho bundler thấy). Không có Node (chế độ
 * thử trên trình duyệt) thì mới hỏi `navigator.platform`, chỉ để chọn chữ phím
 * tắt Cmd/Ctrl cho đúng máy. Windows luôn trả false → mọi nhánh Windows y như cũ.
 */
export function laMac(): boolean {
  const w = window as any
  try {
    const pr = w.cep_node && w.cep_node.process
    if (pr && pr['platform']) return String(pr['platform']) === 'darwin'
  } catch {}
  try {
    const r = nodeRequire()
    const pr = r ? r('process') : null
    if (pr && pr['platform']) return String(pr['platform']) === 'darwin'
  } catch {}
  try {
    return /^Mac/i.test(String(navigator.platform || ''))
  } catch {}
  return false
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
