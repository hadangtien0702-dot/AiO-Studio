/**
 * zipRead.ts — đọc MỘT file bên trong gói ZIP mà KHÔNG đọc cả gói.
 *
 * Vì sao tồn tại: bản cũ `fs.readFileSync(mogrtPath)` nạp nguyên gói .mogrt
 * (5–60 MB) vào RAM, ĐỒNG BỘ, ngay trên luồng giao diện — cuộn qua 100 thẻ
 * mogrt chưa cache là panel đứng hình từng nhịp. Cấu trúc ZIP cho phép đọc
 * đúng 3 mảnh: đuôi file (tìm EOCD) → vùng mục lục (central directory) →
 * đúng entry cần. Với gói 60 MB chứa thumb 100 KB, tổng số byte đọc giảm
 * từ 60 MB xuống ~200 KB.
 *
 * File này KHÔNG import gì từ CEP — mọi phụ thuộc (fs.promises) truyền qua
 * tham số, để test được bằng Node thật bên ngoài panel (bài học: test hàm
 * THẬT, đừng test bản chép tay).
 */

/** Phần fs.promises mà module này cần (mở file, đọc theo vị trí). */
export interface FsPromisesLike {
  open(path: string, flags: string): Promise<FileHandleLike>
}

export interface FileHandleLike {
  stat(): Promise<{ size: number }>
  read(buffer: Uint8Array, offset: number, length: number, position: number): Promise<{ bytesRead: number }>
  close(): Promise<void>
}

/** Hàm giải nén deflate-raw đồng bộ (zlib.inflateRawSync của Node). */
export type InflateRaw = (data: Uint8Array) => Uint8Array

export interface ZipEntryInfo {
  name: string
  /** 0 = lưu nguyên, 8 = deflate. */
  method: number
  compSize: number
  localOffset: number
}

const EOCD_SIG = 0x06054b50
const CDIR_SIG = 0x02014b50
const LOCAL_SIG = 0x04034b50
/** EOCD tối thiểu 22 byte + comment tối đa 65535. */
const EOCD_SEARCH = 22 + 65535

function readU16(b: Uint8Array, p: number): number {
  return b[p] | (b[p + 1] << 8)
}

function readU32(b: Uint8Array, p: number): number {
  return (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0
}

async function readAt(fh: FileHandleLike, position: number, length: number): Promise<Uint8Array> {
  const buf = new Uint8Array(length)
  const { bytesRead } = await fh.read(buf, 0, length, position)
  return bytesRead === length ? buf : buf.subarray(0, bytesRead)
}

/**
 * Liệt kê mục lục của gói ZIP bằng 2 lần đọc nhỏ (đuôi + central directory).
 */
export async function listZipEntries(fh: FileHandleLike): Promise<ZipEntryInfo[]> {
  const { size } = await fh.stat()
  if (size < 22) return []

  // 1. Đọc đuôi file, tìm chữ ký EOCD từ cuối lên.
  const tailLen = Math.min(EOCD_SEARCH, size)
  const tail = await readAt(fh, size - tailLen, tailLen)
  let eocd = -1
  for (let i = tail.length - 22; i >= 0; i--) {
    if (readU32(tail, i) === EOCD_SIG) {
      eocd = i
      break
    }
  }
  if (eocd < 0) return []

  const count = readU16(tail, eocd + 10)
  const cdSize = readU32(tail, eocd + 12)
  const cdOffset = readU32(tail, eocd + 16)
  if (cdOffset + cdSize > size) return [] // ZIP64 hoặc file hỏng — bỏ qua

  // 2. Đọc đúng vùng central directory.
  const cd = await readAt(fh, cdOffset, cdSize)
  const out: ZipEntryInfo[] = []
  let p = 0
  for (let i = 0; i < count; i++) {
    if (p + 46 > cd.length || readU32(cd, p) !== CDIR_SIG) break
    const method = readU16(cd, p + 10)
    const compSize = readU32(cd, p + 20)
    const fnLen = readU16(cd, p + 28)
    const exLen = readU16(cd, p + 30)
    const cmLen = readU16(cd, p + 32)
    const localOffset = readU32(cd, p + 42)
    let name = ''
    for (let c = 0; c < fnLen; c++) name += String.fromCharCode(cd[p + 46 + c])
    out.push({ name, method, compSize, localOffset })
    p += 46 + fnLen + exLen + cmLen
  }
  return out
}

/**
 * Đọc và giải nén nội dung MỘT entry (2 lần đọc nhỏ: local header + dữ liệu).
 * Trả về null nếu entry hỏng hoặc dùng phương thức nén không hỗ trợ.
 */
export async function readZipEntry(
  fh: FileHandleLike,
  entry: ZipEntryInfo,
  inflateRaw: InflateRaw,
): Promise<Uint8Array | null> {
  const head = await readAt(fh, entry.localOffset, 30)
  if (head.length < 30 || readU32(head, 0) !== LOCAL_SIG) return null
  const fnLen = readU16(head, 26)
  const exLen = readU16(head, 28)
  const dataStart = entry.localOffset + 30 + fnLen + exLen

  const data = await readAt(fh, dataStart, entry.compSize)
  if (data.length !== entry.compSize) return null

  if (entry.method === 0) return data
  if (entry.method === 8) {
    try {
      return inflateRaw(data)
    } catch {
      return null
    }
  }
  return null
}
