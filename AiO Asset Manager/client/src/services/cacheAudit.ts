/**
 * cacheAudit.ts — dọn ĐƯỜNG DẪN TREO trong thư viện.
 *
 * Vì sao cần: `library.json` nhớ đường dẫn ảnh xem trước (thumbPath), sóng âm
 * (waveformPath), proxy (proxyPath) và preview bung từ gói .mogrt (previewPath).
 * Nếu các file đó biến mất khỏi đĩa — người dùng bấm "Xoá bộ nhớ đệm" ở bản cũ,
 * tự tay xoá thư mục cache, hay ổ đĩa dọn dẹp — thì:
 *
 *   1. Thẻ vẫn cố tải ảnh không còn tồn tại  -> hiện biểu tượng ẢNH VỠ.
 *   2. Hàng đợi nền thấy `thumbPath` CÓ GIÁ TRỊ nên tưởng "đã xong rồi"
 *      -> KHÔNG BAO GIỜ sinh lại. Bấm "Tạo ảnh xem trước" cũng vô ích vì
 *      nút đó cũng chỉ đếm asset THIẾU thumbPath.
 *
 * Cách làm rẻ: đọc DANH SÁCH TÊN FILE của thư mục cache đúng MỘT lần
 * (`readdirSync`), rồi tra bằng Set. 15.000 asset chỉ tốn 2 lần đọc thư mục,
 * không phải 15.000 lần `existsSync`.
 */
import { getFs, getPath } from '../lib/node'
import { cacheProxiesDir, cacheThumbsDir } from './cachePaths'
import type { Asset } from '../types'

export interface PruneResult {
  assets: Asset[]
  /** Số đường dẫn treo đã gỡ (không phải số asset). */
  removed: number
}

/** Tên file trong một thư mục, dạng Set chữ thường. '' nếu đọc không được. */
function listNames(dir: string): Set<string> | null {
  const fs = getFs()
  if (!fs || !dir) return null
  try {
    if (!fs.existsSync(dir)) return new Set()
    const names = fs.readdirSync(dir) as string[]
    return new Set(names.map((n) => n.toLowerCase()))
  } catch {
    return null
  }
}

/**
 * Gỡ mọi đường dẫn cache trỏ tới file KHÔNG CÒN trên đĩa.
 * Chỉ đụng tới file NẰM TRONG thư mục cache của panel — file gốc của người dùng
 * không bao giờ bị xét ở đây (họ có thể cắm/rút ổ ngoài, không phải là lỗi).
 */
export function pruneMissingCachePaths(assets: Asset[]): PruneResult {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path || assets.length === 0) return { assets, removed: 0 }

  const thumbsDir = cacheThumbsDir()
  const proxiesDir = cacheProxiesDir()
  if (!thumbsDir || !proxiesDir) return { assets, removed: 0 }

  const thumbList = listNames(thumbsDir)
  const proxyList = listNames(proxiesDir)
  // Đọc thư mục lỗi -> KHÔNG kết luận gì, giữ nguyên dữ liệu.
  if (!thumbList || !proxyList) return { assets, removed: 0 }
  const thumbNames: Set<string> = thumbList
  const proxyNames: Set<string> = proxyList

  const thumbsPrefix = thumbsDir.toLowerCase()
  const proxiesPrefix = proxiesDir.toLowerCase()

  function basename(low: string): string {
    const i = Math.max(low.lastIndexOf('\\'), low.lastIndexOf('/'))
    return i >= 0 ? low.slice(i + 1) : low
  }

  /** true = đường dẫn này nằm trong cache và file đã biến mất. */
  function isDead(p: string | undefined): boolean {
    if (!p) return false
    const low = p.toLowerCase()
    if (low.startsWith(thumbsPrefix)) return !thumbNames.has(basename(low))
    if (low.startsWith(proxiesPrefix)) return !proxyNames.has(basename(low))
    return false // file gốc của người dùng -> không xét
  }

  let removed = 0
  const next = assets.map((a) => {
    const deadThumb = isDead(a.thumbPath)
    const deadWave = isDead(a.waveformPath)
    const deadProxy = isDead(a.proxyPath)
    const deadPreview = isDead(a.previewPath)
    if (!deadThumb && !deadWave && !deadProxy && !deadPreview) return a

    const copy: Asset = { ...a }
    if (deadThumb) {
      delete copy.thumbPath
      removed++
    }
    if (deadWave) {
      delete copy.waveformPath
      removed++
    }
    if (deadProxy) {
      delete copy.proxyPath
      removed++
    }
    if (deadPreview) {
      // Preview bung từ trong gói .mogrt: gỡ luôn cả `previewKind` để hàng đợi
      // nhận ra là "chưa có preview" và bung lại từ đầu.
      delete copy.previewPath
      delete copy.previewKind
      removed++
    }
    return copy
  })

  return { assets: removed > 0 ? next : assets, removed }
}
