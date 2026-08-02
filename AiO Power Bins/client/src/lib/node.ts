/**
 * node.ts — truy cập Node.js bên trong panel CEP.
 *
 * CEP bật Node qua manifest (--enable-nodejs --mixed-context). Khi đó module
 * Node lấy qua `window.cep_node.require` (an toàn với bundler Vite, vì Vite
 * không đụng tới thuộc tính này). Fallback sang global `require` nếu có.
 */

type NodeRequire = (id: string) => any

/** Lấy hàm require của Node (hoặc null nếu không chạy trong CEP). */
export function nodeRequire(): NodeRequire | null {
  const w = window as any
  if (w.cep_node && typeof w.cep_node.require === 'function') {
    return w.cep_node.require
  }
  if (typeof w.require === 'function') {
    return w.require as NodeRequire
  }
  return null
}

/** Có dùng được Node trong ngữ cảnh hiện tại không. */
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

/** module 'os' (hoặc null). */
export function getOs(): any {
  const r = nodeRequire()
  return r ? r('os') : null
}

/**
 * Đổi đường dẫn hệ thống -> URL file:// để dùng trong <img>/<video src>.
 * Xử lý cả Windows (backslash) và ký tự đặc biệt/unicode.
 */
export function toFileUrl(p: string): string {
  const normalized = p.replace(/\\/g, '/')
  // encodeURI giữ dấu '/' và ':' nhưng mã hoá space, unicode...
  return 'file:///' + encodeURI(normalized).replace(/^file:\/\/\//, '')
}
