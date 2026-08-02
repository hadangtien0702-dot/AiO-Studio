/**
 * scanner.ts — quét thư mục đệ quy, phân loại asset, ghép cặp mogrt <-> mp4.
 * Chạy bằng Node.js (fs) trong panel CEP.
 */
import type { Asset, AssetType } from '../types'
import { getFs, getPath } from '../lib/node'

/** Map đuôi file -> loại asset. */
const EXT_MAP: Record<string, AssetType> = {}
const define = (type: AssetType, exts: string[]) =>
  exts.forEach((e) => (EXT_MAP[e] = type))

define('video', ['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v', 'mxf', 'wmv', 'flv'])
define('audio', ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'aif', 'aiff'])
define('image', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff', 'svg', 'heic'])
define('mogrt', ['mogrt'])
define('preset', ['prfpset', 'ffx', 'aep', 'prproj', 'lut', 'cube'])

/**
 * Đuôi file có thể làm preview cho mogrt.
 * Ưu tiên video; nhiều pack (vd zenomade) chỉ kèm ảnh động webp/gif.
 */
const PREVIEW_VIDEO_EXTS = ['mp4', 'mov', 'webm']
const PREVIEW_IMAGE_EXTS = ['webp', 'gif', 'png', 'jpg', 'jpeg']
const PREVIEW_EXTS = [...PREVIEW_VIDEO_EXTS, ...PREVIEW_IMAGE_EXTS]

/** Hậu tố tên file preview thường gặp, ngoài trường hợp trùng tên y hệt. */
const PREVIEW_SUFFIXES = ['', '_preview', '-preview', ' preview', '_thumb', '-thumb']

/** Hash chuỗi -> id ngắn ổn định (djb2). */
function hashId(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return (h >>> 0).toString(36)
}

interface RawFile {
  path: string
  fileName: string
  name: string
  ext: string
  size: number
}

/** Quét đệ quy, trả về danh sách file thô (chưa phân loại/ghép cặp). */
async function walk(
  root: string,
  onProgress?: (count: number) => void,
): Promise<RawFile[]> {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path) throw new Error('Node fs/path không khả dụng (ngoài CEP).')

  const out: RawFile[] = []
  const stack: string[] = [root]

  while (stack.length) {
    const dir = stack.pop() as string
    let entries: any[]
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true })
    } catch {
      continue // thư mục không đọc được -> bỏ qua
    }

    // Gom file hợp lệ của thư mục này lại, rồi stat SONG SONG một lượt.
    // [0.10.0] Bản cũ statSync từng file — 15.000 syscall ĐỒNG BỘ chặn luồng
    // giao diện, chỉ nhường mỗi 500 file. fs.promises.stat chạy trên thread
    // pool của Node nên vừa song song vừa không chặn UI.
    const batch: RawFile[] = []
    for (const ent of entries) {
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        // [1.3.2] `__MACOSX` KHÔNG bắt đầu bằng dấu chấm nên lọt qua bộ lọc cũ.
        if (
          ent.name === 'node_modules' ||
          ent.name === '__MACOSX' ||
          ent.name.startsWith('.')
        )
          continue
        stack.push(full)
      } else if (ent.isFile()) {
        /**
         * [1.3.2] Bỏ RÁC macOS: file `._TênGốc.wav`.
         *
         * Giải nén một file zip do máy Mac tạo trên Windows là sinh ra thư mục
         * `__MACOSX` và các file `._<tên gốc>`. Chúng là mẩu metadata vài KB
         * (AppleDouble), KHÔNG phải file media — nhưng mang đúng đuôi `.wav`,
         * `.mp3`, `.mp4` nên bộ lọc theo đuôi ở dưới cho lọt hết.
         *
         * Hậu quả đã đo 28/07: 46 file rác nằm trong thư viện, FFmpeg đọc
         * không ra nên thẻ treo mãi ở "Đang tạo sóng âm…", và Premiere cũng
         * từ chối với "Unsupported format or damaged file". Chúng chiếm chỗ
         * trong lưới và thổi phồng con số "file lỗi".
         */
        if (ent.name.startsWith('._')) continue
        const dot = ent.name.lastIndexOf('.')
        if (dot < 0) continue
        const ext = ent.name.slice(dot + 1).toLowerCase()
        if (!(ext in EXT_MAP) && !PREVIEW_EXTS.includes(ext)) continue
        batch.push({
          path: full,
          fileName: ent.name,
          name: ent.name.slice(0, dot),
          ext,
          size: 0,
        })
      }
    }

    await Promise.all(
      batch.map(async (f) => {
        try {
          f.size = (await fs.promises.stat(f.path)).size
        } catch {
          /* giữ size = 0 — hàng đợi nền sẽ thử lại */
        }
      }),
    )

    for (const f of batch) {
      out.push(f)
      if (out.length % 500 === 0) onProgress?.(out.length)
    }
  }
  if (onProgress) onProgress(out.length)
  return out
}

/** Subdirectory tên phổ biến chứa preview trong các gói MOGRT (Mister Horse, Motion Bro, Envato, etc.). */
const PREVIEW_SUBDIRS = [
  '',
  '_Mister Horse Previews',
  'Mister Horse Previews',
  'previews',
  '_previews',
  '.previews',
  'preview',
  '_preview',
  'thumbs',
  '_thumbs',
  'thumbnails',
  'assets',
]

/**
 * Tìm file preview cho một mogrt: ưu tiên video/webp/gif, sau đó tới ảnh tĩnh.
 * Tìm cả ở thư mục hiện tại VÀ các thư mục con preview (Mister Horse, Motion Bro).
 */
export function findPreview(mogrt: RawFile, previewIndex: Map<string, RawFile>, path: any): RawFile | undefined {
  const dir = path ? path.dirname(mogrt.path) : mogrt.path
  const bases = [
    mogrt.name.toLowerCase(), // kiểu A: "background 01"
    mogrt.fileName.toLowerCase(), // kiểu B: "background 01.mogrt"
  ]

  for (const sub of PREVIEW_SUBDIRS) {
    const targetDir = sub ? (path ? path.join(dir, sub) : `${dir}/${sub}`) : dir
    for (const exts of [PREVIEW_VIDEO_EXTS, PREVIEW_IMAGE_EXTS]) {
      for (const base of bases) {
        for (const suffix of PREVIEW_SUFFIXES) {
          for (const ext of exts) {
            const hit = previewIndex.get(`${targetDir}::${base}${suffix}::${ext}`)
            if (hit) return hit
          }
        }
      }
    }
  }
  return undefined
}

/**
 * Dựng Asset từ MỘT DANH SÁCH ĐƯỜNG DẪN rời (không quét thư mục).
 *
 * Dùng cho Brand Kit: thêm file vào khay bằng cách kéo thả từ Windows Explorer,
 * hoặc lấy từ clip đang chọn trên timeline Premiere. Vì không quét cả thư mục
 * nên KHÔNG ghép cặp preview cho mogrt được — mogrt thêm kiểu này sẽ dùng ảnh
 * nhúng bên trong gói (mogrtThumb) để hiện preview.
 *
 * File không nhận dạng được (đuôi lạ) bị bỏ qua, không báo lỗi.
 */
export function assetsFromPaths(paths: string[]): Asset[] {
  const fs = getFs()
  const path = getPath()
  const now = Date.now()
  const out: Asset[] = []
  const seen = new Set<string>()

  for (const raw of paths) {
    const full = String(raw || '').trim()
    if (!full || seen.has(full)) continue
    seen.add(full)

    const fileName = path ? path.basename(full) : full.split(/[\\/]/).pop() || full
    const dot = fileName.lastIndexOf('.')
    if (dot < 0) continue
    const ext = fileName.slice(dot + 1).toLowerCase()
    const type = EXT_MAP[ext]
    if (!type || type === 'other') continue

    let size = 0
    try {
      size = fs ? fs.statSync(full).size : 0
    } catch {
      /* file không đọc được stat -> vẫn thêm, size = 0 */
    }

    out.push({
      id: hashId(full),
      name: fileName.slice(0, dot),
      fileName,
      path: full,
      type,
      ext,
      fileSize: size,
      dateAdded: now,
      folder: path ? path.dirname(full) : '',
      previewPath: type === 'mogrt' ? undefined : full,
      previewKind:
        type === 'video' ? 'video' : type === 'image' ? 'image' : type === 'audio' ? 'audio' : undefined,
    })
  }

  return out
}

/**
 * Quét 1 thư mục -> danh sách Asset đã phân loại & ghép cặp mogrt/mp4.
 * File preview (mp4 đi kèm mogrt) sẽ KHÔNG xuất hiện như asset video riêng.
 */
export async function scanFolder(
  root: string,
  onProgress?: (count: number) => void,
): Promise<Asset[]> {
  const path = getPath()
  const files = await walk(root, onProgress)

  // Chỉ mục file preview theo "thư mục::tên(không đuôi)::đuôi".
  const dirOf = (p: string) => (path ? path.dirname(p) : p)
  const previewIndex = new Map<string, RawFile>()
  for (const f of files) {
    if (PREVIEW_EXTS.includes(f.ext)) {
      previewIndex.set(
        `${dirOf(f.path)}::${f.name.toLowerCase()}::${f.ext}`,
        f,
      )
    }
  }

  // Tập path preview đã bị "tiêu thụ" bởi mogrt -> loại khỏi danh sách riêng.
  const consumedPreviews = new Set<string>()
  const now = Date.now()
  const assets: Asset[] = []

  for (const f of files) {
    const type = EXT_MAP[f.ext] ?? 'other'
    if (type === 'other') continue

    let previewPath: string | undefined
    let previewKind: Asset['previewKind']

    if (type === 'mogrt') {
      const pv = findPreview(f, previewIndex, path)
      if (pv) {
        previewPath = pv.path
        previewKind = PREVIEW_VIDEO_EXTS.includes(pv.ext) ? 'video' : 'image'
        consumedPreviews.add(pv.path)
      }
    } else if (type === 'video') {
      previewPath = f.path
      previewKind = 'video'
    } else if (type === 'image') {
      previewPath = f.path
      previewKind = 'image'
    } else if (type === 'audio') {
      previewPath = f.path
      previewKind = 'audio'
    }

    assets.push({
      id: hashId(f.path),
      name: f.name,
      fileName: f.fileName,
      path: f.path,
      type,
      ext: f.ext,
      fileSize: f.size,
      dateAdded: now,
      folder: root,
      previewPath,
      previewKind,
    })
  }

  // Loại các video/ảnh vốn chỉ là preview của mogrt (tránh hiện trùng).
  return assets.filter(
    (a) =>
      !(
        (a.type === 'video' || a.type === 'image') &&
        consumedPreviews.has(a.path)
      ),
  )
}
