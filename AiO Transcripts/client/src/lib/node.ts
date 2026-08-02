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
