/**
 * library.ts — lưu/đọc thư viện asset ra file JSON trong userData.
 * (Phase 1 dùng JSON cho gọn; sẽ nâng lên SQLite ở phase sau khi cần.)
 */
import type { Asset, Brand, PowerBinFolder, AssetPack } from '../types'
import { getFs, getPath } from '../lib/node'
import { userDataPath } from '../lib/cep'

/**
 * Phiên bản cấu trúc thư viện.
 *  1 — bản đầu
 *  2 — thêm previewKind
 *  3 — thêm Phase 2 metadata
 *  4 — thêm Phase 6 Power Bins & Asset Packs
 *  5 — thêm Brand Kit (brands + PowerBinFolder.brandId)
 *
 * KHÔNG tăng số này khi chỉ THÊM trường tuỳ chọn: dữ liệu cũ vẫn đọc được
 * (khay không có brandId = khay chung), nên không cần quét lại thư viện.
 * Số 5 ở đây chỉ để ghi nhận mốc; bước migrate là không có gì phải làm.
 */
export const LIBRARY_VERSION = 5

export interface LibraryFile {
  version: number
  folders: string[]
  assets: Asset[]
  brands?: Brand[]
  powerBinFolders?: PowerBinFolder[]
  packs?: AssetPack[]
}

const EMPTY: LibraryFile = {
  version: LIBRARY_VERSION,
  folders: [],
  assets: [],
  brands: [],
  powerBinFolders: [],
  packs: [],
}

/** Thư mục dữ liệu của panel: <userData>/AiOStudio. */
function dataDir(): string {
  const path = getPath()
  const base = userDataPath() || ''
  return path ? path.join(base, 'AiOStudio') : base + '/AiOStudio'
}

/** Đường dẫn file library.json. */
export function libraryPath(): string {
  const path = getPath()
  const dir = dataDir()
  return path ? path.join(dir, 'library.json') : dir + '/library.json'
}

const VIDEO_EXTS = ['mp4', 'mov', 'webm', 'm4v', 'mkv', 'avi']

/**
 * Bù trường previewKind cho dữ liệu lưu từ bản cũ, để ảnh/video hiện được ngay
 * mà không phải chờ quét lại. (MOGRT vẫn cần quét lại để bắt cặp preview.)
 */
/**
 * [1.3.2] Rác macOS lọt vào thư viện từ các bản trước.
 *
 * Giải nén zip do máy Mac tạo trên Windows sinh ra thư mục `__MACOSX` và các
 * file `._<tên gốc>` — mẩu metadata vài KB, KHÔNG phải file media, nhưng mang
 * đúng đuôi `.wav`/`.mp3`/`.mp4` nên bộ quét cũ cho lọt hết.
 *
 * Bộ quét từ 1.3.2 đã chặn (xem `scanner.ts`), nhưng file cũ đã nằm trong
 * `library.json` rồi. Lọc ở đây — chạy mỗi lần nạp thư viện — thì sạch ngay,
 * KHÔNG phải tăng `LIBRARY_VERSION` để bắt quét lại 28.900 asset.
 *
 * Đo 28/07: 46 asset loại này, tất cả đều đã biến mất khỏi đĩa, thẻ treo vĩnh
 * viễn ở "Đang tạo sóng âm…" và Premiere thì báo "Unsupported format or
 * damaged file".
 */
function laRacMacOS(p: string): boolean {
  if (!p) return false
  return /(^|[\\/])\._/.test(p) || /[\\/]__MACOSX([\\/]|$)/.test(p)
}

function migrate(assets: Asset[]): Asset[] {
  return assets.filter((a) => !laRacMacOS(a.path)).map((a) => {
    if (a.previewKind) return a
    let previewKind: Asset['previewKind']
    let previewPath = a.previewPath
    if (a.type === 'video') {
      previewKind = 'video'
      previewPath = previewPath ?? a.path
    } else if (a.type === 'image') {
      previewKind = 'image'
      previewPath = previewPath ?? a.path
    } else if (a.type === 'audio') {
      previewKind = 'audio'
      previewPath = previewPath ?? a.path
    } else if (a.type === 'mogrt' && previewPath) {
      const dot = previewPath.lastIndexOf('.')
      const ext = dot >= 0 ? previewPath.slice(dot + 1).toLowerCase() : ''
      previewKind = VIDEO_EXTS.includes(ext) ? 'video' : 'image'
    }
    return { ...a, previewKind, previewPath }
  })
}

/** Đọc thư viện từ đĩa (rỗng nếu chưa có / lỗi). */
export function loadLibrary(): LibraryFile {
  const fs = getFs()
  if (!fs) return { ...EMPTY }
  try {
    const raw = fs.readFileSync(libraryPath(), 'utf8')
    const parsed = JSON.parse(raw) as LibraryFile
    return {
      version: parsed.version ?? 1,
      folders: parsed.folders ?? [],
      assets: migrate(parsed.assets ?? []),
      brands: parsed.brands ?? [],
      powerBinFolders: parsed.powerBinFolders ?? [],
      packs: parsed.packs ?? [],
    }
  } catch {
    return { ...EMPTY }
  }
}

/** Đang có lượt ghi chạy nền không, và bản JSON mới nhất đang chờ ghi. */
let writing = false
let pendingJson: string | null = null

/**
 * Ghi thư viện xuống đĩa (tạo thư mục nếu cần).
 *
 * [0.10.0] Ba thay đổi, cùng một lý do — file ~8 MB:
 *  - BẤT ĐỒNG BỘ: writeFileSync cũ đóng băng panel mỗi lần hàng đợi nền
 *    cập nhật asset (persist debounce 600ms → đứng hình lặp đi lặp lại).
 *  - JSON GỌN: bỏ `null, 2` — thụt lề làm file phình ~30% và tốn thời gian
 *    tạo chuỗi; file này máy đọc, không phải người đọc.
 *  - NGUYÊN TỬ: ghi ra .tmp rồi rename. Sập điện giữa lúc ghi thì thư viện
 *    cũ vẫn nguyên vẹn, không bao giờ ra file JSON cụt.
 *  Nhiều lượt gọi dồn dập thì "bản mới nhất thắng" — lượt ghi đang chạy xong
 *  sẽ ghi tiếp bản chờ gần nhất, các bản giữa bị bỏ (đúng ý: chỉ cần bản cuối).
 */
export function saveLibrary(data: LibraryFile): void {
  const fs = getFs()
  if (!fs) return
  pendingJson = JSON.stringify(data)
  void flushPending(fs)
}

async function flushPending(fs: any): Promise<void> {
  if (writing) return
  writing = true
  try {
    while (pendingJson !== null) {
      const json = pendingJson
      pendingJson = null
      const target = libraryPath()
      const tmp = target + '.tmp'
      await fs.promises.mkdir(dataDir(), { recursive: true })
      await fs.promises.writeFile(tmp, json, 'utf8')
      await fs.promises.rename(tmp, target)
    }
  } catch (e) {
    console.error('Lưu thư viện thất bại:', e)
  } finally {
    writing = false
  }
}
