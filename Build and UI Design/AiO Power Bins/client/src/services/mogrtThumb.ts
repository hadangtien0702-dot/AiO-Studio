/**
 * mogrtThumb.ts — bung ảnh/video preview nhúng bên trong file .mogrt.
 *
 * File .mogrt thực chất là một gói ZIP, bên trong Adobe đóng sẵn:
 *   definition.json · project.aegraphic · thumb.png   <-- ảnh preview
 *
 * Nhiều pack (vd Text Animation Toolkit) KHÔNG kèm file preview rời, nên đây là
 * cách duy nhất để có thumbnail mà không cần render.
 *
 * [0.10.0] Đổi sang BẤT ĐỒNG BỘ + ĐỌC MỘT PHẦN (services/zipRead.ts):
 * bản cũ readFileSync cả gói 5–60 MB trên luồng giao diện — nguồn giật số 1
 * với thư viện mogrt. Nay chỉ đọc đuôi file + mục lục + đúng entry cần
 * (~vài trăm KB), qua fs.promises nên không chặn UI.
 *
 * Ảnh bung ra được cache tại <userData>/AiOPowerBins/thumbs/<id>.<ext> nên
 * lần sau mở panel là có ngay.
 */
import { nodeRequire, getFs, getPath } from '../lib/node'
import { cacheThumbsDir } from './cachePaths'
import { listZipEntries, readZipEntry } from './zipRead'

export interface MogrtThumbResult {
  path: string
  kind: 'video' | 'image'
}

/** Tên file ưu tiên tìm bên trong gói .mogrt. */
const PREFERRED_VIDEO = ['preview.mp4', 'preview.webm', 'video.mp4', 'preview.mov']
const PREFERRED_IMAGE = ['thumb.png', 'thumbnail.png', 'preview.png', 'thumb.jpg', 'thumbnail.jpg']
const VIDEO_RE = /\.(mp4|webm|mov)$/i
const IMAGE_RE = /\.(png|jpg|jpeg|gif|webp)$/i
const CACHE_EXTS = ['mp4', 'webm', 'mov', 'png', 'jpg', 'jpeg', 'webp', 'gif']

/** Thư mục cache ảnh/video bung ra — [0.18.0] do `cachePaths.ts` quyết định. */
function thumbDir(): string {
  return cacheThumbsDir()
}

/** Bộ nhớ tạm trong phiên (kể cả kết quả "không có") để không hỏi đĩa lại. */
const memo = new Map<string, MogrtThumbResult | null>()

/** Chống bung TRÙNG một gói khi nhiều nơi hỏi cùng lúc (card + hàng đợi nền). */
const inflight = new Map<string, Promise<MogrtThumbResult | null>>()

/** Tra cache đĩa: đã bung trước đó thì trả ngay. */
function findCached(id: string): MogrtThumbResult | null {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path) return null
  const base = path.join(thumbDir(), id)
  try {
    for (const ext of CACHE_EXTS) {
      const p = `${base}.${ext}`
      if (fs.existsSync(p)) {
        return { path: p, kind: ['mp4', 'webm', 'mov'].includes(ext) ? 'video' : 'image' }
      }
    }
  } catch {
    /* bỏ qua */
  }
  return null
}

/**
 * Lấy đường dẫn ảnh/video preview của một file .mogrt (bung ra + cache nếu cần).
 * Trả về null nếu gói không chứa preview nào.
 */
export function getMogrtThumb(mogrtPath: string, id: string): Promise<MogrtThumbResult | null> {
  if (memo.has(id)) return Promise.resolve(memo.get(id) ?? null)

  const running = inflight.get(id)
  if (running) return running

  const p = extract(mogrtPath, id)
    .catch(() => null)
    .then((res) => {
      memo.set(id, res)
      inflight.delete(id)
      return res
    })
  inflight.set(id, p)
  return p
}

async function extract(mogrtPath: string, id: string): Promise<MogrtThumbResult | null> {
  const fs = getFs()
  const path = getPath()
  const req = nodeRequire()
  if (!fs || !path || !req) return null

  const cached = findCached(id)
  if (cached) return cached

  const zlib = req('zlib')
  const fh = await fs.promises.open(mogrtPath, 'r')
  try {
    const entries = await listZipEntries(fh)
    if (!entries.length) return null

    // 1. Tìm video preview trước; 2. không có mới tới ảnh.
    let target =
      entries.find((e) => PREFERRED_VIDEO.includes(e.name.toLowerCase())) ??
      entries.find((e) => VIDEO_RE.test(e.name))
    let isVideo = true
    if (!target) {
      isVideo = false
      target =
        entries.find((e) => PREFERRED_IMAGE.includes(e.name.toLowerCase())) ??
        entries.find((e) => IMAGE_RE.test(e.name))
    }
    if (!target) return null

    const data = await readZipEntry(fh, target, (d) => zlib.inflateRawSync(d))
    if (!data) return null

    const dot = target.name.lastIndexOf('.')
    const ext = dot >= 0 ? target.name.slice(dot + 1).toLowerCase() : isVideo ? 'mp4' : 'png'
    const dir = thumbDir()
    const outPath = path.join(dir, `${id}.${ext}`)

    await fs.promises.mkdir(dir, { recursive: true })
    await fs.promises.writeFile(outPath, data)
    return { path: outPath, kind: isVideo ? 'video' : 'image' }
  } finally {
    await fh.close().catch(() => {})
  }
}
