import { getFs, getPath } from '../lib/node'
import { cacheDirs } from './cachePaths'
import type { Asset } from '../types'

export interface CacheInfo {
  totalBytes: number
  fileCount: number
  formattedSize: string
}

/**
 * Bộ nhớ đệm tách làm HAI phần khác hẳn nhau về hậu quả:
 *  - RÁC: file không asset nào còn trỏ tới (thư viện đã đổi, file gốc đã xoá).
 *    Xoá phần này KHÔNG mất gì cả — không phải render lại thứ gì.
 *  - ĐANG DÙNG: ảnh/sóng âm/bản xem nhanh mà lưới đang hiển thị. Xoá phần này
 *    là phải render lại từ đầu — với 15.000 asset là hàng giờ đồng hồ.
 * Gộp hai thứ này vào một nút "Xoá bộ nhớ đệm" chính là lỗi đã gây ra cả lưới
 * ảnh vỡ. Panel phải NÓI RÕ cái nào nên xoá.
 */
export interface CacheBreakdown extends CacheInfo {
  /** File cache không còn asset nào trỏ tới. */
  orphanBytes: number
  orphanCount: number
  formattedOrphan: string
  /** Số asset đang dựa vào cache (mất là phải render lại). */
  usedThumbs: number
  usedWaveforms: number
  usedProxies: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

export function getCacheInfo(): CacheInfo {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path) {
    return { totalBytes: 0, fileCount: 0, formattedSize: '0 MB' }
  }

  const dirs = cacheDirs()

  let totalBytes = 0
  let fileCount = 0

  for (const dir of dirs) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
        for (const file of files) {
          const fp = path.join(dir, file)
          try {
            const stat = fs.statSync(fp)
            if (stat.isFile()) {
              totalBytes += stat.size
              fileCount++
            }
          } catch {}
        }
      }
    } catch {}
  }

  return {
    totalBytes,
    fileCount,
    formattedSize: formatBytes(totalBytes),
  }
}

/** Tên file (chữ thường) của một đường dẫn. '' nếu rỗng. */
function baseName(p?: string): string {
  if (!p) return ''
  const low = p.toLowerCase()
  const i = Math.max(low.lastIndexOf('\\'), low.lastIndexOf('/'))
  return i >= 0 ? low.slice(i + 1) : low
}

/** Tập tên file mà thư viện ĐANG trỏ tới (không được xoá nếu không muốn render lại). */
function referencedNames(assets: Asset[]): Set<string> {
  const set = new Set<string>()
  for (const a of assets) {
    const n1 = baseName(a.thumbPath)
    const n2 = baseName(a.waveformPath)
    const n3 = baseName(a.proxyPath)
    const n4 = baseName(a.previewPath)
    if (n1) set.add(n1)
    if (n2) set.add(n2)
    if (n3) set.add(n3)
    if (n4) set.add(n4)
  }
  return set
}

/**
 * Soi bộ nhớ đệm và tách rõ phần RÁC với phần ĐANG DÙNG, để hộp Cài đặt nói
 * được "nên xoá cái nào" thay vì chỉ đưa ra một nút xoá sạch.
 */
export function analyzeCache(assets: Asset[]): CacheBreakdown {
  const empty: CacheBreakdown = {
    totalBytes: 0,
    fileCount: 0,
    formattedSize: '0 MB',
    orphanBytes: 0,
    orphanCount: 0,
    formattedOrphan: '0 MB',
    usedThumbs: 0,
    usedWaveforms: 0,
    usedProxies: 0,
  }

  const fs = getFs()
  const path = getPath()
  const dirs = cacheDirs()
  if (!fs || !path || dirs.length === 0) return empty

  const referenced = referencedNames(assets)
  let totalBytes = 0
  let fileCount = 0
  let orphanBytes = 0
  let orphanCount = 0

  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) continue
      for (const file of fs.readdirSync(dir) as string[]) {
        try {
          const st = fs.statSync(path.join(dir, file))
          if (!st.isFile()) continue
          totalBytes += st.size
          fileCount++
          if (!referenced.has(file.toLowerCase())) {
            orphanBytes += st.size
            orphanCount++
          }
        } catch {}
      }
    } catch {}
  }

  let usedThumbs = 0
  let usedWaveforms = 0
  let usedProxies = 0
  for (const a of assets) {
    if (a.thumbPath) usedThumbs++
    if (a.waveformPath) usedWaveforms++
    if (a.proxyPath) usedProxies++
  }

  return {
    totalBytes,
    fileCount,
    formattedSize: formatBytes(totalBytes),
    orphanBytes,
    orphanCount,
    formattedOrphan: formatBytes(orphanBytes),
    usedThumbs,
    usedWaveforms,
    usedProxies,
  }
}

/**
 * Chỉ xoá RÁC — file cache không asset nào còn dùng.
 * An toàn tuyệt đối: không thẻ nào mất ảnh, không phải render lại gì.
 */
export function clearOrphanCache(assets: Asset[]): { freedBytes: number; count: number } {
  const fs = getFs()
  const path = getPath()
  const dirs = cacheDirs()
  if (!fs || !path || dirs.length === 0) return { freedBytes: 0, count: 0 }

  const referenced = referencedNames(assets)
  let freedBytes = 0
  let count = 0

  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) continue
      for (const file of fs.readdirSync(dir) as string[]) {
        if (referenced.has(file.toLowerCase())) continue
        const fp = path.join(dir, file)
        try {
          const st = fs.statSync(fp)
          if (!st.isFile()) continue
          fs.unlinkSync(fp)
          freedBytes += st.size
          count++
        } catch {}
      }
    } catch {}
  }

  return { freedBytes, count }
}

export function clearCache(): CacheInfo {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path) {
    return { totalBytes: 0, fileCount: 0, formattedSize: '0 MB' }
  }

  const dirs = cacheDirs()

  for (const dir of dirs) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
        for (const file of files) {
          const fp = path.join(dir, file)
          try {
            fs.unlinkSync(fp)
          } catch {}
        }
      }
    } catch {}
  }

  return getCacheInfo()
}
