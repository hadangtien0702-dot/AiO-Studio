/**
 * moc.ts — quy nội dung nghe được (mốc FILE GỐC) về trục SEQUENCE.
 *
 * THUẦN: không Node, không CEP, không React — kiểm bằng số ngoài Premiere
 * (`cd client && npm run kiem`, xem `tests/kiem-hoidap.mjs`).
 *
 * Whisper nghe trên FILE GỐC. Người dựng nhìn SEQUENCE: clip có thể đã cắt, dời,
 * có khe hở, có nhiều file, có multicam xếp chồng. Hai trục đó khác nhau, và
 * mọi thứ panel hiện (câu nào ở đâu, bấm câu nhảy đầu đọc tới đâu, khối từ mấy
 * giây) đều phải nói bằng trục SEQUENCE.
 *
 * ☠️ Hai lỗi Transcripts đã trả giá (29/07/2026, `AiO Transcripts/CLAUDE.md` mục 2):
 *  1. Lấy `clips[0]` làm cả bảng quy đổi → sequence 17 clip chỉ còn đoạn
 *     [0 → 3,36 s], 15/16 câu rơi ra ngoài và bị bỏ IM LẶNG (.srt ra 1 câu).
 *     → Ở đây quy đổi theo TỪNG clip, mỗi clip một độ lệch riêng.
 *  2. Mốc là giây TUYỆT ĐỐI trên sequence (0 = đầu sequence), KHÔNG phải tính
 *     từ đầu vùng In/Out. → `seq = clip.seqTu + (src − clip.srcTu)`, không trừ
 *     `vungTu` ở đâu cả.
 */

import type { BanNghe, CauSeq, ClipVung, DoanNguon, NguonNghe, NoiDung, TuSeq, VungLam } from './kieu'
import { danhDauBia } from './hoidap'

/** Clip đổi tốc độ lệch 1 quá mức này thì KHÔNG quy đổi (như Transcripts). */
export const LECH_TOC_TOI_DA = 0.01

/** Sai số dấu phẩy động khi so mốc (giây). */
const EPS = 1e-6

/**
 * Lọc nhanh câu theo khoảng [tu, den] của nó trước khi xét từng từ. Đo 18/09:
 * 0/19.271 từ nằm ngoài khoảng câu chứa nó — biên 2 s chỉ để phòng dữ liệu lạ.
 */
const BIEN_LOC_CAU = 2

/** So đường dẫn: cùng dấu `/`, không phân biệt hoa thường (ổ Windows / APFS mặc định). */
export function chuanDuongDan(p: string): string {
  return String(p || '')
    .replace(/\\/g, '/')
    .toLowerCase()
}

/** Nửa khung hình: hai clip chồng nhau ít hơn thế là do làm tròn, không phải chồng thật. */
function dungSai(vung: VungLam): number {
  return vung.fps > 0 ? 0.5 / vung.fps : 0.02
}

function lechToc(c: ClipVung): boolean {
  return !(Math.abs((c.speed ?? 1) - 1) <= LECH_TOC_TOI_DA)
}

function chong(a: ClipVung, b: ClipVung): number {
  return Math.min(a.seqDen, b.seqDen) - Math.max(a.seqTu, b.seqTu)
}

/** Bộ gom nhóm (union–find) nhỏ, đủ cho vài nghìn clip. */
function taoNhom(n: number): { goc: (i: number) => number; noi: (a: number, b: number) => void } {
  const cha = Array.from({ length: n }, (_, i) => i)
  const goc = (i: number): number => {
    while (cha[i] !== i) {
      cha[i] = cha[cha[i]]
      i = cha[i]
    }
    return i
  }
  const noi = (a: number, b: number) => {
    const x = goc(a)
    const y = goc(b)
    if (x !== y) cha[y] = x
  }
  return { goc, noi }
}

/** Duyệt mọi cặp clip chồng thời gian > `tol` (quét theo `seqTu`, không so n² mù). */
function moiCapChong(ds: ClipVung[], tol: number, lam: (i: number, j: number) => void): void {
  const thuTu = ds.map((_, i) => i).sort((a, b) => ds[a].seqTu - ds[b].seqTu)
  for (let p = 0; p < thuTu.length; p++) {
    const a = ds[thuTu[p]]
    for (let q = p + 1; q < thuTu.length; q++) {
      const b = ds[thuTu[q]]
      if (b.seqTu >= a.seqDen - tol) break
      if (chong(a, b) > tol) lam(thuTu[p], thuTu[q])
    }
  }
}

/** Thứ tự ưu tiên của làn khi hoà: tiếng (A) trước hình (V), track thấp trước. */
function soLan(c: ClipVung): number {
  return (c.kind === 'A' ? 0 : 1000) + c.trackIdx
}

/**
 * Đuôi file ẢNH TĨNH. Ảnh không có tiếng → không bao giờ được làm làn để NGHE.
 * Vì sao (soát 19/09, chạy trên moc.js thật): luật chọn làn so TỔNG THỜI LƯỢNG,
 * nên một logo PNG phủ cả bài dài hơn người nói dù chỉ 1 khung (0,04 s), hoặc một
 * ảnh nền ở V1 dài BẰNG người nói ở V2 (hoà → track thấp thắng), là panel nghe
 * một file ảnh: nội dung rỗng, cả bài phỏng vấn bị tính là "clip chồng bị bỏ".
 */
const DUOI_ANH = /\.(png|jpe?g|psd|ai|tiff?|gif|bmp|webp|heic|tga|exr|dpx)$/i

function laAnh(c: ClipVung): boolean {
  return c.kind === 'V' && DUOI_ANH.test(String(c.path || ''))
}

/** Hai clip là CÙNG một lời nói: cùng file, cùng độ lệch seq−src (clip hình–tiếng liên kết, lớp chép trùng). */
function lienKet(a: ClipVung, b: ClipVung, tol: number): boolean {
  return chuanDuongDan(a.path) === chuanDuongDan(b.path) && Math.abs(a.seqTu - a.srcTu - (b.seqTu - b.srcTu)) <= tol
}

/** Cắt bỏ phần đầu clip trước giây `t` (trên sequence) — src dời theo tốc độ. */
function catDau(c: ClipVung, t: number): ClipVung {
  return { ...c, seqTu: t, srcTu: c.srcTu + (t - c.seqTu) * (c.speed ?? 1) }
}

/**
 * Luật chọn làn CŨ, chạy trên MỘT loại clip (toàn V, hoặc toàn A):
 *  a. Clip liên kết (cùng file, cùng độ lệch, chồng nhau — lớp chép trùng, tiếng
 *     tách hai kênh mono) = một đoạn media; đại diện là clip dài nhất, hoà thì
 *     track thấp.
 *  b. Đoạn media CHỒNG thời gian trên các làn khác nhau (multicam xếp chồng,
 *     B-roll phủ lên) → mỗi cụm chồng nhau chỉ giữ LÀN có tổng thời lượng lớn
 *     nhất; hoà thì track thấp.
 * Trả đại diện được giữ + số đoạn media bị bỏ.
 */
function chonLan(ds: ClipVung[], tol: number): { giu: ClipVung[]; bo: number } {
  const lk = taoNhom(ds.length)
  moiCapChong(ds, tol, (i, j) => {
    if (lienKet(ds[i], ds[j], tol)) lk.noi(i, j)
  })
  const daiDien = new Map<number, ClipVung>()
  ds.forEach((c, i) => {
    const r = lk.goc(i)
    const cu = daiDien.get(r)
    if (!cu) return void daiDien.set(r, c)
    const hon =
      c.kind !== cu.kind
        ? c.kind === 'A'
        : c.seqDen - c.seqTu !== cu.seqDen - cu.seqTu
          ? c.seqDen - c.seqTu > cu.seqDen - cu.seqTu
          : c.trackIdx < cu.trackIdx
    if (hon) daiDien.set(r, c)
  })
  const doan = [...daiDien.values()]

  const cum = taoNhom(doan.length)
  moiCapChong(doan, tol, (i, j) => cum.noi(i, j))
  const theoCum = new Map<number, number[]>()
  doan.forEach((_, i) => {
    const r = cum.goc(i)
    const l = theoCum.get(r)
    if (l) l.push(i)
    else theoCum.set(r, [i])
  })
  const giu: ClipVung[] = []
  let bo = 0
  for (const thanh of theoCum.values()) {
    if (thanh.length === 1) {
      giu.push(doan[thanh[0]])
      continue
    }
    const tong = new Map<number, number>()
    for (const i of thanh) {
      const c = doan[i]
      tong.set(soLan(c), (tong.get(soLan(c)) || 0) + (c.seqDen - c.seqTu))
    }
    let lanThang = -1
    let tongThang = -1
    for (const [lan, t] of tong) {
      if (t > tongThang + EPS || (Math.abs(t - tongThang) <= EPS && lan < lanThang)) {
        lanThang = lan
        tongThang = t
      }
    }
    for (const i of thanh) {
      if (soLan(doan[i]) === lanThang) giu.push(doan[i])
      else bo++
    }
  }
  return { giu, bo }
}

/** `ds` đã sắp theo seqTu, KHÔNG chồng nhau. Clip `c` có chồng (> tol) với phần tử nào không — tìm nhị phân. */
function chongVoiDs(c: ClipVung, ds: ClipVung[], tol: number): boolean {
  let lo = 0
  let hi = ds.length - 1
  let k = -1
  while (lo <= hi) {
    const g = (lo + hi) >> 1
    if (ds[g].seqTu < c.seqDen - tol) {
      k = g
      lo = g + 1
    } else hi = g - 1
  }
  // Các phần tử trước k đều hết trước khi k bắt đầu (không chồng nhau) — chỉ cần xét k.
  return k >= 0 && ds[k].seqDen > c.seqTu + tol
}

export interface KetQuaChonClip {
  /** Clip dùng để NGHE (thứ người xem nghe thấy), xếp theo `seqTu`, KHÔNG chồng nhau. */
  clips: ClipVung[]
  /**
   * Cùng thứ tự + cùng mốc với `clips`, nhưng clip TIẾNG của một cặp hình–tiếng
   * đã đổi sang clip HÌNH của cặp đó (kind/trackIdx/clipOrd) — thứ HOST dựng
   * sequence mới (host dựng item có hình, tiếng tự đi theo; host TỪ CHỐI danh
   * sách lẫn V với A). Dùng qua `doanDung`.
   */
  dung: ClipVung[]
  /** = boQuaChong + boQuaToc. */
  boQua: number
  /**
   * Clip bị bỏ vì chồng thời gian với phần đang nghe: cam phụ multicam, B-roll
   * (phủ lên hoặc cắt chèn giữa lời nói), nhạc, mic rời, logo/ảnh — không nghe
   * và không đưa vào sequence mới.
   */
  boQuaChong: number
  /** Đoạn media bị bỏ vì đổi tốc độ (lệch 1 quá 0,01) — giao diện phải TỪ CHỐI như Transcripts. */
  boQuaToc: number
}

/**
 * Chọn clip để NGHE (và để DỰNG). Nguyên tắc: nghe đúng thứ người xem NGHE THẤY,
 * dựng từ đúng HÌNH đang được xem.
 *
 * ☠️ VÌ SAO VIẾT LẠI (soát 19/09, lỗi chặn): host đời đầu có clip HÌNH thì không
 * gửi clip TIẾNG nào, nên panel nghe tiếng của file gắn với clip hình. Hai ca hỏng
 * mà không cảnh báo gì: (1) cắt chèn B-roll NGAY TRÊN V1 trong khi lời phỏng vấn ở
 * A1 vẫn chạy liền bên dưới — đo trên đệm thật C4091: người xem nghe 726 từ, panel
 * đọc 683, mất 43 từ gồm cả một câu hỏi, và `doanDung` đưa host dựng chính đoạn
 * B-roll vào giữa câu trả lời; (2) L-cut/J-cut, tiếng dài hơn hình. Nay host gửi
 * cả clip tiếng (`sv_getRangeClips`), và hàm này:
 *
 * 1. CHỌN LÀN HÌNH bằng đúng luật cũ (`chonLan` trên các clip hình, bỏ ảnh tĩnh)
 *    — host đời đầu chỉ gửi hình nên đây là hành vi đã có, giữ nguyên để khỏi hỏng
 *    ca đang chạy đúng: nhạc nền / mic rời chỉ-có-tiếng dài hơn người nói KHÔNG
 *    được thắng làn (nhạc thì Whisper nghe ra rác; mic rời thì dựng ra sequence
 *    không hình). Cam phụ multicam, B-roll phủ trên track khác bị bỏ như cũ.
 * 2. Với mỗi đoạn hình được giữ: có clip TIẾNG liên kết (cùng file, cùng độ lệch)
 *    thì NGHE bằng clip tiếng đó — đúng khoảng người xem nghe (L-cut, tiếng chạy
 *    liền dưới B-roll cắt chèn); không có thì nghe bằng chính clip hình (tiếng
 *    nhúng trong file — ca xoá tiếng camera để dùng mic rời, như cũ).
 * 3. Clip nghe CHỒNG nhau thì phần sau bị cắt đầu, bị phủ trọn thì bỏ: B-roll cắt
 *    chèn nằm trọn dưới tiếng phỏng vấn đang chạy → bỏ (người xem nghe lời phỏng
 *    vấn); J-cut tiếng cảnh sau lấn vào cảnh trước → cắt phần lấn. Nhờ vậy danh
 *    sách dựng KHÔNG bao giờ chồng nhau (host nối đuôi trên một track).
 * 4. Vùng KHÔNG có clip hình nào (chỉ tiếng — podcast thuần tiếng, kể cả có ảnh bìa
 *    tĩnh) → luật cũ trên clip tiếng.
 * 5. Đổi tốc độ → bỏ, đếm `boQuaToc`. Làm SAU cùng để một B-roll quay chậm bị phủ
 *    không làm cả vùng bị từ chối oan.
 *
 * ☠️ Giới hạn còn lại (đo bằng số ở tests/kiem-hoidap.mjs mục 3b):
 *  - Hai mic rời, mỗi người một track, không có tiếng camera → chỉ nghe tiếng
 *    nhúng trong file hình; mic bị bỏ (đếm vào boQuaChong để giao diện nói ra).
 *  - Podcast chỉ-có-tiếng mà trên đó có một clip HÌNH (visualizer, B-roll) → làn
 *    hình thắng như luật cũ, tiếng podcast bị bỏ (có đếm).
 */
export function chonClipNghe(vung: VungLam): KetQuaChonClip {
  const tol = dungSai(vung)
  const hopLe = (vung.clips || []).filter((c) => c.seqDen - c.seqTu > tol)
  const anh = hopLe.filter(laAnh)
  const ds = hopLe.filter((c) => !laAnh(c))
  const chiSo = new Map<ClipVung, number>()
  ds.forEach((c, i) => chiSo.set(c, i))

  let nghe: ClipVung[] = []
  let dung: ClipVung[] = []
  let boQuaChong = 0
  const hinh = ds.filter((c) => c.kind === 'V')

  if (!hinh.length) {
    // Bước 4 — chỉ có tiếng: luật cũ.
    const r = chonLan(ds, tol)
    boQuaChong += r.bo
    nghe = r.giu.slice().sort((a, b) => a.seqTu - b.seqTu || soLan(a) - soLan(b))
    dung = nghe
  } else {
    // Nhóm liên kết trên MỌI clip (hình lẫn tiếng): một nhóm = một lời nói.
    const nhom = taoNhom(ds.length)
    moiCapChong(ds, tol, (i, j) => {
      if (lienKet(ds[i], ds[j], tol)) nhom.noi(i, j)
    })
    const thanhVien = new Map<number, number[]>()
    ds.forEach((_, i) => {
      const g = nhom.goc(i)
      const l = thanhVien.get(g)
      if (l) l.push(i)
      else thanhVien.set(g, [i])
    })

    // Bước 1 — chọn làn HÌNH, luật cũ.
    const r = chonLan(hinh, tol)
    boQuaChong += r.bo
    const hinhGiu = new Map<number, ClipVung[]>() // nhóm -> clip hình được giữ
    for (const v of r.giu) {
      const g = nhom.goc(chiSo.get(v)!)
      const l = hinhGiu.get(g)
      if (l) l.push(v)
      else hinhGiu.set(g, [v])
    }

    // Bước 2 — nghe bằng tiếng liên kết nếu có.
    const ungVien: { c: ClipVung; g: number }[] = []
    for (const [g, dsHinh] of hinhGiu) {
      const tieng = (thanhVien.get(g) || []).map((i) => ds[i]).filter((c) => c.kind === 'A')
      for (const c of tieng.length ? tieng : dsHinh) ungVien.push({ c, g })
    }
    ungVien.sort((a, b) => a.c.seqTu - b.c.seqTu || soLan(a.c) - soLan(b.c))

    // Bước 3 — không chồng nhau: cắt đầu phần lấn, bỏ phần bị phủ trọn.
    const conSong = new Set<number>()
    const coNghe = new Set<number>()
    const giu: { c: ClipVung; g: number }[] = []
    let het = -Infinity
    for (const u of ungVien) {
      coNghe.add(u.g)
      if (u.c.seqDen <= het + tol) continue
      const c = u.c.seqTu < het - tol ? catDau(u.c, het) : u.c
      giu.push({ c, g: u.g })
      conSong.add(u.g)
      het = Math.max(het, c.seqDen)
    }
    for (const g of coNghe) if (!conSong.has(g)) boQuaChong++

    nghe = giu.map((u) => u.c)
    // Clip tiếng → clip hình CÙNG nhóm (ưu tiên clip hình được giữ đang chồng lên nó).
    dung = giu.map(({ c, g }) => {
      if (c.kind === 'V') return c
      const dsHinh = hinhGiu.get(g) || []
      const v = dsHinh.find((x) => chong(x, c) > tol) ?? dsHinh[0]
      return v ? { ...c, kind: 'V' as const, trackIdx: v.trackIdx, clipOrd: v.clipOrd } : c
    })

    // Nhóm CHỈ có tiếng (nhạc, mic rời) không được nghe khi vùng có hình — đếm nếu
    // nó chồng lên phần đang nghe, để giao diện nói ra thay vì bỏ im lặng.
    for (const [, l] of thanhVien) {
      if (l.some((i) => ds[i].kind === 'V')) continue
      if (l.some((i) => chongVoiDs(ds[i], nghe, tol))) boQuaChong++
    }
  }

  // Ảnh tĩnh nằm trên phần đang nghe: không nghe được và không đưa vào sequence mới.
  for (const c of anh) if (chongVoiDs(c, nghe, tol)) boQuaChong++

  // Bước 5 — tốc độ.
  let boQuaToc = 0
  const clips: ClipVung[] = []
  const dungRa: ClipVung[] = []
  nghe.forEach((c, i) => {
    if (lechToc(c)) {
      boQuaToc++
      return
    }
    clips.push(c)
    dungRa.push(dung[i])
  })

  return { clips, dung: dungRa, boQua: boQuaChong + boQuaToc, boQuaChong, boQuaToc }
}

// ═══════════════════════════════ LỖI CÓ KHOÁ DỊCH ═══════════════════════════════

/**
 * Lỗi ném ra cho giao diện. `khoa` là câu tiếng Việt có chỗ trống `{f}` `{a}`
 * `{b}` — bên vẽ gọi `dich(e.khoa)` rồi điền `e.thay`, không dịch `message`
 * (message đã điền số nên không còn là khoá trong `chu.ts`).
 */
export class LoiNoiDung extends Error {
  readonly khoa: string
  readonly thay: Record<string, string | number>
  constructor(khoa: string, thay: Record<string, string | number>) {
    let s = khoa
    for (const k of Object.keys(thay)) s = s.split('{' + k + '}').join(String(thay[k]))
    super(s)
    this.name = 'LoiNoiDung'
    this.khoa = khoa
    this.thay = thay
  }
}

export const LOI_LECH_TU = 'Bản nghe của "{f}" bị lệch: câu có {a} từ nhưng có {b} mốc từ. Bấm Nghe lại để nghe lại file này.'

// ═══════════════════════════════ DỰNG NỘI DUNG ═══════════════════════════════

const UU_TIEN: Record<NguonNghe, number> = { 'vua-nghe': 3, 'dem-v2': 2, 'dem-v1': 1 }

interface BanDaDoc {
  ban: BanNghe
  /** Token của từng câu (tách khoảng trắng) — chính là chữ người dùng đọc. */
  token: string[][]
  /** Chỉ số từ ĐẦU của từng câu trong `ket.tu`. */
  dauTu: number[]
  bia: boolean[]
  soTuGiu: number
}

function tenFile(p: string): string {
  const s = String(p || '').replace(/\\/g, '/')
  return s.slice(s.lastIndexOf('/') + 1)
}

/**
 * Gán từ vào câu THEO CHỈ SỐ: câu thứ i tách khoảng trắng ra k token thì chiếm
 * đúng k phần tử kế tiếp của `tu[]`. Đo 18/09 trên 9 file: tổng token = `tu.length`
 * ở cả 9, chữ khớp 100%. Lệch là đệm hỏng / khác phiên bản → NÉM LỖI, không gán
 * mò theo giờ (gán mò thì lệch một từ là lệch cả phần còn lại, im lặng).
 */
function docBan(ban: BanNghe): BanDaDoc {
  const cau = ban.ket.cau || []
  const tu = ban.ket.tu || []
  const token: string[][] = []
  const dauTu: number[] = []
  let k = 0
  for (const c of cau) {
    const t = String(c.chu || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
    token.push(t)
    dauTu.push(k)
    k += t.length
  }
  if (k !== tu.length) throw new LoiNoiDung(LOI_LECH_TU, { f: tenFile(ban.path), a: k, b: tu.length })
  return { ban, token, dauTu, bia: danhDauBia(cau.map((c) => c.chu)), soTuGiu: 0 }
}

interface TuTam {
  chu: string
  tu: number
  den: number
  p: number
}

interface ManhCau {
  tu: number
  den: number
  chu: string
  path: string
  srcTu: number
  srcDen: number
  bia: boolean
  tinCayThap: boolean
  tus: TuTam[]
}

/**
 * Dựng nội dung trên trục SEQUENCE từ vùng làm việc + các bản nghe.
 *
 * Với mỗi clip giữ lại (`chonClipNghe`): lấy câu/từ của bản nghe CÙNG file, chỉ
 * giữ TỪ có mốc đầu nằm trong [srcTu, srcDen) của clip. Câu chạm mép clip thì
 * cắt THEO TỪ (chữ chỉ còn phần nằm trong clip) — không kéo cả câu vào, không
 * vứt cả câu đi. Một câu dùng lại ở hai clip → hai mảnh riêng.
 *
 * Mốc cuối từ = mốc đầu từ kế tiếp trong câu (hoặc cuối câu), kẹp trong clip:
 * đệm KHÔNG lưu mốc cuối từ.
 *
 * Nhiều bản nghe cùng một file: ưu tiên vừa nghe > đệm v2 > đệm v1.
 * Clip không có bản nghe nào → không có chữ (giao diện tự so để báo "chưa nghe").
 */
export function dungNoiDung(vung: VungLam, ban: BanNghe[]): NoiDung {
  const { clips, boQua } = chonClipNghe(vung)

  const theoPath = new Map<string, BanNghe>()
  for (const b of ban || []) {
    const k = chuanDuongDan(b.path)
    const cu = theoPath.get(k)
    if (!cu || UU_TIEN[b.nguon] > UU_TIEN[cu.nguon]) theoPath.set(k, b)
  }
  const daDoc = new Map<string, BanDaDoc>()

  const manh: ManhCau[] = []
  for (const clip of clips) {
    const k = chuanDuongDan(clip.path)
    const b = theoPath.get(k)
    if (!b) continue
    let d = daDoc.get(k)
    if (!d) {
      d = docBan(b)
      daDoc.set(k, d)
    }
    const lech = clip.seqTu - clip.srcTu
    const cau = b.ket.cau
    const tu = b.ket.tu
    for (let ci = 0; ci < cau.length; ci++) {
      const c = cau[ci]
      const tok = d.token[ci]
      if (!tok.length) continue
      if (c.den < clip.srcTu - BIEN_LOC_CAU || c.tu > clip.srcDen + BIEN_LOC_CAU) continue
      const w0 = d.dauTu[ci]
      const giu: number[] = []
      for (let w = 0; w < tok.length; w++) {
        const g = tu[w0 + w].giay
        if (g >= clip.srcTu - EPS && g < clip.srcDen - EPS) giu.push(w)
      }
      if (!giu.length) continue

      const tus: TuTam[] = giu.map((w) => {
        const t = tu[w0 + w]
        const tuSeq = t.giay + lech
        const denGoc = w + 1 < tok.length ? tu[w0 + w + 1].giay : c.den
        const denSeq = Math.min(denGoc + lech, clip.seqDen)
        return { chu: tok[w], tu: tuSeq, den: Math.max(denSeq, tuSeq), p: typeof t.p === 'number' ? t.p : 1 }
      })
      const dauCau = giu[0] === 0
      const tuM = dauCau ? Math.min(Math.max(c.tu + lech, clip.seqTu), tus[0].tu) : tus[0].tu
      const denM = Math.max(tus[tus.length - 1].den, tuM)
      const thap = tus.filter((x) => x.p < 0.5).length
      manh.push({
        tu: tuM,
        den: denM,
        chu: giu.length === tok.length ? tok.join(' ') : tus.map((x) => x.chu).join(' '),
        path: b.path,
        srcTu: tuM - lech,
        srcDen: denM - lech,
        bia: d.bia[ci],
        tinCayThap: 2 * thap >= tus.length,
        tus,
      })
      d.soTuGiu += tus.length
    }
  }

  // Sắp theo thời gian SEQUENCE (sort của JS ổn định: cùng mốc thì giữ thứ tự clip → câu).
  manh.sort((a, b) => a.tu - b.tu)

  const cauRa: CauSeq[] = []
  const tuRa: TuSeq[] = []
  manh.forEach((m, id) => {
    const tuDau = tuRa.length
    for (const w of m.tus) tuRa.push({ chu: w.chu, tu: w.tu, den: w.den, p: w.p, cau: id })
    cauRa.push({
      id,
      tu: m.tu,
      den: m.den,
      chu: m.chu,
      tuDau,
      tuCuoi: tuRa.length,
      path: m.path,
      srcTu: m.srcTu,
      srcDen: m.srcDen,
      bia: m.bia,
      tinCayThap: m.tinCayThap,
    })
  })

  // Ngôn ngữ = của bản nghe đóng góp nhiều từ nhất. Đệm v1 không ghi → 'vi'
  // (v1 luôn nghe bằng `-l vi`).
  let ngonNgu = ''
  let nhieuNhat = -1
  for (const d of daDoc.values()) {
    if (d.soTuGiu > nhieuNhat) {
      nhieuNhat = d.soTuGiu
      ngonNgu = d.ban.ket.ngonNgu || 'vi'
    }
  }

  return {
    cau: cauRa,
    tu: tuRa,
    ngonNgu: ngonNgu || 'vi',
    coDemV1: [...daDoc.values()].some((d) => d.ban.nguon === 'dem-v1'),
    soClipBoQua: boQua,
  }
}

// ═══════════════════════════════ ĐOẠN GỐC ═══════════════════════════════

/**
 * `DoanNguon` kèm vị trí trên SEQUENCE và tốc độ.
 * Đề xuất đưa hai trường seq vào `kieu.ts`: không có chúng thì host không biết
 * hai đoạn là NỐI TIẾP (clip này hết mới tới clip kia) hay SONG SONG (V1 và V2
 * cùng lúc) — thứ tự trong mảng không đủ nói.
 */
export interface DoanNguonSeq extends DoanNguon {
  seqTu: number
  seqDen: number
  speed: number
}

/**
 * Khoảng SEQUENCE [tu, den) → các đoạn gốc của MỌI clip giao với khoảng (V lẫn A,
 * mọi track), xếp theo thời gian rồi V trước A, track thấp trước.
 *
 * Dùng để TRA NGƯỢC (mốc trên sequence → media gốc nào, giây thứ mấy).
 * ☠️ KHÔNG đưa thẳng kết quả này cho host dựng sequence — dùng `doanDung` ở dưới.
 * Bản đầu (19/09) ghi "dựng thì mang theo cả B-roll / multicam, host tự gộp theo
 * projectItem" — SAI với host thật: `sv__dung` đặt các đoạn NỐI TIẾP nhau trên
 * MỘT track, không xếp lớp, không gộp. Xem `doanDung`.
 *
 * Clip đổi tốc độ: src tính theo tốc độ (`srcTu + (seq − seqTu) × speed`) và trả
 * kèm `speed`. Clip tua ngược (speed ≤ 0) bị bỏ — chưa biết host ghi
 * srcTu/srcDen của nó theo chiều nào.
 */
export function doanNguon(vung: VungLam, tu: number, den: number): DoanNguonSeq[] {
  const ra: DoanNguonSeq[] = []
  for (const c of vung.clips || []) {
    const speed = c.speed ?? 1
    if (!(speed > 0)) continue
    const a = Math.max(tu, c.seqTu)
    const b = Math.min(den, c.seqDen)
    if (b - a <= EPS) continue
    ra.push({
      kind: c.kind,
      trackIdx: c.trackIdx,
      clipOrd: c.clipOrd,
      path: c.path,
      srcTu: c.srcTu + (a - c.seqTu) * speed,
      srcDen: c.srcTu + (b - c.seqTu) * speed,
      seqTu: a,
      seqDen: b,
      speed,
    })
  }
  return ra.sort(
    (x, y) =>
      x.seqTu - y.seqTu || (x.kind === y.kind ? 0 : x.kind === 'V' ? -1 : 1) || x.trackIdx - y.trackIdx,
  )
}

/**
 * Khoảng SEQUENCE [tu, den) → danh sách đoạn để HOST DỰNG sequence mới (một khối).
 *
 * ☠️ VÌ SAO KHÔNG DÙNG `doanNguon` (bắt được lúc ghép 19/09, trước lần cài đầu):
 * host (`sv__dung` trong shortviral.jsx) đặt các đoạn NỐI TIẾP nhau trên MỘT
 * track — đoạn sau bắt đầu ở chỗ đoạn trước hết. Nó không xếp lớp. Đưa nó mọi
 * làn thì một khối có B-roll V2 phủ lên lời nói V1 ra sequence mới = lời nói RỒI
 * TỚI B-roll nối đuôi phía sau; multicam xếp chồng ra hai lần nội dung. Và phép
 * kiểm độ dài của host vẫn ĐẠT, vì `mongMuon` cộng cả hai — hỏng im lặng.
 *
 * → Chỉ lấy đúng phần đã NGHE (`chonClipNghe(...).dung`): khối được định nghĩa
 *   bằng lời nói ở đó, nên dựng lại từ đó. B-roll / cam phụ KHÔNG theo sang
 *   sequence mới — cùng loại giới hạn với hiệu ứng, màu, keyframe (host đã ghi).
 * → Cặp V/A liên kết: nghe bằng clip A (đúng khoảng người xem nghe — L-cut, tiếng
 *   chạy liền dưới B-roll cắt chèn); dựng thì đổi sang clip V của cặp đó (host
 *   dựng item có hình, tiếng tự đi theo; host TỪ CHỐI danh sách lẫn V với A —
 *   `DOAN_TRON_LOAI`). Giữ nguyên mốc của clip A: host chỉ dùng clip để lấy
 *   projectItem và soát đường dẫn, in/out lấy từ srcTu/srcDen.
 * Kết quả: các đoạn KHÔNG chồng nhau, xếp theo `seqTu` — đúng thứ host nối.
 *
 * @param lan  `lanDung(vung)` tính SẴN — dựng nhiều khối thì tính MỘT lần rồi
 *   truyền vào. Soát 19/09 (sequence 886 clip nhảy kiểu sau Autocut, V+A, 65
 *   khối): tính lại cho từng khối + dò cặp V/A bằng `find` là 11,2 giây đứng hình
 *   trước khi thanh tiến độ kịp hiện.
 */
export function doanDung(vung: VungLam, tu: number, den: number, lan?: ClipVung[]): DoanNguonSeq[] {
  return doanNguon({ ...vung, clips: lan ?? lanDung(vung) }, tu, den)
}

/** Danh sách clip để HOST dựng (= `chonClipNghe(vung).dung`) — tính một lần cho cả lượt tạo sequence. */
export function lanDung(vung: VungLam): ClipVung[] {
  return chonClipNghe(vung).dung
}
