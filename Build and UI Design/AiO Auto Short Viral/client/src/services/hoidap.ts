/**
 * hoidap.ts — NÃO chia khối HỎI–ĐÁP của AiO Auto Short Viral.
 *
 * THUẦN: không Node, không CEP, không React. Chỉ ăn `NoiDung` (đã quy về trục
 * SEQUENCE ở `moc.ts`) và nhả ra `ChiaKhoi` / `Khoi[]`. Nhờ vậy kiểm được bằng
 * số ngoài Premiere: `cd client && npm run kiem` (xem `tests/kiem-hoidap.mjs`).
 *
 * ── Thuật toán v0 (đo 18/09/2026 trên 4 bản chép lời thật, 19.271 từ) ──
 *  1. Tách ở MỨC TỪ tại mọi từ chứa dấu `?`. KHÔNG tách ở mức câu Whisper:
 *     Gnostic có 10/21 dấu `?` nằm GIỮA câu Whisper, Machine 6/28.
 *  2. Lùi về đầu câu hỏi: dừng sau dấu kết câu gần nhất (.!?… có thể kèm nháy /
 *     ngoặc) hoặc sau token `-` (Whisper đánh dấu đổi lượt thoại). Trần 30 từ —
 *     vượt trần thì lấy đầu câu Whisper chứa dấu `?` và gắn cờ.
 *  3. Ba loại `?` KHÔNG mở khối: câu hỏi ≤ 2 từ ("What?" là phản ứng), đuôi hỏi
 *     ", right?" (câu khẳng định đội lốt hỏi), câu trích dẫn có dấu nháy (người
 *     kể lại lời người khác hỏi).
 *  4. Câu hỏi bắt đầu ≤ 4 s sau dấu `?` trước → chung một khối (người hỏi dồn).
 *  5. Khối < 10 s gộp vào khối trước. Khối > 180 s gắn cờ DÀI, không tự chia
 *     (bản 0.1.0 không làm "gom đoạn cùng ý nghĩa").
 *
 * Kết quả đo trên Machine (55 phút): 19 khối, ngắn nhất 15,4 s, trung vị 77,2 s,
 * dài nhất 759,5 s. Đọc bằng mắt: 14/19 chỗ chia có lý, CHỈ 8/19 là hỏi–đáp thật.
 * ☠️ Tức là máy KHÔNG biết ai hỏi — giao diện bắt buộc phải cho sửa tay nhanh
 * (gộp / tách / đổi tên / bỏ), và các hàm sửa ở cuối file đều THUẦN, trả bản mới
 * để giao diện hoàn tác bằng ngăn xếp.
 *
 * ☠️ Mọi ngưỡng (4 s, ≤2 từ, 30 từ, 10 s, 180 s) chọn từ mẫu RẤT NHỎ và toàn
 * phim tài liệu tiếng Anh. CHƯA ĐO trên podcast host–khách tiếng Việt. Đừng
 * hứa với người dùng là "chia đúng"; chỉ nói "gợi ý để sửa".
 *
 * Nguồn số đo: `scratchpad/w2/nao-hoi-dap.md` (18/09) — bộ kiểm hồi quy giữ các
 * số đó trong `tests/kiem-hoidap.mjs`.
 */

import type { ChiaKhoi, CoKhoi, Khoi, NoiDung } from './kieu'

// ═══════════════════════════════ NGƯỠNG ═══════════════════════════════
// Mỗi con số kèm chỗ nó đến từ đâu — đổi thì chạy lại `npm run kiem`.

/** Lùi tìm đầu câu hỏi tối đa bao nhiêu từ. Machine có 2 ca chạm trần, cả hai
 *  nằm trong vùng Whisper chép KHÔNG dấu câu (36,2% thời lượng Machine). */
export const TRAN_LUI_TU = 30
/** Câu hỏi ≤ bấy nhiêu từ không mở khối. Đo: chỉ 2 ca, cả 2 là "What?" phản ứng. */
export const HOI_NGAN_TU = 2
/** Câu hỏi bắt đầu trong vòng bấy nhiêu giây sau dấu `?` trước → chung khối.
 *  Đo: 9 nhóm trên 4 file, đọc bằng mắt cả 9 đều là MỘT người hỏi dồn. */
export const CHUOI_HOI_GIAY = 4
/** Khối ngắn hơn thì gộp vào khối trước. Trên 4 file tài liệu TIẾNG ANH (18/09) luật
 *  này chưa lần nào kích hoạt. ☠️ SỬA 19/09 (soát): câu cũ ghi "chưa lần nào kích
 *  hoạt, chỉ là lưới an toàn" — SAI với phỏng vấn TIẾNG VIỆT: `npm run kiem` dòng
 *  "gop <10s" trên 5 đệm G: ra Cam1_ToanCanh 7 · Cam2_Thien 5 · Cam3_Trong 0 ·
 *  C4085 2 · C4091 6 — mỗi lần gộp là một khối hỏi ngắn nhập vào khối trước và
 *  MẤT tiêu đề câu hỏi của nó. Gộp như vậy có làm mất câu hỏi thật không: CHƯA
 *  NGHE KIỂM bằng tai (nằm trong danh sách nghe kiểm của PROGRESS.md). */
export const KHOI_NGAN_GIAY = 10
/** Khối dài hơn thì gắn cờ 'dai'. Machine: 5 khối > 180 s chiếm 70,5% thời lượng. */
export const KHOI_DAI_GIAY = 180

export interface TuyChonKhoi {
  /**
   * Coi đuôi hỏi tiếng Việt (", nhỉ?" · ", hả?" · ", phải không?" · ", đúng
   * không?") như ", right?" — KHÔNG mở khối. ☠️ CHƯA ĐO trên tiếng Việt thật nên
   * mặc định TẮT: "Chịp nói lạnh đúng không?" (Cam1 16:02) là câu hỏi xác nhận
   * thật, bật nhầm là mất khối.
   */
  duoiHoiViet: boolean
  /**
   * Kéo token `-` (dấu đổi lượt thoại của Whisper) về CÙNG khối với câu hỏi ngay
   * sau nó, và nếu trước câu hỏi trong câu Whisper chỉ toàn token dấu thì lấy
   * luôn đầu câu Whisper làm mốc.
   * Vì sao: v0 dừng lùi SAU token `-` nên "- How often…?" bị chẻ đôi: `-` nằm ở
   * cuối khối trước, câu hỏi bắt đầu giữa câu Whisper và bị cờ "ranh giới cần
   * nghe" oan — Machine có 6 ca như vậy ngoài 5 ca giữa câu thật. Token `-` cách
   * từ kế tiếp 0,00–0,66 s (đo trên 9 file), nên số khối không đổi.
   * Tắt (`false`) = đúng y v0 đã đo — bộ kiểm dùng để đối chiếu số cũ.
   */
  keoGach: boolean
}

export const TUY_CHON_KHOI: Readonly<TuyChonKhoi> = Object.freeze({
  duoiHoiViet: false,
  keoGach: true,
})

// ═══════════════════════════════ CÂU BỊA ═══════════════════════════════

/**
 * Câu Whisper BỊA ra đã biết — khớp theo NỘI DUNG.
 *
 * ☠️ KHÔNG lọc theo "dài đúng 30 s": đo 18/09 có 9/11 câu subscribe dài 29,98 s
 * nhưng 2 câu dài 10,6 s và 18,7 s, còn "Cảm ơn các bạn đã theo dõi." chỉ ~2 s.
 * Lọc theo độ dài là lọt cả 6 câu đó.
 *
 * ☠️ Giữ danh sách HẸP, cố ý: "thanks for watching… why not subscribe?" ở cuối
 * Gnostic là lời THẬT của người làm phim; "đăng ký kênh" là câu thật trong
 * podcast YouTube. Chỉ ghi những cụm mà người thật gần như không nói.
 */
const MAU_BIA: readonly RegExp[] = [
  /subscribe cho kênh/i, // "Hãy subscribe cho kênh Ghiền Mì Gõ…" · "…kênh lalaschool…"
  /ghiền mì gõ/i,
  /lalaschool/i,
  /cảm ơn các bạn đã theo dõi/i,
]

/** Câu ngắn chỉ bị coi là bịa khi LẶP liền nhau (một câu "Thank you." là lời thật). */
const CAU_LAP_2_LA_BIA = /^thank you$/

/** Chuỗi câu giống hệt lặp liền nhau từ bấy nhiêu câu → bịa (Whisper mắc vòng
 *  lặp: đo được chuỗi 806 câu trước khi bật `-mc 0`). */
const LAP_TOI_THIEU = 3

function chuanCau(s: string): string {
  return String(s || '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?…,;:]+$/, '')
    .trim()
}

/**
 * Đánh dấu câu bịa trong một danh sách câu THEO ĐÚNG THỨ TỰ nghe (thứ tự file
 * gốc — `moc.ts` gọi trên cả bản nghe, không gọi trên mảnh đã cắt, để một câu
 * bị clip cắt đôi vẫn nhận ra và để hai clip đặt cạnh nhau không đẻ ra "lặp" giả).
 */
export function danhDauBia(chus: string[]): boolean[] {
  const n = chus.length
  const ra: boolean[] = new Array<boolean>(n).fill(false)
  const chuan = chus.map(chuanCau)
  for (let i = 0; i < n; i++) {
    const s = String(chus[i] || '').normalize('NFC')
    if (MAU_BIA.some((m) => m.test(s))) ra[i] = true
  }
  let i = 0
  while (i < n) {
    let j = i + 1
    while (j < n && chuan[j] === chuan[i]) j++
    const dai = j - i
    if (chuan[i] !== '' && (dai >= LAP_TOI_THIEU || (dai >= 2 && CAU_LAP_2_LA_BIA.test(chuan[i])))) {
      for (let k = i; k < j; k++) ra[k] = true
    }
    i = j
  }
  return ra
}

// ═══════════════════════════════ TÌM CÂU HỎI ═══════════════════════════════

/** Dấu kết câu ở cuối token, cho phép nháy / ngoặc đóng theo sau ("shot?"" · "from?'"). */
const KET_CAU = /[.!?…]["'”’)\]]*$/
/** Đuôi hỏi tiếng Anh. Đo: 3 ca, loại đúng 2, loại NHẦM 1 ("And you can actually buy it, right?"). */
const DUOI_EN = /^(right|huh|no|okay)\?/i
const DUOI_VI_1 = /^(nhỉ|hả)\?/i
const DUOI_VI_2_CUOI = /^không\?/i
const DUOI_VI_2_TRUOC = /^(phải|đúng)$/i
/** Token mở bằng dấu nháy → câu trích dẫn. Đo: 3/3 loại đúng. Lời kể KHÔNG có nháy thì lọt. */
const NHAY_DAU = /^["'“‘]/
const NHAY_SAU_HOI = /\?["'”’]/
const CO_CHU = /[\p{L}\p{N}]/u

/** Lý do một dấu `?` KHÔNG mở khối ('' = được mở khối). */
export type LoaiHoi = '' | 'ngan' | 'duoi' | 'trich' | 'bia'

export interface CauHoi {
  /** Chỉ số từ ĐẦU câu hỏi (đã lùi) trong `NoiDung.tu`. */
  dau: number
  /** Chỉ số từ chứa dấu `?`. */
  hoi: number
  /** Lùi chạm trần 30 từ → đầu câu hỏi lấy theo đầu câu Whisper, không chắc. */
  tran: boolean
  loai: LoaiHoi
}

interface NhomHoi {
  dau: number
  cac: CauHoi[]
}

interface PhanTich {
  cauHoi: CauHoi[]
  /** Mọi nhóm câu hỏi (TRƯỚC bước gộp khối < 10 s). */
  nhom: NhomHoi[]
  nhomTheoDau: Map<number, NhomHoi>
  /** Ranh giới máy tự chia (sau mọi bước). */
  ranhGioi: number[]
  soGopNgan: number
  tEnd: number
}

/**
 * Bộ nhớ đệm theo ĐỐI TƯỢNG `NoiDung`: `lamKhoi` chạy lại sau MỖI cú sửa tay
 * của người dùng và cần biết máy đã tự chia ra sao (để gắn cờ 'sua-tay', để lấy
 * lại câu hỏi khi người dùng tách lại đúng chỗ cũ). ☠️ Hợp đồng: `NoiDung` là
 * BẤT BIẾN — muốn đổi thì dựng đối tượng mới (WeakMap tự nhả bản cũ).
 */
const _dem = new WeakMap<NoiDung, Map<string, PhanTich>>()

function tuyChon(tc?: Partial<TuyChonKhoi>): TuyChonKhoi {
  return { ...TUY_CHON_KHOI, ...(tc || {}) }
}

function laBia(nd: NoiDung, tuIdx: number): boolean {
  const c = nd.cau[nd.tu[tuIdx].cau]
  return !!(c && c.bia)
}

/** Giây kết thúc nội dung trên SEQUENCE (mốc cuối của khối cuối). */
function mocCuoi(nd: NoiDung): number {
  let m = 0
  for (const c of nd.cau) if (c.den > m) m = c.den
  return m
}

function timDau(nd: NoiDung, hoi: number): { dau: number; tran: boolean; soTu: number } {
  const tu = nd.tu
  let s = hoi
  while (s > 0) {
    const p = tu[s - 1].chu
    if (p === '-' || KET_CAU.test(p)) break
    // Không lùi xuyên vào câu bịa: nó không phải lời ai nói cả.
    if (laBia(nd, s - 1)) break
    s--
  }
  let tran = false
  if (hoi - s + 1 > TRAN_LUI_TU) {
    tran = true
    s = nd.cau[tu[hoi].cau].tuDau
  }
  // Số từ tính TRƯỚC khi kéo gạch — để lọc ngắn / đuôi / trích y như v0 đã đo.
  const soTu = hoi - s + 1
  return { dau: s, tran, soTu }
}

function keoGachVe(nd: NoiDung, dau: number): number {
  const tu = nd.tu
  let s = dau
  if (s > 0 && tu[s - 1].chu === '-' && !laBia(nd, s - 1)) s--
  const c = nd.cau[tu[s].cau]
  if (c && s > c.tuDau) {
    let chiDau = true
    for (let k = c.tuDau; k < s; k++) if (CO_CHU.test(tu[k].chu)) { chiDau = false; break }
    if (chiDau) s = c.tuDau
  }
  return s
}

function laDuoi(nd: NoiDung, s: number, hoi: number, tc: TuyChonKhoi): boolean {
  const tu = nd.tu
  const soTu = hoi - s + 1
  if (soTu > 1 && /,$/.test(tu[hoi - 1].chu)) {
    if (DUOI_EN.test(tu[hoi].chu)) return true
    if (tc.duoiHoiViet && DUOI_VI_1.test(tu[hoi].chu)) return true
  }
  if (
    tc.duoiHoiViet &&
    soTu > 2 &&
    DUOI_VI_2_CUOI.test(tu[hoi].chu) &&
    DUOI_VI_2_TRUOC.test(tu[hoi - 1].chu) &&
    /,$/.test(tu[hoi - 2].chu)
  )
    return true
  return false
}

function phanTich(nd: NoiDung, tcVao?: Partial<TuyChonKhoi>): PhanTich {
  const tc = tuyChon(tcVao)
  const khoa = (tc.duoiHoiViet ? '1' : '0') + (tc.keoGach ? '1' : '0')
  let theoNd = _dem.get(nd)
  if (!theoNd) {
    theoNd = new Map()
    _dem.set(nd, theoNd)
  }
  const co = theoNd.get(khoa)
  if (co) return co

  const tu = nd.tu
  const cauHoi: CauHoi[] = []
  for (let i = 0; i < tu.length; i++) {
    if (tu[i].chu.indexOf('?') < 0) continue
    if (laBia(nd, i)) {
      // "Có kiểm gì?" lặp 3 lần (Cam3 14:54) là Whisper mắc vòng — không mở khối.
      cauHoi.push({ dau: i, hoi: i, tran: false, loai: 'bia' })
      continue
    }
    const { dau, tran, soTu } = timDau(nd, i)
    let loai: LoaiHoi = ''
    if (soTu <= HOI_NGAN_TU) loai = 'ngan'
    else if (laDuoi(nd, dau, i, tc)) loai = 'duoi'
    else {
      let trich = NHAY_SAU_HOI.test(tu[i].chu)
      for (let k = dau; !trich && k <= i; k++) if (NHAY_DAU.test(tu[k].chu)) trich = true
      if (trich) loai = 'trich'
    }
    cauHoi.push({ dau: tc.keoGach ? keoGachVe(nd, dau) : dau, hoi: i, tran, loai })
  }

  // Bước 4 — gom câu hỏi dồn. Mốc so = giờ ĐẦU TỪ (đúng cách v0 đã đo).
  const nhom: NhomHoi[] = []
  for (const q of cauHoi) {
    if (q.loai) continue
    const tr = nhom[nhom.length - 1]
    if (tr && tu[q.dau].tu - tu[tr.cac[tr.cac.length - 1].hoi].tu <= CHUOI_HOI_GIAY) {
      tr.cac.push(q)
      continue
    }
    nhom.push({ dau: q.dau, cac: [q] })
  }

  // Bước 5 — khối < 10 s gộp vào khối TRƯỚC. Độ dài tính tới đầu nhóm kế tiếp
  // GỐC (chưa gộp) — y như v0. Khối hỏi ĐẦU TIÊN không gộp vào "Mở đầu": gộp
  // vào đó là mất luôn câu hỏi khỏi danh sách.
  const tEnd = mocCuoi(nd)
  const giu: NhomHoi[] = []
  let soGopNgan = 0
  for (let k = 0; k < nhom.length; k++) {
    const t0 = tu[nhom[k].dau].tu
    const t1 = k + 1 < nhom.length ? tu[nhom[k + 1].dau].tu : tEnd
    if (t1 - t0 < KHOI_NGAN_GIAY && giu.length) {
      soGopNgan++
      continue
    }
    giu.push(nhom[k])
  }

  const ranhGioi = tu.length ? lamSachRanhGioi([0, ...giu.map((g) => g.dau)], tu.length) : [0]
  const nhomTheoDau = new Map<number, NhomHoi>()
  for (const g of nhom) if (!nhomTheoDau.has(g.dau)) nhomTheoDau.set(g.dau, g)

  const kq: PhanTich = { cauHoi, nhom, nhomTheoDau, ranhGioi, soGopNgan, tEnd }
  theoNd.set(khoa, kq)
  return kq
}

/** Mọi dấu `?` máy thấy, kèm lý do không mở khối — để chẩn đoán / gợi ý. */
export function timCauHoi(nd: NoiDung, tc?: Partial<TuyChonKhoi>): CauHoi[] {
  return phanTich(nd, tc).cauHoi.map((q) => ({ ...q }))
}

/** Số liệu chẩn đoán của lần chia tự động (bộ kiểm hồi quy đọc cái này). */
export function chanDoanKhoi(
  nd: NoiDung,
  tc?: Partial<TuyChonKhoi>,
): { hoi: number; ngan: number; duoi: number; trich: number; bia: number; tran: number; nhom: number; nhomNhieuHoi: number; gopNgan: number } {
  const pt = phanTich(nd, tc)
  const dem = (l: LoaiHoi) => pt.cauHoi.filter((q) => q.loai === l).length
  return {
    hoi: pt.cauHoi.length,
    ngan: dem('ngan'),
    duoi: dem('duoi'),
    trich: dem('trich'),
    bia: dem('bia'),
    tran: pt.cauHoi.filter((q) => q.tran && !q.loai).length,
    nhom: pt.nhom.length,
    nhomNhieuHoi: pt.nhom.filter((g) => g.cac.length > 1).length,
    gopNgan: pt.soGopNgan,
  }
}

/** Ranh giới hợp lệ: số nguyên, trong [0, n), tăng dần, không trùng, luôn có 0. */
function lamSachRanhGioi(ds: readonly number[], n: number): number[] {
  const tap = new Set<number>([0])
  for (const x of ds || []) if (Number.isInteger(x) && x > 0 && x < n) tap.add(x)
  return [...tap].sort((a, b) => a - b)
}

/** Máy tự chia. Tiêu đề / bỏ tay rỗng — trả một đối tượng MỚI mỗi lần gọi. */
export function timKhoi(nd: NoiDung, tc?: Partial<TuyChonKhoi>): ChiaKhoi {
  return { ranhGioi: phanTich(nd, tc).ranhGioi.slice(), tieuDeTay: {}, boTay: {} }
}

// ═══════════════════════════════ DỰNG KHỐI ═══════════════════════════════

/**
 * Mốc CẮT (giây SEQUENCE) của ranh giới đặt tại từ `i`.
 * - `i` là từ đầu câu Whisper → dùng mốc đầu CÂU: cách "ngắt đúng câu" Auto Cut
 *   Short đo lệch 0,000 s ngày 31/07. Mốc từ đầu câu có thể trễ tới 0,9 s so
 *   với mốc câu (Gnostic) — cắt theo mốc từ là xén mất hơi đầu câu.
 * - `i` giữa câu → chỉ có mốc ĐẦU từ (đệm không lưu mốc cuối từ) → cờ
 *   'ranh-gioi-can-nghe'. Khoảng hở tới từ liền trước đo được 0,27–0,91 s,
 *   CHƯA nghe kiểm bằng tai.
 */
function mocCat(nd: NoiDung, i: number): number {
  const w = nd.tu[i]
  const c = nd.cau[w.cau]
  if (c && c.tuDau === i) return Math.min(c.tu, w.tu)
  return w.tu
}

/** Ghép chữ các từ [a, b), bỏ token toàn dấu ở ĐẦU ("-" đổi lượt không phải lời). */
function vanBan(nd: NoiDung, a: number, b: number): string {
  let i = a
  while (i < b && !CO_CHU.test(nd.tu[i].chu)) i++
  const ra: string[] = []
  for (; i < b; i++) ra.push(nd.tu[i].chu)
  return ra.join(' ')
}

/** Câu (hoặc phần câu) không bịa đầu tiên trong [a, cuoi): trả [đầu, cuối+1) theo chỉ số từ. */
function cauKeTiep(nd: NoiDung, a: number, cuoi: number): [number, number] | null {
  let i = a
  while (i < cuoi) {
    const c = nd.cau[nd.tu[i].cau]
    const het = Math.min(c.tuCuoi, cuoi)
    if (!c.bia && het > i && CO_CHU.test(vanBan(nd, i, het))) return [i, het]
    i = Math.max(het, i + 1)
  }
  return null
}

const TIEU_DE_TU_TOI_DA = 12

function trichDoan(nd: NoiDung, a: number, b: number): string {
  const s = vanBan(nd, a, b).split(' ').filter(Boolean)
  return s.length > TIEU_DE_TU_TOI_DA ? s.slice(0, TIEU_DE_TU_TOI_DA).join(' ') + '…' : s.join(' ')
}

/**
 * Dựng danh sách khối từ trạng thái chia (nguồn chân lý) — gọi lại sau MỖI cú
 * sửa. Cờ 'sua-tay' so với lần máy tự chia trên cùng `nd` + cùng tuỳ chọn.
 *
 * Tiêu đề: tay > câu hỏi > "Mở đầu" (khối 0 không có câu hỏi) > trích đoạn đầu
 * khối (khối người dùng tự tách ở chỗ không có câu hỏi). ☠️ "Mở đầu" là chữ
 * GIAO DIỆN — bên vẽ phải cho qua `dich()` khi khối có cờ 'mo-dau' và không có
 * tiêu đề tay.
 */
export function lamKhoi(nd: NoiDung, chia: ChiaKhoi, tc?: Partial<TuyChonKhoi>): Khoi[] {
  const n = nd.tu.length
  if (!n) return []
  const pt = phanTich(nd, tc)
  const rg = lamSachRanhGioi(chia.ranhGioi, n)
  const tuDong = pt.ranhGioi
  const tapTuDong = new Set(tuDong)
  const tieuDeTay = chia.tieuDeTay || {}
  const boTay = chia.boTay || {}

  const ra: Khoi[] = []
  let j = 0 // con trỏ vào ranh giới tự động, để tìm "ranh giới máy kế tiếp"
  for (let k = 0; k < rg.length; k++) {
    const dau = rg[k]
    const cuoi = k + 1 < rg.length ? rg[k + 1] : n
    const tu = mocCat(nd, dau)
    const den = Math.max(tu, k + 1 < rg.length ? mocCat(nd, rg[k + 1]) : pt.tEnd)
    const g = pt.nhomTheoDau.get(dau)

    const cauHoi = g ? g.cac.map((q) => vanBan(nd, q.dau, q.hoi + 1)).join(' ') : ''
    let traLoiDau = ''
    let tieuDeMay = ''
    if (g) {
      const qCuoi = g.cac[g.cac.length - 1].hoi
      const tl = cauKeTiep(nd, qCuoi + 1, cuoi)
      traLoiDau = tl ? vanBan(nd, tl[0], tl[1]) : ''
      tieuDeMay = cauHoi
    } else if (dau === 0) {
      const tl = cauKeTiep(nd, 0, cuoi)
      traLoiDau = tl ? vanBan(nd, tl[0], tl[1]) : ''
      tieuDeMay = 'Mở đầu'
    } else {
      // Khối tự tách ở chỗ không có câu hỏi: câu đầu làm tiêu đề, câu sau làm
      // dòng xem nhanh — một thông điệp chỉ nói ở MỘT nơi.
      const c1 = cauKeTiep(nd, dau, cuoi)
      tieuDeMay = c1 ? trichDoan(nd, c1[0], c1[1]) : ''
      const c2 = c1 ? cauKeTiep(nd, c1[1], cuoi) : null
      traLoiDau = c2 ? vanBan(nd, c2[0], c2[1]) : ''
    }

    const co: CoKhoi[] = []
    if (dau === 0 && !g) co.push('mo-dau')
    if (den - tu > KHOI_DAI_GIAY) co.push('dai')
    const cDau = nd.cau[nd.tu[dau].cau]
    if (cDau && cDau.tuDau !== dau) co.push('ranh-gioi-can-nghe')
    if (g && g.cac.some((q) => q.tran)) co.push('khong-ro-dau-cau')
    while (j < tuDong.length && tuDong[j] <= dau) j++
    const tuDongKe = j < tuDong.length ? tuDong[j] : n
    const coTieuDeTay = Object.prototype.hasOwnProperty.call(tieuDeTay, dau)
    if (!tapTuDong.has(dau) || tuDongKe !== cuoi || coTieuDeTay) co.push('sua-tay')

    ra.push({
      dau,
      cuoi,
      tu,
      den,
      cauHoi,
      traLoiDau,
      tieuDe: coTieuDeTay ? tieuDeTay[dau] : tieuDeMay,
      co,
      bo: !!boTay[dau],
    })
  }
  return ra
}

// ═══════════════════════════════ SỬA TAY ═══════════════════════════════
// Cả bốn hàm THUẦN: không đụng vào `chia` truyền vào, trả đối tượng MỚI.
// Không có gì để đổi thì trả lại CHÍNH đối tượng cũ — giao diện so `===` để
// khỏi đẩy một bước hoàn tác rỗng lên ngăn xếp.

function boKhoa<T>(o: Record<number, T>, khoa: number): Record<number, T> {
  const ra: Record<number, T> = { ...o }
  delete ra[khoa]
  return ra
}

/** Gộp khối bắt đầu ở `dau` vào khối liền TRƯỚC. Tiêu đề / cờ bỏ của khối bị gộp mất theo. */
export function gopVoiTruoc(chia: ChiaKhoi, dau: number): ChiaKhoi {
  if (dau === 0 || chia.ranhGioi.indexOf(dau) < 0) return chia
  return {
    ranhGioi: chia.ranhGioi.filter((x) => x !== dau),
    tieuDeTay: boKhoa(chia.tieuDeTay || {}, dau),
    boTay: boKhoa(chia.boTay || {}, dau),
  }
}

/**
 * Tách khối tại từ `tuIdx` (từ đó thành đầu khối mới). Khối cha đang bị BỎ thì
 * nửa mới cũng bị bỏ — tách một khối đã bỏ mà nửa sau tự "sống lại" là bất ngờ.
 * Không biết số từ nên không chặn chỉ số vượt cuối — `lamKhoi` tự bỏ qua.
 */
export function tachTai(chia: ChiaKhoi, tuIdx: number): ChiaKhoi {
  if (!Number.isInteger(tuIdx) || tuIdx <= 0 || chia.ranhGioi.indexOf(tuIdx) >= 0) return chia
  const ranhGioi = [...chia.ranhGioi, tuIdx].sort((a, b) => a - b)
  let cha = 0
  for (const x of chia.ranhGioi) if (x < tuIdx && x > cha) cha = x
  const boTay = { ...(chia.boTay || {}) }
  if (boTay[cha]) boTay[tuIdx] = true
  return { ranhGioi, tieuDeTay: { ...(chia.tieuDeTay || {}) }, boTay }
}

/** Đổi tiêu đề khối. Chuỗi rỗng = trả về tiêu đề máy đặt. */
export function doiTieuDe(chia: ChiaKhoi, dau: number, ten: string): ChiaKhoi {
  if (chia.ranhGioi.indexOf(dau) < 0) return chia
  const t = String(ten ?? '').trim()
  const cu = chia.tieuDeTay || {}
  const coCu = Object.prototype.hasOwnProperty.call(cu, dau)
  if (!t) {
    if (!coCu) return chia
    return { ranhGioi: chia.ranhGioi.slice(), tieuDeTay: boKhoa(cu, dau), boTay: { ...(chia.boTay || {}) } }
  }
  if (coCu && cu[dau] === t) return chia
  return { ranhGioi: chia.ranhGioi.slice(), tieuDeTay: { ...cu, [dau]: t }, boTay: { ...(chia.boTay || {}) } }
}

/** Bật / tắt "bỏ khối này" (không đặt marker, không tạo sequence). */
export function batBo(chia: ChiaKhoi, dau: number): ChiaKhoi {
  if (chia.ranhGioi.indexOf(dau) < 0) return chia
  const cu = chia.boTay || {}
  const boTay = cu[dau] ? boKhoa(cu, dau) : { ...cu, [dau]: true }
  return { ranhGioi: chia.ranhGioi.slice(), tieuDeTay: { ...(chia.tieuDeTay || {}) }, boTay }
}

// ═══════════════════════════ CHỌN / BỎ CHỌN CẢ DANH SÁCH ═══════════════════════════
//
// Pill "Chọn tất cả (31)" ở đầu danh sách khối cần BA thứ, và cả ba phải ra từ
// MỘT hàm: nhãn (chọn tất cả / bỏ chọn), con số trên nhãn, và việc cú bấm làm.
// Tách hai chỗ tính là có ngày nhãn nói "Bỏ chọn" mà cú bấm lại đi chọn thêm.
//
// Hai luật đã cân nhắc:
// - Khối ĐÃ BỎ (`bo`) không chọn được (ô tích của nó `disabled`) nên KHÔNG tính
//   vào mẫu số, và không bao giờ bị thêm vào — mẫu số phải là số khối bấm được
//   (bài 5k-bis: tỉ lệ không có mẫu số đúng là ba con số đội lốt một).
// - Chỉ đụng các khối ĐANG HIỆN (danh sách đã lọc theo ô tìm). Khối đang chọn mà
//   ô tìm che thì giữ nguyên: lọc rồi bấm "Bỏ chọn" không được âm thầm bỏ thứ
//   người dùng không nhìn thấy.

/** Ba trạng thái của pill chọn-tất-cả, kèm đủ số để viết nhãn. */
export interface TrangThaiChon {
  /** Số khối CHỌN ĐƯỢC đang hiện (bỏ qua khối `bo`) — mẫu số của nhãn. */
  tong: number
  /** Trong số đó, bao nhiêu đang tích chọn. */
  daChon: number
  /**
   * 'khong' = không có khối nào chọn được (pill khoá) · 'trong' = chưa chọn khối
   * nào · 'nua' = chọn một phần (phải nhìn ra được) · 'het' = chọn hết.
   */
  muc: 'khong' | 'trong' | 'nua' | 'het'
}

export function trangThaiChon(
  khoiHien: readonly Khoi[],
  chon: readonly number[] | ReadonlySet<number>,
): TrangThaiChon {
  const co: ReadonlySet<number> = chon instanceof Set ? chon : new Set(chon as readonly number[])
  let tong = 0
  let daChon = 0
  for (const k of khoiHien) {
    if (k.bo) continue
    tong++
    if (co.has(k.dau)) daChon++
  }
  return { tong, daChon, muc: tong === 0 ? 'khong' : daChon === 0 ? 'trong' : daChon >= tong ? 'het' : 'nua' }
}

/**
 * Bấm pill: chưa chọn hết thì CHỌN HẾT, đang chọn hết thì BỎ HẾT (một hàm, đảo
 * trạng thái). Trả mảng `chon` MỚI; không đổi gì thì trả CHÍNH mảng cũ để bên
 * gọi khỏi vẽ lại (cùng lối với gopVoiTruoc / tachTai).
 */
export function daoChonHet(khoiHien: readonly Khoi[], chon: readonly number[]): number[] {
  const tt = trangThaiChon(khoiHien, chon)
  if (tt.muc === 'khong') return chon as number[]
  const co = new Set(chon)
  const truoc = co.size
  for (const k of khoiHien) {
    if (k.bo) continue
    if (tt.muc === 'het') co.delete(k.dau)
    else co.add(k.dau)
  }
  if (co.size === truoc) return chon as number[]
  return Array.from(co)
}

// ═══════════════════════════════ TÌM CHỮ + MỐC HIỆN ═══════════════════════════════

/**
 * Bỏ dấu tiếng Việt + chữ thường, để gõ "khong" tìm ra "không".
 * `đ` không phải chữ có dấu tổ hợp (NFD không tách được) nên phải đổi tay.
 */
export function boDau(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

const _demTim = new WeakMap<NoiDung, string[]>()

/** Chỉ số các câu chứa chuỗi (so không dấu, không phân biệt hoa thường). Rỗng → []. */
export function timChu(nd: NoiDung, chuoi: string): number[] {
  const q = boDau(chuoi).trim()
  if (!q) return []
  let ds = _demTim.get(nd)
  if (!ds) {
    ds = nd.cau.map((c) => boDau(c.chu))
    _demTim.set(nd, ds)
  }
  const ra: number[] = []
  for (let i = 0; i < ds.length; i++) if (ds[i].indexOf(q) >= 0) ra.push(i)
  return ra
}

/** 'm:ss' hoặc 'h:mm:ss'. Làm TRÒN XUỐNG giây như đồng hồ đầu đọc (59,9 s vẫn là 0:59). */
export function mocHienThi(giay: number): string {
  const g = Number.isFinite(giay) && giay > 0 ? Math.floor(giay + 1e-9) : 0
  const h = Math.floor(g / 3600)
  const m = Math.floor((g % 3600) / 60)
  const s = g % 60
  const hai = (x: number) => (x < 10 ? '0' : '') + x
  return h > 0 ? `${h}:${hai(m)}:${hai(s)}` : `${m}:${hai(s)}`
}
