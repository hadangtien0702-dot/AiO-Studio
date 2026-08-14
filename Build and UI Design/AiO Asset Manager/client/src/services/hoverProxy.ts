/**
 * hoverProxy.ts — [OPTIMIZE D1] "Sinh bản xem nhanh theo HÀNH VI, không chỉ
 * theo ngưỡng".
 *
 * `isHeavyVideo()` chỉ nhận file > 200 MB / 4K / ProRes. Một clip 1080p 150 MB
 * vẫn phát thẳng từ file gốc — xem một lần thì không sao, nhưng đúng những clip
 * người dùng xem đi xem lại mới là chỗ đáng có bản nhẹ.
 *
 * Cách làm: đếm số lần rê chuột trong PHIÊN này. Tới lần thứ 3 thì sinh bản
 * xem nhanh trong nền, dù file chưa "nặng" theo ngưỡng. Thư viện dùng thật sẽ
 * tự tối ưu theo thói quen của người dùng.
 *
 * Bộ đếm KHÔNG ghi xuống đĩa: nó chỉ là gợi ý, mất khi đóng panel cũng không
 * sao — còn `proxyPath` sinh ra thì được lưu vĩnh viễn như mọi proxy khác.
 */
import type { Asset } from '../types'
import { useLibrary } from '../state/store'
import { generateVideoProxy } from './proxy'

/** Rê bao nhiêu lần thì đáng làm bản nhẹ. */
const HOVER_THRESHOLD = 3
/**
 * Dưới ngưỡng này thì file gốc phát đã đủ mượt, làm proxy chỉ tốn máy.
 * 20 MB ~ vài giây 1080p, mức mà Chromium mở tức thì.
 */
const MIN_SIZE = 20 * 1024 * 1024

const hoverCount = new Map<string, number>()
/** Chỉ làm MỘT bản một lúc — đây là việc phụ, không được giành với hàng đợi. */
let working = false

/** Thẻ gọi mỗi lần người dùng rê chuột vào. */
export function noteHover(asset: Asset): void {
  if (asset.type !== 'video' || asset.proxyPath) return
  if (asset.fileSize > 0 && asset.fileSize < MIN_SIZE) return

  const n = (hoverCount.get(asset.id) ?? 0) + 1
  hoverCount.set(asset.id, n)
  // Đúng bằng ngưỡng (không phải >=) để chỉ kích hoạt MỘT lần cho mỗi asset.
  if (n === HOVER_THRESHOLD) void makeProxy(asset)
}

async function makeProxy(asset: Asset): Promise<void> {
  if (working) return
  working = true
  try {
    const proxyPath = await generateVideoProxy(
      asset.id,
      asset.path,
      asset.fileSize,
      asset.width,
      asset.height,
      asset.codec,
      true, // ép làm dù chưa đạt ngưỡng "nặng"
    )
    if (proxyPath) useLibrary.getState().updateAsset(asset.id, { proxyPath })
  } catch {
    /* file hỏng -> bỏ qua, lần sau không thử lại vì bộ đếm đã vượt ngưỡng */
  } finally {
    working = false
  }
}
