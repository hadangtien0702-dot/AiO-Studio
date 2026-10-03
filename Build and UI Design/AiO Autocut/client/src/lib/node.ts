/**
 * node.ts — truy cập Node.js bên trong panel CEP.
 *
 * CEP bật Node qua manifest (`--enable-nodejs --mixed-context`). Khi đó module
 * Node lấy qua `window.cep_node.require` — dùng thuộc tính này thay vì `require`
 * trần vì Vite sẽ không đụng tới nó lúc đóng gói.
 *
 * Chép nguyên cách làm của AiO Editing (đã chạy thật từ 1.0.0).
 */

type NodeRequire = (id: string) => any

/** Hàm require của Node, hoặc null nếu không chạy trong CEP. */
export function nodeRequire(): NodeRequire | null {
  const w = window as any
  if (w.cep_node && typeof w.cep_node.require === 'function') return w.cep_node.require
  if (typeof w.require === 'function') return w.require as NodeRequire
  return null
}

/** Có dùng được Node ở ngữ cảnh hiện tại không. */
export function nodeAvailable(): boolean {
  return nodeRequire() !== null
}

/** module 'fs' (hoặc null). */
export function getFs(): any {
  const r = nodeRequire()
  return r ? r('fs') : null
}

/** module 'path' (hoặc null). */
export function getPath(): any {
  const r = nodeRequire()
  return r ? r('path') : null
}

let _laMac: boolean | null = null

/**
 * Đang chạy trên macOS không (`process.platform === 'darwin'`).
 *
 * Đọc `process` của Node LÚC CHẠY qua `window.cep_node` (hoặc module
 * 'process'), không viết chữ `process.` trần cho bundler thấy — cùng lý do với
 * `bienMT()` trong `services/ffmpeg.ts`. Không đọc được thì hỏi `os.platform()`.
 * Mọi đường đều hỏng thì coi là KHÔNG phải Mac, tức đi đúng nhánh Windows cũ.
 */
export function laMac(): boolean {
  if (_laMac !== null) return _laMac
  let pf = ''
  const w = window as any
  const req = nodeRequire()
  try {
    const p = w?.cep_node?.process
    if (p && typeof p['platform'] === 'string') pf = p['platform']
  } catch {
    /* thử đường sau */
  }
  if (!pf) {
    try {
      const p = req ? req('process') : null
      if (p && typeof p['platform'] === 'string') pf = p['platform']
    } catch {
      /* thử đường sau */
    }
  }
  if (!pf) {
    try {
      const os = req ? req('os') : null
      if (os && typeof os.platform === 'function') pf = String(os.platform())
    } catch {
      /* chịu — coi như Windows */
    }
  }
  // Chỉ nhớ khi đã đọc được — chạy ngoài CEP (trình duyệt) thì lần sau hỏi lại.
  if (pf) _laMac = pf === 'darwin'
  return pf === 'darwin'
}
