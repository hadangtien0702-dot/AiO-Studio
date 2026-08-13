/**
 * cacheMove.ts — chuyển bộ nhớ đệm sang thư mục khác.
 *
 * Vì sao phải CHUYỂN chứ không chỉ đổi đường dẫn: `library.json` nhớ đường dẫn
 * TUYỆT ĐỐI của từng ảnh xem trước. Đổi chỗ mà bỏ file lại ổ cũ thì hoặc là
 * người dùng có hai bản cache nằm hai nơi, hoặc (khi họ dọn ổ C) toàn bộ ảnh
 * chết và panel phải render lại 15.000 asset.
 *
 * Thứ tự ở đây quan trọng, làm sai là mất ảnh:
 *   1. chuyển file sang chỗ mới
 *   2. sửa đường dẫn trong thư viện
 *   3. ghi lựa chọn chỗ mới
 *   4. dọn thư mục cũ (chỉ khi đã rỗng)
 * Bước nào lỗi thì dừng và trả về số liệu thật, không báo "xong" khống.
 */
import { getFs, getPath } from '../lib/node'
import type { Asset } from '../types'
import { getCacheRoot, setCacheRoot } from './cachePaths'
import { dich } from '../ngonngu'

export interface MoveResult {
  ok: boolean
  moved: number
  failed: number
  /** Số đường dẫn trong thư viện đã được sửa sang chỗ mới. */
  repathed: number
  message: string
}

/** Chuyển một file, ưu tiên rename (cùng ổ = tức thì) rồi mới tới copy. */
function moveFile(fs: any, from: string, to: string): boolean {
  try {
    fs.renameSync(from, to)
    return true
  } catch {
    // Khác ổ đĩa -> rename không dùng được, phải chép rồi xoá.
    try {
      fs.copyFileSync(from, to)
      try {
        fs.unlinkSync(from)
      } catch {
        /* chép được là đủ; file thừa ở ổ cũ không gây sai */
      }
      return true
    } catch {
      return false
    }
  }
}

/**
 * Chuyển toàn bộ cache sang `newRoot` và sửa đường dẫn trong danh sách asset.
 * Trả về danh sách asset ĐÃ SỬA để bên gọi ghi xuống đĩa.
 */
export function moveCacheTo(
  newRoot: string,
  assets: Asset[],
): { result: MoveResult; assets: Asset[] } {
  const fs = getFs()
  const path = getPath()
  const oldRoot = getCacheRoot()

  const fail = (message: string): { result: MoveResult; assets: Asset[] } => ({
    result: { ok: false, moved: 0, failed: 0, repathed: 0, message },
    assets,
  })

  if (!fs || !path) return fail(dich('Không truy cập được hệ thống file.'))
  if (!newRoot) return fail(dich('Chưa chọn thư mục.'))
  if (!oldRoot) return fail(dich('Không xác định được chỗ lưu hiện tại.'))

  const sameRoot = newRoot.replace(/[\\/]+$/, '').toLowerCase() ===
    oldRoot.replace(/[\\/]+$/, '').toLowerCase()
  if (sameRoot) return fail(dich('Đang lưu ở đúng thư mục này rồi.'))

  // Không cho chọn thư mục NẰM TRONG cache cũ (sẽ tự chuyển vào chính mình).
  if (newRoot.toLowerCase().startsWith(oldRoot.toLowerCase() + path.sep)) {
    return fail(dich('Không chọn được thư mục nằm bên trong chỗ lưu hiện tại.'))
  }

  let moved = 0
  let failed = 0

  for (const sub of ['thumbs', 'proxies']) {
    const fromDir = path.join(oldRoot, sub)
    const toDir = path.join(newRoot, sub)
    try {
      if (!fs.existsSync(fromDir)) continue
      fs.mkdirSync(toDir, { recursive: true })
      for (const name of fs.readdirSync(fromDir) as string[]) {
        const from = path.join(fromDir, name)
        try {
          if (!fs.statSync(from).isFile()) continue
        } catch {
          continue
        }
        if (moveFile(fs, from, path.join(toDir, name))) moved++
        else failed++
      }
    } catch {
      return fail(dich('Không ghi được vào thư mục mới. Kiểm tra lại quyền ghi của ổ đĩa.'))
    }
  }

  // Sửa đường dẫn trong thư viện: chỉ đổi phần GỐC, giữ nguyên phần còn lại.
  const oldPrefix = oldRoot.toLowerCase()
  let repathed = 0
  const repath = (p?: string): string | undefined => {
    if (!p) return p
    if (!p.toLowerCase().startsWith(oldPrefix)) return p
    repathed++
    return newRoot + p.slice(oldRoot.length)
  }

  const nextAssets = assets.map((a) => {
    const thumbPath = repath(a.thumbPath)
    const waveformPath = repath(a.waveformPath)
    const proxyPath = repath(a.proxyPath)
    const previewPath = repath(a.previewPath)
    if (
      thumbPath === a.thumbPath &&
      waveformPath === a.waveformPath &&
      proxyPath === a.proxyPath &&
      previewPath === a.previewPath
    ) {
      return a
    }
    return { ...a, thumbPath, waveformPath, proxyPath, previewPath }
  })

  setCacheRoot(newRoot)

  // Dọn thư mục cũ — chỉ xoá khi đã rỗng, tuyệt đối không xoá đệ quy.
  for (const sub of ['thumbs', 'proxies']) {
    try {
      const dir = path.join(oldRoot, sub)
      if (fs.existsSync(dir) && (fs.readdirSync(dir) as string[]).length === 0) {
        fs.rmdirSync(dir)
      }
    } catch {
      /* còn file lạ thì cứ để đó, không phải việc của panel */
    }
  }

  return {
    result: {
      ok: true,
      moved,
      failed,
      repathed,
      message:
        failed > 0
          ? `Đã chuyển ${moved.toLocaleString()} file, ${failed.toLocaleString()} file không chuyển được (đang mở?).`
          : `Đã chuyển ${moved.toLocaleString()} file sang chỗ mới.`,
    },
    assets: nextAssets,
  }
}
