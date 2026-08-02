/**
 * autoReload.ts — panel tự làm mới khi bản build mới được cài đè.
 *
 * Mục đích: bỏ hẳn việc phải đóng/mở panel (hay restart Premiere) sau mỗi lần
 * sửa code. Panel theo dõi mtime của chính file index.html đã cài; khi script
 * build+ký ghi đè file, mtime đổi -> panel tự location.reload().
 *
 * Dùng polling thay fs.watch vì lúc cài đè, thư mục bị xoá rồi tạo lại
 * (fs.watch sẽ chết theo, polling thì không).
 */
import { nodeRequire } from '../lib/node'
import { extensionPath } from '../lib/cep'

let timer: any = null

/** Bắt đầu theo dõi. Trả về true nếu bật được. */
export function startAutoReload(intervalMs = 1500): boolean {
  if (timer) return true

  const req = nodeRequire()
  if (!req) return false

  let fs: any
  let path: any
  try {
    fs = req('fs')
    path = req('path')
  } catch {
    return false
  }

  const root = extensionPath()
  if (!root) return false

  const target = path.join(root, 'dist', 'index.html')

  let last = 0
  try {
    last = fs.statSync(target).mtimeMs
  } catch {
    return false
  }

  timer = setInterval(() => {
    try {
      const m = fs.statSync(target).mtimeMs
      if (m !== last) {
        last = m
        window.location.reload()
      }
    } catch {
      // File đang bị thay thế giữa chừng -> bỏ qua nhịp này.
    }
  }, intervalMs)

  return true
}

/** Dừng theo dõi. */
export function stopAutoReload(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
