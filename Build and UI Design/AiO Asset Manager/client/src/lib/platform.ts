/**
 * platform.ts — nhận diện macOS và tìm công cụ ngoài (ffmpeg/ffprobe) trên Mac.
 *
 * [2026-09-30] Anh Tiến yêu cầu mọi panel chạy được trên Mac. Mọi nhánh Mac
 * đều là nhánh THÊM: `isMac()` trả false trên Windows nên đường Windows cũ
 * chạy y như trước, không đổi một dòng.
 *
 * Quy ước chung cả bộ AiO (8 panel dùng cùng một thứ tự):
 *   1. `<thư mục extension>/bin/mac/<tên>`
 *   2. `~/Library/Application Support/AiO-Studio/bin/mac/<tên>`   (kho chung)
 *   3. `/opt/homebrew/bin/<tên>`, rồi `/usr/local/bin/<tên>`
 * Trên Mac công cụ KHÔNG có đuôi `.exe`. PATH của Node trong CEP trên Mac
 * không có Homebrew — nên luôn trả đường dẫn TUYỆT ĐỐI, không dựa vào PATH.
 */
import { extensionPath } from './cep'
import { getFs, getOs, getPath, nodeRequire } from './node'

let memoMac: boolean | null = null

/**
 * Có đang chạy trên macOS không.
 *
 * Đọc `process.platform` LÚC CHẠY qua `cep_node` / `require('process')` —
 * không viết thẳng chữ `process.` cho bundler thấy (xem ghi chú `process.env`
 * ở `services/ffmpeg.ts`). Lùi về `os.platform()` (cùng giá trị).
 */
export function isMac(): boolean {
  if (memoMac !== null) return memoMac
  let plat = ''
  try {
    const w = window as any
    const p = w?.cep_node?.process
    if (p && p['platform']) plat = String(p['platform'])
  } catch {}
  if (!plat) {
    try {
      const req = nodeRequire()
      const pr = req ? req('process') : null
      if (pr && pr['platform']) plat = String(pr['platform'])
    } catch {}
  }
  if (!plat) {
    try {
      const os = getOs()
      if (os && typeof os.platform === 'function') plat = String(os.platform())
    } catch {}
  }
  // Chưa đọc được gì (panel mở ngoài CEP, chưa có Node) thì KHÔNG nhớ kết quả.
  if (!plat) return false
  memoMac = plat === 'darwin'
  return memoMac
}

/** `~/Library/Application Support` trên Mac. '' nếu không xác định được. */
export function macAppSupportDir(): string {
  try {
    const os = getOs()
    const path = getPath()
    const nha = os && typeof os.homedir === 'function' ? os.homedir() : ''
    return nha && path ? path.join(nha, 'Library', 'Application Support') : ''
  } catch {
    return ''
  }
}

/** Danh sách ứng viên theo đúng thứ tự quy ước ở đầu file. */
export function macToolCandidates(name: string): string[] {
  const path = getPath()
  if (!path) return []
  const out: string[] = []
  const extDir = extensionPath()
  if (extDir) out.push(path.join(extDir, 'bin', 'mac', name))
  const appSupport = macAppSupportDir()
  if (appSupport) out.push(path.join(appSupport, 'AiO-Studio', 'bin', 'mac', name))
  out.push('/opt/homebrew/bin/' + name)
  out.push('/usr/local/bin/' + name)
  return out
}

/** Ứng viên đầu tiên có thật trên đĩa, '' nếu không có. */
export function findMacTool(name: string): string {
  const fs = getFs()
  if (!fs) return ''
  for (const cand of macToolCandidates(name)) {
    try {
      if (fs.existsSync(cand)) return cand
    } catch {}
  }
  return ''
}
