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

// ── macOS ─────────────────────────────────────────────────────────────────
// Panel viết cho Windows; Mac đi NHÁNH RIÊNG ở từng chỗ, nhánh Windows giữ nguyên.

let _laMac: boolean | null = null

/**
 * Đang chạy trên macOS không (`process.platform === 'darwin'`). Đọc `process`
 * LÚC CHẠY qua `cep_node` (cùng lý do với bienMT: không để bundler thấy chữ
 * `process.`), rồi tới `os.platform()`. Không đọc được → coi là Windows (đường cũ).
 */
export function laMac(): boolean {
  if (_laMac !== null) return _laMac
  let pf = ''
  const w = window as any
  const r = nodeRequire()
  try {
    const pr = w.cep_node && w.cep_node.process
    if (pr && typeof pr['platform'] === 'string') pf = pr['platform']
  } catch {}
  if (!pf) {
    try {
      const pr = r ? r('process') : null
      if (pr && typeof pr['platform'] === 'string') pf = pr['platform']
    } catch {}
  }
  if (!pf) {
    try {
      const os = r ? r('os') : null
      if (os && typeof os.platform === 'function') pf = String(os.platform())
    } catch {}
  }
  if (pf) _laMac = pf === 'darwin'
  return pf === 'darwin'
}

/** Thư mục nhà (`os.homedir()`), '' nếu không có Node. */
export function thuMucNha(): string {
  try {
    const r = nodeRequire()
    const os = r ? r('os') : null
    return os && typeof os.homedir === 'function' ? String(os.homedir() || '') : ''
  } catch {
    return ''
  }
}

/**
 * Thư mục CÀI ĐẶT / dữ liệu chung của bộ AiO (nơi có ngonngu.json):
 * - Windows: `%APPDATA%\AiOStudio` (như cũ);
 * - Mac: `~/Library/Application Support/AiOStudio` (cùng chỗ ngonngu.json trên Mac).
 * '' nếu không xác định được.
 */
export function thuMucAiO(): string {
  const r = nodeRequire()
  const path = r ? r('path') : null
  if (!path) return ''
  if (laMac()) {
    const nha = thuMucNha()
    return nha ? path.join(nha, 'Library', 'Application Support', 'AiOStudio') : ''
  }
  const appData = bienMT('APPDATA')
  return appData ? path.join(appData, 'AiOStudio') : ''
}

/**
 * Mac: KHO CÔNG CỤ chung cả bộ `~/Library/Application Support/AiO-Studio`
 * (có `bin/mac/` với ffmpeg, ffprobe, yt-dlp, qjs). Khác thư mục cài đặt ở trên
 * (có gạch nối) — theo quy ước chung 8 panel. Windows: ''.
 */
export function thuMucKhoMac(): string {
  if (!laMac()) return ''
  const r = nodeRequire()
  const path = r ? r('path') : null
  const nha = thuMucNha()
  return path && nha ? path.join(nha, 'Library', 'Application Support', 'AiO-Studio') : ''
}
