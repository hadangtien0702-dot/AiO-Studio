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

/**
 * Panel đang chạy trên macOS không. Windows (và mọi trường hợp không có Node)
 * trả false — nên mọi nhánh Windows cũ giữ nguyên như trước.
 *
 * Hỏi qua `os.platform()` lúc chạy (= `process.platform` của Node), không viết
 * thẳng chữ `process` ra cho Vite thấy — cùng lý do với `bienMT()` ở ffmpeg.ts.
 */
export function laMac(): boolean {
  try {
    const r = nodeRequire()
    return !!r && r('os').platform() === 'darwin'
  } catch {
    return false
  }
}

/**
 * Thư mục dữ liệu ứng dụng trên macOS: `~/Library/Application Support`
 * (tương đương `%APPDATA%` của Windows). '' nếu không lấy được.
 */
export function thuMucAppSupportMac(): string {
  try {
    const r = nodeRequire()
    if (!r) return ''
    const nha = r('os').homedir()
    return nha ? r('path').join(nha, 'Library', 'Application Support') : ''
  } catch {
    return ''
  }
}

/**
 * Tìm một công cụ dòng lệnh trên macOS (KHÔNG có đuôi `.exe`). Dò theo thứ tự,
 * file nào có trước thì lấy:
 *   1. `<thư mục extension>/bin/mac/<ten>`
 *   2. `~/Library/Application Support/AiO-Studio/bin/mac/<ten>` (kho chung cả bộ)
 *   3. `/opt/homebrew/bin/<ten>` rồi `/usr/local/bin/<ten>`
 *
 * ☠️ Node của CEP trên Mac KHÔNG có Homebrew trong PATH — luôn trả đường dẫn
 * TUYỆT ĐỐI, đừng dựa vào PATH. Trả '' nếu không thấy.
 */
export function timCongCuMac(ten: string, extDir: string): string {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path) return ''
  const ungVien: string[] = []
  if (extDir) ungVien.push(path.join(extDir, 'bin', 'mac', ten))
  const appSup = thuMucAppSupportMac()
  if (appSup) ungVien.push(path.join(appSup, 'AiO-Studio', 'bin', 'mac', ten))
  ungVien.push(path.join('/opt/homebrew/bin', ten), path.join('/usr/local/bin', ten))
  for (const c of ungVien) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        conQuyenChay(c)
        return c
      }
    } catch {
      /* thử ứng viên tiếp theo */
    }
  }
  return ''
}

/**
 * Bảo đảm file có bit chạy (x). Giải nén zip hay chép qua ổ khác trên Mac có
 * thể làm rơi bit này, và `execFile` sẽ báo EACCES. Thiếu thì thử `chmod 755`;
 * không được thì thôi — lỗi thật sẽ hiện ra lúc chạy.
 */
export function conQuyenChay(file: string): void {
  const fs = getFs()
  if (!fs) return
  try {
    fs.accessSync(file, fs.constants.X_OK)
  } catch {
    try {
      fs.chmodSync(file, 0o755)
    } catch {
      /* không có quyền đổi — để lúc chạy báo lỗi */
    }
  }
}
