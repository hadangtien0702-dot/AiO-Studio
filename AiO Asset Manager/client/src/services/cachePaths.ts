/**
 * cachePaths.ts — MỘT nơi duy nhất quyết định bộ nhớ đệm nằm ở đâu.
 *
 * Vì sao cần đổi được: mặc định cache nằm ở `%APPDATA%\AiOStudio` — tức ổ C.
 * Thư viện 15.000+ asset sinh ra hàng GB ảnh xem trước và proxy, mà ổ C của máy
 * dựng phim thường là SSD nhỏ và hay đầy. Người dùng phải được chuyển nó sang ổ
 * chứa dữ liệu.
 *
 * Trước đây mỗi service tự ghép đường dẫn (`thumbnailer`, `proxy`, `mogrtThumb`,
 * `cacheService`, `cacheAudit`) — năm bản sao của cùng một quy tắc. Giờ tất cả
 * hỏi file này.
 */
import { userDataPath } from '../lib/cep'
import { getFs, getPath } from '../lib/node'

/** Khoá lưu lựa chọn của người dùng. localStorage của panel sống qua mọi lần mở. */
const STORAGE_KEY = 'aio.cacheRoot'

let memoRoot: string | null = null
let memoThumbs: string | null = null
let memoProxies: string | null = null

/** Đường dẫn mặc định: `<userData>/AiOStudio`. '' nếu chưa xác định được. */
export function defaultCacheRoot(): string {
  const path = getPath()
  if (!path) return ''
  const base =
    userDataPath() || (typeof process !== 'undefined' ? process.env.APPDATA || '' : '')
  return base ? path.join(base, 'AiOStudio') : ''
}

/** Người dùng đã tự chọn chỗ khác chưa. */
export function customCacheRoot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

/** Thư mục gốc của bộ nhớ đệm đang dùng. */
export function getCacheRoot(): string {
  if (memoRoot) return memoRoot
  memoRoot = customCacheRoot() || defaultCacheRoot()
  return memoRoot
}

/**
 * Đổi chỗ lưu. CHỈ ghi lựa chọn — việc chuyển file và sửa đường dẫn trong thư
 * viện do `cacheMove.ts` lo, vì đó là thao tác có rủi ro phải làm theo thứ tự.
 */
export function setCacheRoot(dir: string): void {
  try {
    if (dir) localStorage.setItem(STORAGE_KEY, dir)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* không lưu được thì phiên này vẫn dùng được, mở lại panel sẽ về mặc định */
  }
  memoRoot = null
  memoThumbs = null
  memoProxies = null
}

/** Tạo thư mục nếu chưa có. Trả về '' nếu không tạo được. */
function ensureDir(dir: string): string {
  const fs = getFs()
  if (!fs || !dir) return ''
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  } catch {
    return ''
  }
  return dir
}

/** `<cacheRoot>/thumbs` — ảnh xem trước, sóng âm, preview bung từ gói .mogrt. */
export function cacheThumbsDir(): string {
  if (memoThumbs) return memoThumbs
  const path = getPath()
  const root = getCacheRoot()
  if (!path || !root) return ''
  memoThumbs = ensureDir(path.join(root, 'thumbs')) || null
  return memoThumbs || ''
}

/** `<cacheRoot>/proxies` — bản xem nhanh 360p của video nặng. */
export function cacheProxiesDir(): string {
  if (memoProxies) return memoProxies
  const path = getPath()
  const root = getCacheRoot()
  if (!path || !root) return ''
  memoProxies = ensureDir(path.join(root, 'proxies')) || null
  return memoProxies || ''
}

/** Cả hai thư mục cache, dùng cho việc đo dung lượng / dọn dẹp. */
export function cacheDirs(): string[] {
  const t = cacheThumbsDir()
  const p = cacheProxiesDir()
  return [t, p].filter(Boolean)
}
