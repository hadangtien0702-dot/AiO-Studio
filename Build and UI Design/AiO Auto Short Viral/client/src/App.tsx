/**
 * App.tsx — AiO Auto Short Viral. "Bàn dựng trên giấy" (paper edit) ngay trong
 * panel Premiere.
 *
 * Luồng người dùng (anh Tiến giao 18/09):
 *   chọn clip (hoặc khoanh In/Out) → bấm "Đọc nội dung" → thấy từng câu đang
 *   nói gì (bấm câu = đầu đọc nhảy tới) → máy tự chia KHỐI HỎI–ĐÁP → gộp /
 *   tách / đổi tên / bỏ khối → đặt MARKER, hoặc TẠO SEQUENCE MỚI (mỗi khối một
 *   sequence, hoặc gộp các khối vào một sequence).
 *
 * Luật của anh Tiến áp ở đây:
 * - MỘT nút chính mỗi màn hình: trước khi đọc là "Đọc nội dung"; sau khi đọc
 *   là "Tạo sequence" ở thanh đáy. Nút chính vừa là nút vừa là đèn (xanh = xong).
 * - Lúc chạy KHÔNG lộ quy trình: chỉ "Đang xử lý… N%" + đồng hồ (13/08).
 *   Việc ăn tài nguyên (whisper) luôn có nút Dừng.
 * - Tool ĐỒNG HÀNH (19/08): hỏi Premiere mỗi 1 giây — đổi sequence / vùng /
 *   clip chọn thì panel đổi theo; vùng đổi sau khi đã đọc thì báo "Vùng đã
 *   đổi — đọc lại". NGƯNG hỏi khi đang chạy việc (ExtendScript một luồng).
 * - Chỉ báo khi THẤT BẠI (hoặc có con số cần soát); việc thành công đã thấy
 *   trên nút thì im lặng. Không để mã lỗi thô lên màn hình.
 * - Xoá marker phải nói hậu quả bằng SỐ THẬT (đếm lại ngay lúc bấm). Đặt marker
 *   cũng vậy — host thay marker cũ của panel, nên có marker cũ là HỎI bằng số trước.
 *
 * MƯỢT (anh giao "cực kỳ mượt"):
 * - Đầu đọc đi qua DOM, KHÔNG qua state: mỗi giây chỉ đổi thuộc tính
 *   `data-phat` trên 1–3 phần tử, danh sách 2.000 câu không bị vẽ lại.
 * - Danh sách dài dùng `content-visibility: auto` (styles.css) + `memo`.
 * - Không tự cuộn giật: chỉ bám đầu đọc khi người dùng đang "đi theo" (chỗ đang
 *   phát còn trong khung nhìn), không có menu / ô sửa / hộp hỏi đang mở, và 4 giây
 *   gần nhất không lăn chuột / bấm / gõ trong danh sách.
 *
 * Tất cả trạng thái chia khối nằm trong `ChiaKhoi` (hợp đồng kieu.ts) — gộp /
 * tách / đổi tên / bỏ là hàm THUẦN của hoidap.ts trả bản mới, nên hoàn tác chỉ
 * là một ngăn xếp các bản cũ.
 */

import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { dich } from './ngonngu'
import {
  isInHost,
  napLaiHost,
  loiNapHost,
  dsSequence,
  docVung,
  docVungLam,
  nhayToi,
  viTriDauDoc,
  datMarker,
  demMarker,
  xoaMarker,
  taoSequence,
  noiTiepSequence,
  laViecCanLam,
} from './lib/cep'
import type { HostLoi, KetQuaDung, SeqMuc } from './lib/cep'
import { layBanNghe, kiemBoMay, donTamCu } from './services/nghe'
import { taoCoHuy } from './services/ffmpeg'
import type { CoHuy } from './services/ffmpeg'
import { chonClipNghe, dungNoiDung, doanDung, lanDung, LOI_LECH_TU } from './services/moc'
import {
  timKhoi,
  lamKhoi,
  gopVoiTruoc,
  tachTai,
  doiTieuDe,
  batBo,
  timChu,
  mocHienThi,
  trangThaiChon,
  daoChonHet,
} from './services/hoidap'
import { soLieuLoi, xuatSrt, xuatTxt, dongTxt, tenFileSach } from './services/xuat'
import { chepChu, ghiCanhMedia, taiVe } from './services/luuRa'
import type { BanNghe, ChiaKhoi, CauSeq, DoanNguon, Khoi, NguonNghe, NoiDung, VungLam } from './services/kieu'
import { ThanhTren, DongNguon } from './ui/ThanhTren'
import type { NguonHien } from './ui/ThanhTren'
import { DangChay } from './ui/DangChay'
import { DsKhoi, PillChon } from './ui/DsKhoi'
import { DsLoi, DauLoi } from './ui/DsLoi'
import type { NhanKhoiCau } from './ui/DsLoi'
import { MenuKhoi } from './ui/MenuKhoi'
import type { ViTriMenu } from './ui/MenuKhoi'
import { ThanhHanhDong, DongThongBao } from './ui/ThanhHanhDong'
import type { CheDoTao, ThongBao } from './ui/ThanhHanhDong'
import { thamSoDem, docDemThu } from './ui/cheDoThu'
import { Ic, dongHo, dp, laHuy, rutGon, tenKhoi, thanhLoi } from './ui/chung'

/**
 * Vùng câu đang chọn ở tab "Toàn bộ lời" — một KHOẢNG id câu LIỀN NHAU.
 * `neo` = câu bấm đầu tiên (Shift+bấm kéo từ đó ra hai phía). id câu = chỉ số
 * trong `NoiDung.cau` (moc.ts đặt `id` bằng chính chỉ số — bộ kiểm mục (7) giữ
 * bất biến đó, vì ở đây cắt mảng bằng chỉ số).
 */
interface VungCau {
  neo: number
  dau: number
  cuoi: number
}

/** Chỗ lấy lựa chọn cho thanh đáy: thẻ khối, hay vùng câu ở tab "Toàn bộ lời". */
type NguonChon = 'khoi' | 'cau'

/** Một lần đọc nội dung của MỘT sequence — giữ theo ID trong suốt phiên panel. */
interface Phien {
  seqId: string
  seqName: string
  vung: VungLam
  /** Clip không có file gốc (title, sequence lồng, clip multicam source) bị bỏ — host đếm, VungLam chưa có trường. */
  soKhongFile: number
  nd: NoiDung
  nguonNghe: NguonNghe[]
  chia: ChiaKhoi
  /** Ngăn xếp hoàn tác: các bản ChiaKhoi TRƯỚC mỗi lần sửa. */
  lui: ChiaKhoi[]
  /** Khoá `dau` của các khối đang tích chọn. */
  chon: number[]
  /**
   * Vùng câu đang chọn ở tab "Toàn bộ lời". Nằm trong Phien (kho tầng module),
   * KHÔNG trong useState: đổi ngôn ngữ là React dựng lại App, state về 0 — mà
   * vùng chọn này là việc người dùng vừa làm bằng tay (xem khung "KHO PHIÊN").
   */
  chonCau: VungCau | null
  /** Dấu vân tay vùng (`khoaVung`) lúc đọc — lệch với hiện tại = "Vùng đã đổi". */
  mocVung: string
}

interface ViecChay {
  viec: 'doc' | 'tao' | 'marker'
  batDau: number
  phanTram: number
}

/** Một việc dựng sequence: nhãn ngắn (để báo lỗi đúng chỗ) · tên sequence · các đoạn gốc. */
interface ViecDung {
  nhan: string
  ten: string
  doan: DoanNguon[]
  /**
   * Khoá `dau` của khối sinh ra việc này — để tô thẻ khối đang được đưa vào
   * sequence. -1 = không phải từ khối (vùng câu ở tab "Toàn bộ lời").
   */
  dau: number
}

/**
 * Đang đưa khối nào vào sequence — dòng đếm trên thanh tiến độ + thẻ nào sáng lên.
 * ☠️ `dau` đi tới DOM bằng thuộc tính (`veDangDua`), KHÔNG xuống props: danh sách
 * có thể vài trăm thẻ, đổi prop là vẽ lại cả danh sách cho mỗi khối (đúng bài học
 * 21/09 của đầu đọc và vùng chọn).
 */
interface DangDua {
  dau: number
  /** Khối thứ mấy (1-based) trên tổng. */
  i: number
  n: number
}

/** Kết quả vừa làm xong cho ĐÚNG lựa chọn đang có (khoá = `kyHieu`). */
interface DaXong {
  n: number
  khoa: string
}

const LUI_TOI_DA = 100
const KHOA_CHE_DO_TAO = 'aio-shortviral-chedotao'
/** Người dùng cuộn tay trong chừng này ms gần nhất thì KHÔNG tự cuộn theo đầu đọc. */
const NGHI_BAM_THEO = 4000

// ═══ HÀM THUẦN NHỎ ════════════════════════════════════════════════════════

/**
 * Vân tay của VÙNG đang chọn — so với lúc đọc để biết "Vùng đã đổi".
 * ⚠️ Chế độ "clip đang chọn" chỉ biết SỐ clip (docVung đọc nhẹ, không liệt kê
 * clip) → đổi sang clip khác cùng số lượng thì chưa nhận ra. Ghi ở báo cáo.
 * (Đọc theo clip chọn rồi BỎ chọn thì bên gọi không coi là đổi — xem `vungDoi`.)
 */
function khoaVung(v: NguonHien | null): string {
  if (!v) return ''
  if (v.soChon > 0) return 'chon:' + v.soChon
  if (v.vao >= 0 && v.ra > v.vao) return 'io:' + v.vao.toFixed(2) + '-' + v.ra.toFixed(2)
  return 'trong'
}

function giongDs(a: SeqMuc[], b: SeqMuc[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i].id !== b[i].id || a[i].ten !== b[i].ten || a[i].dangMo !== b[i].dangMo) return false
  return true
}

/**
 * Dung sai khi tìm câu/khối tại vị trí đầu đọc: MỘT khung hình (+1 ms).
 * ☠️ Vì sao (soát 19/09): Premiere bắt đầu đọc về lưới khung hình (skill 18e) nên
 * vị trí đọc lại có thể đứng TRƯỚC mốc đầu câu vài mili-giây → so chặt `tu <= t`
 * là tô sáng câu ĐỨNG TRƯỚC câu vừa bấm. Tính trên 803 câu thật (Machine): 29,97
 * fps làm tròn → 425/803 câu bị tô sai; cắt xuống → 801/803. Nửa khung không đủ
 * cho kiểu cắt xuống, nên dùng cả khung. CHƯA ĐO getPlayerPosition bắt lưới kiểu nào.
 */
function dungSaiDauDoc(fps: number): number {
  return 1 / (fps > 0 ? fps : 30) + 1e-3
}

/** Câu đang phát tại giây `t` (tìm nhị phân — `nd.cau` đã sắp theo thời gian). */
function timCauTai(cau: CauSeq[], t: number): number {
  let lo = 0
  let hi = cau.length - 1
  let kq = -1
  while (lo <= hi) {
    const giua = (lo + hi) >> 1
    if (cau[giua].tu <= t) {
      kq = giua
      lo = giua + 1
    } else hi = giua - 1
  }
  // Rơi vào khoảng lặng dài sau câu thì không tô câu nào (1 giây dung sai cho
  // mốc cuối câu của Whisper hay hụt).
  if (kq < 0 || t > cau[kq].den + 1) return -1
  return cau[kq].id
}

function timKhoiTai(khoi: Khoi[], t: number): number {
  let lo = 0
  let hi = khoi.length - 1
  let kq = -1
  while (lo <= hi) {
    const giua = (lo + hi) >> 1
    if (khoi[giua].tu <= t) {
      kq = giua
      lo = giua + 1
    } else hi = giua - 1
  }
  if (kq < 0 || t > khoi[kq].den + 0.5) return -1
  return khoi[kq].dau
}

/** Đánh số khối: "Q1, Q2…" theo thứ tự; khối Mở đầu không có số. */
function danhSo(khoi: Khoi[]): Map<number, string> {
  const m = new Map<number, string>()
  let n = 0
  for (const k of khoi) m.set(k.dau, k.co.indexOf('mo-dau') >= 0 ? '' : 'Q' + ++n)
  return m
}

/**
 * Các câu của vùng chọn ở tab "Toàn bộ lời", hoặc CẢ BÀI khi chưa chọn gì.
 * Kẹp theo độ dài mảng thật (phiên cũ có thể giữ vùng của bản nghe trước).
 */
function vungCauDs(p: Phien): CauSeq[] {
  const v = p.chonCau
  if (!v || !p.nd.cau.length) return p.nd.cau
  const a = Math.max(0, Math.min(v.dau, p.nd.cau.length - 1))
  const b = Math.max(a, Math.min(v.cuoi, p.nd.cau.length - 1))
  return p.nd.cau.slice(a, b + 1)
}

/** Mốc [đầu, cuối] trên SEQUENCE của một dãy câu — `den` lấy MAX (mốc cuối không nhất thiết tăng dần). */
function mocDsCau(ds: readonly CauSeq[]): [number, number] {
  if (!ds.length) return [0, 0]
  let tu = ds[0].tu
  let den = ds[0].den
  for (const c of ds) {
    if (c.tu < tu) tu = c.tu
    if (c.den > den) den = c.den
  }
  return [tu, Math.max(den, tu)]
}

/** File media đóng góp NHIỀU CÂU NHẤT trong dãy — chỗ để ghi file xuất ra cạnh nó. */
function mediaChinh(ds: readonly CauSeq[]): string {
  const dem = new Map<string, number>()
  for (const c of ds) if (c.path) dem.set(c.path, (dem.get(c.path) ?? 0) + 1)
  let ra = ''
  let nhieu = 0
  for (const [p, n] of dem) {
    if (n > nhieu) {
      nhieu = n
      ra = p
    }
  }
  return ra
}

/** Khoảng id câu của một khối (khối có thể mở đầu / kết thúc GIỮA câu). */
function khoangCau(nd: NoiDung, k: Khoi): [number, number] {
  if (k.cuoi <= k.dau || k.dau >= nd.tu.length) return [0, -1]
  return [nd.tu[k.dau].cau, nd.tu[Math.min(k.cuoi, nd.tu.length) - 1].cau]
}

/**
 * % hiện trên thanh. nghe.ts đã trả % của CẢ LƯỢT (mọi file, chia theo dung
 * lượng, chỉ tăng) — KHÔNG chia lại theo `fileThu` ở đây, chia hai lần là thanh
 * nhảy lùi khi sang file sau. Số âm = chưa đo được → vệt sáng trôi.
 */
function phanTramTong(t: { phanTram: number }): number {
  if (!Number.isFinite(t.phanTram) || t.phanTram < 0) return -1
  return Math.min(100, t.phanTram)
}

/**
 * Vân tay của "đúng lựa chọn đang có" — nút xanh "Đã tạo N sequence" chỉ còn
 * đúng khi vân tay không đổi. Phải có CẢ vùng câu và CẢ nguồn chọn đang dùng:
 * tạo sequence từ một vùng câu rồi kéo vùng khác mà nút vẫn xanh là nói dối.
 */
function kyHieu(p: Phien, nguon: NguonChon, them: string): string {
  const vc = p.chonCau
  return (
    p.seqId +
    '|' +
    nguon +
    '|' +
    [...p.chon].sort((a, b) => a - b).join(',') +
    '|' +
    (vc ? vc.dau + '-' + vc.cuoi : '') +
    '|' +
    p.chia.ranhGioi.join(',') +
    '|' +
    JSON.stringify(p.chia.tieuDeTay) +
    '|' +
    them
  )
}

function docCheDoTao(): CheDoTao {
  try {
    return localStorage.getItem(KHOA_CHE_DO_TAO) === 'gop' ? 'gop' : 'moi-khoi'
  } catch {
    return 'moi-khoi'
  }
}

function ghiCheDoTao(c: CheDoTao): void {
  try {
    localStorage.setItem(KHOA_CHE_DO_TAO, c)
  } catch {
    /* không lưu được thì lần sau về mặc định — không hại gì */
  }
}

/** Menu "⋯" mở xuống; sát đáy panel thì mở lên. */
function viTriMenu(nut: HTMLElement): ViTriMenu {
  const r = nut.getBoundingClientRect()
  const phai = Math.max(8, window.innerWidth - r.right)
  const caoUoc = 150
  if (r.bottom + caoUoc > window.innerHeight - 8) return { phai, duoi: window.innerHeight - r.top + 4 }
  return { phai, tren: r.bottom + 4 }
}

const CHI_TRONG_PREMIERE = (): ThongBao => ({ loai: 'canh', loi: { chu: dich('Chỉ chạy trong Premiere'), chiTiet: '' } })

/**
 * "Nghe lại" của App ĐANG GẮN — nút trong dòng thông báo gọi qua đây. Thông báo
 * nằm ở KHO (sống qua lần đổi ngôn ngữ), nên nó không được giữ hàm của một App
 * đã bị React vứt đi; App mới gán lại biến này mỗi lần vẽ.
 */
let ngheLaiHienTai: (() => void) | null = null

/** Mã lỗi của nghe.ts mà thật ra là VIỆC người dùng phải làm (cài thêm, cắm ổ). */
const VIEC_CAN_LAM_NGHE = new Set(['THIEU_BO_MAY', 'MAT_FILE'])

/**
 * Lỗi → dòng thông báo. Việc người dùng CẦN LÀM (chưa khoanh vùng, chưa cài bộ
 * nghe…) tô VÀNG, không tô đỏ — luật anh Tiến: chỉ báo động khi hỏng thật
 * (`laViecCanLam` của cep.ts giữ danh sách mã).
 */
function thongBaoLoi(e: unknown): ThongBao {
  let canLam = false
  if (e && typeof e === 'object') {
    const ma = (e as { ma?: unknown }).ma
    if ('thongDiep' in e) canLam = laViecCanLam(e as HostLoi)
    else if (typeof ma === 'string') canLam = VIEC_CAN_LAM_NGHE.has(ma)
  }
  const tb: ThongBao = { loai: canLam ? 'canh' : 'loi', loi: thanhLoi(e) }
  // Bản nghe lệch (moc.ts LOI_LECH_TU): câu bảo "Bấm Nghe lại" → nút phải nằm
  // ngay cạnh câu (soát 19/09: ở màn bắt đầu không có nút nào như vậy — kẹt mãi).
  if (e && typeof e === 'object' && (e as { khoa?: unknown }).khoa === LOI_LECH_TU) {
    tb.hanhDong = { nhan: dich('Nghe lại'), lam: () => ngheLaiHienTai?.() }
  }
  return tb
}

// ═══ KHO PHIÊN — SỐNG QUA LẦN ĐỔI NGÔN NGỮ ════════════════════════════════
//
// ☠️ VÌ SAO KHÔNG ĐỂ TRONG useState: `NhaNgonNgu` (ngonngu.tsx) đặt `key={L}`
// cho cả cây — ĐỔI NGÔN NGỮ là React vứt App rồi dựng lại, mọi state về 0.
// Đo 19/09 trên trình duyệt (chế độ thử): chọn hết 20 khối → bấm EN/VI →
// "Đã chọn 0 khối", khối đã gộp/tách mất sạch. Và ngôn ngữ còn đổi được TỪ
// PANEL KHÁC (file chung đọc lại mỗi 2 giây) — tức người dùng đổi tiếng ở
// Autocut là mất bàn dựng ở đây, kể cả đang giữa lượt nghe 20 phút.
//
// Nên mọi thứ phải SỐNG QUA lần dựng lại nằm ở tầng module: nội dung đã đọc
// (theo từng sequence), lựa chọn, ngăn hoàn tác, việc đang chạy + cờ dừng,
// thông báo, trạng thái "đã xong". App chỉ ĐỌC từ đây khi vẽ; mọi lần ghi đi
// qua `dat()` rồi báo cho App đang gắn vẽ lại. Một hàm async do App CŨ khởi
// động (đang nghe) vẫn ghi vào đúng kho này → App MỚI thấy tiến độ và kết quả.
//
// Thứ chỉ là cách nhìn (thẻ đang xem, khối đang mở rộng, ô tìm) thì để state
// thường — mất khi đổi tiếng cũng không hại gì.

interface Kho {
  phienTheoSeq: Map<string, Phien>
  seqId: string
  /** Tab sequence Premiere đang mở ở nhịp trước — đổi thì panel đi theo. */
  act: string
  dsSeq: SeqMuc[]
  nguon: NguonHien | null
  chay: ViecChay | null
  dangDung: boolean
  thongBao: ThongBao | null
  soMarker: number
  daTao: DaXong | null
  daDat: DaXong | null
  huy: CoHuy | null
  dungTao: boolean
  /** Khối đang được đưa vào sequence (null = không dựng gì). */
  dua: DangDua | null
}

const KHO: Kho = {
  phienTheoSeq: new Map(),
  seqId: '',
  act: '',
  dsSeq: [],
  nguon: null,
  chay: null,
  dangDung: false,
  thongBao: null,
  soMarker: -1,
  daTao: null,
  daDat: null,
  huy: null,
  dungTao: false,
  dua: null,
}
const _veLai = new Set<() => void>()
function phat(): void {
  _veLai.forEach((f) => f())
}
type GiaTriHoacHam<T> = T | ((cu: T) => T)
/**
 * Ghi một ô của kho rồi báo vẽ lại. Giá trị không đổi thì KHÔNG báo — nhịp thăm
 * dò gọi setDsSeq mỗi giây, báo vô cớ là vẽ lại App mỗi giây.
 * `luonBao`: cho ô mà thân App hay gán qua "ref" TRƯỚC rồi mới gọi setter
 * (`chayRef.current = viec; setChay(viec)`) — lúc setter chạy giá trị đã bằng
 * nhau, không ép báo thì màn hình đứng ở trạng thái cũ (thanh "Đang xử lý"
 * không bao giờ tắt).
 */
function datKho<K extends keyof Kho>(k: K, v: GiaTriHoacHam<Kho[K]>, luonBao = false): void {
  const moi = typeof v === 'function' ? (v as (cu: Kho[K]) => Kho[K])(KHO[k]) : v
  if (moi === KHO[k] && !luonBao) return
  KHO[k] = moi
  phat()
}
// Cùng TÊN với setter của useState trước đây — thân App gọi y như cũ.
const setDsSeq = (v: GiaTriHoacHam<SeqMuc[]>) => datKho('dsSeq', v)
const setSeqId = (v: string) => datKho('seqId', v, true)
const setNguon = (v: NguonHien | null) => datKho('nguon', v)
const setChay = (v: GiaTriHoacHam<ViecChay | null>) => datKho('chay', v, true)
const setDangDung = (v: boolean) => datKho('dangDung', v)
const setThongBao = (v: ThongBao | null) => datKho('thongBao', v)
const setSoMarker = (v: number) => datKho('soMarker', v)
const setDaTao = (v: DaXong | null) => datKho('daTao', v)
const setDaDat = (v: DaXong | null) => datKho('daDat', v)
const setDua = (v: DangDua | null) => datKho('dua', v)
/** Phiên là giá trị SUY RA (map + seqId) — "đặt" nó chỉ là báo App vẽ lại. */
const setPhien = (_p: Phien | null) => phat()
// "Ref" trỏ thẳng vào kho: đọc luôn ra giá trị MỚI NHẤT, kể cả trong hàm async
// do App cũ khởi động. Giữ tên `.current` để thân App không phải viết lại.
const seqIdRef = {
  get current() {
    return KHO.seqId
  },
  set current(v: string) {
    KHO.seqId = v
  },
}
const phienRef = {
  get current(): Phien | null {
    return KHO.phienTheoSeq.get(KHO.seqId) ?? null
  },
  set current(_v: Phien | null) {
    /* suy ra từ phienTheoSeq + seqId — ghi vào map qua luuPhien */
  },
}
const phienTheoSeq = { current: KHO.phienTheoSeq }
const chayRef = {
  get current() {
    return KHO.chay
  },
  set current(v: ViecChay | null) {
    KHO.chay = v
  },
}
const huyRef = {
  get current() {
    return KHO.huy
  },
  set current(v: CoHuy | null) {
    KHO.huy = v
  },
}
const dungTaoRef = {
  get current() {
    return KHO.dungTao
  },
  set current(v: boolean) {
    KHO.dungTao = v
  },
}
const actRef = {
  get current() {
    return KHO.act
  },
  set current(v: string) {
    KHO.act = v
  },
}

// ═══ APP ══════════════════════════════════════════════════════════════════

export default function App() {
  const trongHost = useMemo(() => isInHost(), [])
  // ☠️ Chế độ thử CHỈ ngoài Premiere — trong Premiere bỏ qua `?dem` hoàn toàn.
  const demThu = useMemo(() => (trongHost ? '' : thamSoDem()), [trongHost])
  const cheDoThu = demThu !== ''

  // Vẽ lại khi kho đổi (kể cả do hàm async của lần dựng TRƯỚC ghi vào).
  const [, veLai] = useReducer((x: number) => x + 1, 0)
  useEffect(() => {
    _veLai.add(veLai)
    return () => {
      _veLai.delete(veLai)
    }
  }, [])
  const { dsSeq, seqId, nguon, chay, dangDung, thongBao, soMarker, daTao, daDat, dua } = KHO
  const phien = phienRef.current

  const [boMay, setBoMay] = useState('')
  const [tab, setTab] = useState<'khoi' | 'loi'>('khoi')
  const [oTim, setOTim] = useState('')
  // Gõ tìm thì ô nhập đi ngay, còn lọc danh sách đi sau (React ưu tiên phím gõ).
  const q = useDeferredValue(oTim.trim())
  const [moRong, setMoRong] = useState<Set<number>>(() => new Set())
  /** id các câu đang bung xem từng từ (tab "Toàn bộ lời") — chỉ là cách nhìn, mất khi đổi tiếng cũng không sao. */
  const [moCau, setMoCau] = useState<Set<number>>(() => new Set())
  /** Số câu vừa chép xong — nút "Chép" làm đèn báo trong ~2,5 giây (chép xong KHÔNG thấy gì nếu không báo). */
  const [daChep, setDaChep] = useState<number | null>(null)
  const [tro, setTro] = useState<number | null>(null)
  const [dangSua, setDangSua] = useState<number | null>(null)
  const [menu, setMenu] = useState<{ dau: number; viTri: ViTriMenu; nut: HTMLElement } | null>(null)
  const [cheDoTao, setCheDoTao] = useState<CheDoTao>(docCheDoTao)
  const [xacNhanXoa, setXacNhanXoa] = useState<number | null>(null)
  const [xacNhanDocLai, setXacNhanDocLai] = useState<boolean | null>(null)
  /** Đang hỏi trước khi đặt marker: số marker cũ của panel sẽ bị thay (đếm lại lúc bấm). */
  const [xacNhanMarker, setXacNhanMarker] = useState<number | null>(null)

  // ── Ref cho các hàm gọi lại ổn định (không làm memo của danh sách vỡ) ──
  // (seqIdRef, phienRef, chayRef, huyRef, dungTaoRef, actRef: ở KHO phía trên.)
  const tabRef = useRef(tab)
  tabRef.current = tab
  const troRef = useRef(tro)
  troRef.current = tro
  /** Lệnh host ngắn đang bay (nhảy, đếm marker) — nhịp thăm dò nhường. */
  const banRef = useRef(0)
  const nguonKhoaRef = useRef('')
  const soiRef = useRef<(() => void) | null>(null)
  const thanRef = useRef<HTMLElement>(null)
  const congCuRef = useRef<HTMLDivElement>(null)
  const phatRef = useRef({ cau: -1, khoi: -1 })
  const nguoiCuonRef = useRef(0)
  /** Đồng hồ tắt đèn "vừa chép" của một dòng câu (đèn đặt thẳng lên DOM). */
  const vuaChepRef = useRef(0)
  /**
   * Đang có menu / ô sửa tên / hộp xác nhận → KHÔNG tự cuộn theo đầu đọc. Soát
   * 19/09 (bản build, chế độ thử): menu "⋯" đang mở, đầu đọc sang khối cuối →
   * danh sách nhảy 0 → 2.272,8 px và menu tự đóng (MenuKhoi đóng khi có cuộn).
   */
  const khongBamRef = useRef(false)
  khongBamRef.current =
    menu !== null || dangSua !== null || xacNhanXoa !== null || xacNhanDocLai !== null || xacNhanMarker !== null
  /** Thông báo "host hỏng" do vòng thăm dò đặt — để tự xoá khi Premiere trả lời lại. */
  const tbNapRef = useRef<ThongBao | null>(null)
  const lanDemMarkerRef = useRef(0)

  // ── Khối + đánh số + tìm ──────────────────────────────────────────────
  const khoi = useMemo(() => (phien ? lamKhoi(phien.nd, phien.chia) : []), [phien?.nd, phien?.chia])
  const khoiRef = useRef(khoi)
  khoiRef.current = khoi
  const nhanSo = useMemo(() => danhSo(khoi), [khoi])
  const khop = useMemo(() => (phien && q ? new Set(timChu(phien.nd, q)) : null), [phien?.nd, q])
  const soKhop = useMemo(() => {
    if (!khop || !phien) return null
    const m = new Map<number, number>()
    for (const k of khoi) {
      const [a, b] = khoangCau(phien.nd, k)
      let n = 0
      for (let i = a; i <= b; i++) if (khop.has(i)) n++
      m.set(k.dau, n)
    }
    return m
  }, [khop, khoi, phien?.nd])
  const khoiHien = useMemo(() => (soKhop ? khoi.filter((k) => (soKhop.get(k.dau) ?? 0) > 0) : khoi), [khoi, soKhop])
  const khoiHienRef = useRef(khoiHien)
  khoiHienRef.current = khoiHien
  const chonSet = useMemo(() => new Set(phien?.chon ?? []), [phien?.chon])
  const khoiChon = useMemo(() => khoi.filter((k) => chonSet.has(k.dau) && !k.bo), [khoi, chonSet])
  /** Trạng thái pill "Chọn tất cả" — tính trên các khối ĐANG HIỆN (đã lọc). */
  const ttChon = useMemo(() => trangThaiChon(khoiHien, chonSet), [khoiHien, chonSet])
  const dauKhoi = useMemo(() => {
    const m = new Map<number, NhanKhoiCau>()
    if (!phien) return m
    for (const k of khoi) {
      if (k.dau >= phien.nd.tu.length) continue
      const c = phien.nd.tu[k.dau].cau
      if (m.has(c)) continue
      const daDoi = Object.prototype.hasOwnProperty.call(phien.chia.tieuDeTay, k.dau)
      m.set(c, { so: nhanSo.get(k.dau) || '', ten: rutGon(tenKhoi(k, daDoi), 60) })
    }
    return m
  }, [khoi, nhanSo, phien?.nd, phien?.chia.tieuDeTay])

  // ── Tab "Toàn bộ lời": số liệu + vùng câu đang chọn ───────────────────
  const soLieu = useMemo(() => soLieuLoi(phien ? phien.nd.cau : []), [phien?.nd])
  /**
   * Các câu trong vùng chọn. `id` câu = chỉ số trong `nd.cau` (moc.ts đặt vậy),
   * nên cắt bằng `slice` — vẫn kẹp lại theo độ dài thật để một phiên cũ (vùng
   * chọn của bản nghe trước) không cắt ra ngoài mảng.
   */
  const cauChon = useMemo(() => {
    const v = phien?.chonCau
    if (!phien || !v) return null
    const a = Math.max(0, Math.min(v.dau, phien.nd.cau.length - 1))
    const b = Math.max(a, Math.min(v.cuoi, phien.nd.cau.length - 1))
    return phien.nd.cau.slice(a, b + 1)
  }, [phien?.nd, phien?.chonCau])

  // ── Phiên theo sequence ───────────────────────────────────────────────
  const luuPhien = useCallback((p: Phien) => {
    phienTheoSeq.current.set(p.seqId, p)
    if (p.seqId === seqIdRef.current) {
      phienRef.current = p
      setPhien(p)
    }
  }, [])

  const capNhatPhien = useCallback(
    (doi: (p: Phien) => Phien) => {
      const p = phienRef.current
      if (!p) return
      const moi = doi(p)
      if (moi !== p) luuPhien(moi)
    },
    [luuPhien],
  )

  /**
   * Đổi sequence panel làm việc. TRÁO phiên theo ID (Transcripts 30/07 — anh
   * Tiến: *"anh đổi sequence thì thông tin ở panel cũng phải đổi cho giống"*):
   * sequence đã đọc trong phiên thì hiện lại đúng của nó, chưa đọc thì về màn
   * "Đọc nội dung". Không bao giờ trưng nội dung của sequence khác.
   */
  const doiSeq = useCallback(
    (id: string) => {
      if (id === seqIdRef.current) return
      seqIdRef.current = id
      setSeqId(id)
      const p = phienTheoSeq.current.get(id) ?? null
      phienRef.current = p
      setPhien(p)
      setMoRong(new Set())
      setMoCau(new Set())
      setDaChep(null)
      setTro(null)
      setDangSua(null)
      setMenu(null)
      setXacNhanXoa(null)
      setXacNhanDocLai(null)
      setXacNhanMarker(null)
      setThongBao(null)
      tbNapRef.current = null
      setSoMarker(-1)
      phatRef.current = { cau: -1, khoi: -1 }
      nguonKhoaRef.current = '#doi-seq'
      if (p && trongHost) {
        banRef.current++
        demMarker(id)
          .then((n) => {
            if (seqIdRef.current === id) setSoMarker(n)
          })
          .catch(() => {})
          .finally(() => {
            banRef.current--
          })
      }
    },
    [trongHost],
  )

  // ── Đầu đọc: tô sáng câu/khối đang phát QUA DOM ───────────────────────
  const veDauDoc = useCallback(() => {
    const root = thanRef.current
    if (!root) return
    root.querySelectorAll('[data-phat]').forEach((el) => el.removeAttribute('data-phat'))
    const { cau, khoi: kd } = phatRef.current
    if (cau >= 0) root.querySelectorAll(`[data-cau="${cau}"]`).forEach((el) => el.setAttribute('data-phat', ''))
    if (kd >= 0) root.querySelector(`[data-khoi="${kd}"]`)?.setAttribute('data-phat', '')
  }, [])

  /** Cuộn tối thiểu để `el` lọt vào khung nhìn, chừa chỗ thanh công cụ dính trên. */
  const cuonVao = useCallback((el: HTMLElement) => {
    const root = thanRef.current
    if (!root) return
    const rr = root.getBoundingClientRect()
    const tran = rr.top + (congCuRef.current ? congCuRef.current.offsetHeight : 0) + 4
    const day = rr.bottom - 4
    const er = el.getBoundingClientRect()
    if (er.top < tran) root.scrollTop -= tran - er.top
    else if (er.bottom > day) root.scrollTop += Math.min(er.bottom - day, er.top - tran)
  }, [])

  /**
   * Phần tử đang được tô (TRƯỚC lần đổi này) còn nằm trong khung nhìn không —
   * tức người dùng có đang "đi theo" cái máy đang chỉ hay đã cuộn đi xem chỗ
   * khác. Chưa tô gì (vừa mở / vừa bấm phát) → coi là CÓ.
   * Một hàm cho CẢ HAI đường bám (đầu đọc `[data-phat]` và khối đang đưa vào
   * `[data-dang-dua]`): luật giống nhau thì đừng viết hai bản, lệch nhau là ra
   * hai hành vi cho cùng một câu hỏi.
   */
  const conTrongKhung = useCallback((chon: string): boolean => {
    const root = thanRef.current
    if (!root) return false
    const ds = root.querySelectorAll<HTMLElement>(chon)
    if (!ds.length) return true
    const rr = root.getBoundingClientRect()
    const tran = rr.top + (congCuRef.current ? congCuRef.current.offsetHeight : 0)
    for (const el of Array.from(ds)) {
      const r = el.getBoundingClientRect()
      if (r.bottom > tran && r.top < rr.bottom) return true
    }
    return false
  }, [])

  /**
   * Người dùng đang "đi theo" đầu đọc không. Đã cuộn đi xem chỗ khác thì thôi
   * bám — kể cả khi đã quá 4 giây từ lần cuộn cuối (soát 19/09: bản đầu chỉ tính
   * lăn chuột, cứ quá 4 giây là giật về chỗ đang phát).
   */
  const dangTheoDauDoc = useCallback((): boolean => conTrongKhung('[data-phat]'), [conTrongKhung])

  const theoDauDoc = useCallback((dangTheo: boolean) => {
    if (!dangTheo || khongBamRef.current) return
    if (Date.now() - nguoiCuonRef.current < NGHI_BAM_THEO) return
    const root = thanRef.current
    if (!root) return
    const { cau, khoi: kd } = phatRef.current
    let el: HTMLElement | null = null
    if (tabRef.current === 'loi') {
      if (cau >= 0) el = root.querySelector<HTMLElement>(`.ds-cau--loi [data-cau="${cau}"]`)
    } else {
      if (cau >= 0) el = root.querySelector<HTMLElement>(`.ds-khoi [data-cau="${cau}"]`)
      if (!el && kd >= 0) el = root.querySelector<HTMLElement>(`[data-khoi="${kd}"]`)
    }
    if (el) cuonVao(el)
  }, [cuonVao])

  const apDauDoc = useCallback(
    (t: number) => {
      const p = phienRef.current
      if (!p || !isFinite(t) || t < 0) return
      const tt = t + dungSaiDauDoc(p.vung.fps)
      const ci = timCauTai(p.nd.cau, tt)
      const kd = timKhoiTai(khoiRef.current, tt)
      const cu = phatRef.current
      if (ci === cu.cau && kd === cu.khoi) return
      const dangTheo = dangTheoDauDoc() // đo TRƯỚC khi đổi phần tử tô sáng
      phatRef.current = { cau: ci, khoi: kd }
      veDauDoc()
      theoDauDoc(dangTheo)
    },
    [veDauDoc, theoDauDoc, dangTheoDauDoc],
  )

  /**
   * Tô vùng câu đang chọn — ĐẶT THẲNG LÊN DOM như `data-phat`, không qua props.
   *
   * ☠️ Vì sao (đo 21/09 trên trình duyệt, 803 câu Machine, bấm giờ bằng
   * MutationObserver): bản đầu truyền `chon` xuống từng dòng thì Shift+bấm chọn
   * 501 câu mất **43,2 ms**, kéo tới 794 câu 28,4 ms, Esc bỏ chọn 794 câu
   * **57,2 ms** — mỗi cú bấm đứng 3–4 khung hình. Đi qua DOM thì chỉ quét 803
   * thuộc tính, và `DsLoi` (memo) không nhận prop nào của vùng chọn nên không vẽ
   * lại. Chỉ đụng danh sách của tab "Toàn bộ lời" (`.ds-cau--loi`): dòng câu
   * trong thẻ khối cũng có `data-cau` nhưng không thuộc vùng chọn này.
   */
  const veVungChon = useCallback(() => {
    const root = thanRef.current
    if (!root) return
    const v = phienRef.current?.chonCau ?? null
    root.querySelectorAll<HTMLElement>('.ds-cau--loi > .cau[data-cau]').forEach((el) => {
      const id = Number(el.getAttribute('data-cau'))
      const co = !!v && id >= v.dau && id <= v.cuoi
      if (co === el.hasAttribute('data-chon')) return
      if (co) el.setAttribute('data-chon', '')
      else el.removeAttribute('data-chon')
    })
  }, [])

  /**
   * Tô thẻ khối ĐANG ĐƯỢC ĐƯA VÀO SEQUENCE — cũng đặt thẳng lên DOM như
   * `data-phat`. Mỗi khối chỉ đổi thuộc tính trên 1–2 phần tử, không phụ thuộc
   * danh sách dài bao nhiêu (đo ở báo cáo: xem mục "số lần vẽ lại").
   */
  const veDangDua = useCallback(() => {
    const root = thanRef.current
    if (!root) return
    const dau = KHO.dua ? KHO.dua.dau : -1
    root.querySelectorAll('[data-dang-dua]').forEach((el) => {
      if (Number(el.getAttribute('data-khoi')) !== dau) el.removeAttribute('data-dang-dua')
    })
    if (dau >= 0) root.querySelector(`[data-khoi="${dau}"]`)?.setAttribute('data-dang-dua', '')
  }, [])

  /**
   * Cuộn tới khối đang được đưa vào. Dùng ĐÚNG BA cửa của đầu đọc:
   *  1. `dangTheo` — thẻ đang sáng (TRƯỚC lần đổi này) còn trong khung nhìn.
   *     ☠️ Soát 21/09: bản đầu THIẾU cửa này (chỉ có 2 cửa dưới), nên đang chạy
   *     12 khối mà người dùng cuộn đi xem chỗ khác rồi bỏ tay 4 giây là danh sách
   *     bị kéo giật về — và giật lại ở MỖI khối sau đó. Đúng bệnh `theoDauDoc` đã
   *     chữa 19/09, chú thích cũ nói "dùng đúng lối của đầu đọc" là NÓI QUÁ.
   *  2. đang có menu / ô sửa / hộp hỏi mở.
   *  3. người dùng vừa thao tác trong danh sách (4 giây gần nhất) — `taoSeq` xoá
   *     dấu này một lần lúc vào vòng (cú bấm CHỌN vừa xong không được tính là
   *     "đang đọc dở"), xem chú thích ở đó.
   * Bên gọi phải đo `dangTheo` TRƯỚC khi đổi thẻ sáng, y như `apDauDoc`.
   */
  const cuonToiDangDua = useCallback(
    (dangTheo: boolean) => {
      if (!dangTheo || khongBamRef.current) return
      if (Date.now() - nguoiCuonRef.current < NGHI_BAM_THEO) return
      const root = thanRef.current
      const dau = KHO.dua ? KHO.dua.dau : -1
      if (!root || dau < 0) return
      const el = root.querySelector<HTMLElement>(`[data-khoi="${dau}"]`)
      if (el) cuonVao(el)
    },
    [cuonVao],
  )

  // Sau MỖI lần vẽ (đổi tab, lọc, mở khối…) phần tử mới chưa có `data-phat` /
  // `data-chon` / `data-dang-dua` — đặt lại. Rẻ: vài lần querySelectorAll.
  useLayoutEffect(() => {
    veDauDoc()
    veVungChon()
    veDangDua()
  })

  const danhDauCuon = useCallback(() => {
    nguoiCuonRef.current = Date.now()
  }, [])

  // ── Bộ máy nghe (whisper + ffmpeg) ────────────────────────────────────
  const kiemLaiBoMay = useCallback(() => {
    if (!trongHost) return
    try {
      setBoMay(kiemBoMay())
    } catch (e) {
      setBoMay(thanhLoi(e).chu)
    }
  }, [trongHost])
  useEffect(() => {
    kiemLaiBoMay()
  }, [kiemLaiBoMay])

  // ── Khởi động ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (trongHost) {
      // Nạp lại host TRƯỚC khi hỏi gì — Premiere nạp host/*.jsx đúng một lần lúc
      // khởi động; cài bản mới rồi reload panel là nói chuyện với host CŨ.
      // ☠️ Nạp HỎNG thì phải NÓI (soát 19/09): bản đầu `void napLaiHost()` bỏ qua
      // kết quả → người dùng chỉ thấy câu SAI "Chưa có sequence nào đang mở.", còn
      // câu "cài lại panel / tắt hẳn Premiere" không bao giờ hiện.
      void napLaiHost().then((ok) => {
        const l = ok ? null : loiNapHost()
        if (l && l.ma !== 'HET_GIO' && !KHO.thongBao) {
          const tb = thongBaoLoi(l)
          tbNapRef.current = tb
          setThongBao(tb)
        }
      })
      // File tạm của lượt nghe bị cắt ngang lần trước (đóng panel giữa chừng).
      donTamCu()
      return
    }
    // Chỉ lần mở ĐẦU (kho trống) — dựng lại vì đổi ngôn ngữ thì giữ tên file đã đọc.
    if (cheDoThu && !KHO.dsSeq.length) {
      seqIdRef.current = 'dev'
      setSeqId('dev')
      setDsSeq([{ id: 'dev', ten: dich('Thử ngoài Premiere'), dangMo: true } as SeqMuc])
    }
  }, [trongHost, cheDoThu])

  // ── Đóng / nạp lại panel GIỮA lúc đang nghe → dừng bộ nghe ─────────────
  // Soát 19/09: không có gì gọi `huy()` khi panel đóng → nếu CEP không tự giết
  // tiến trình con thì bộ nghe hiểu vẫn chạy (GPU ~67%) không ai dừng được. CHƯA
  // ĐO CEP có bắn `beforeunload` khi đóng panel không — lần cài đầu: đóng panel
  // giữa lúc nghe rồi xem tasklist còn tiến trình nghe hiểu không.
  useEffect(() => {
    const dungHet = () => {
      try {
        KHO.huy?.huy()
      } catch {
        /* tiến trình đã thoát */
      }
    }
    window.addEventListener('beforeunload', dungHet)
    return () => window.removeEventListener('beforeunload', dungHet)
  }, [])

  // ── Mép phải thanh đáy thẳng hàng mép phải thẻ khối ───────────────────
  // Thanh cuộn nằm TRONG .than nên thẻ khối hụt đúng bề rộng thanh cuộn so với
  // thanh đáy (đo 19/09 ở khổ 1280: .khoi phải 953, .thanh-hd__ruot phải 968).
  // Đo bề rộng thật (khác nhau theo máy / tỉ lệ màn hình) rồi đưa vào biến CSS.
  useLayoutEffect(() => {
    const el = thanRef.current
    if (!el) return
    const doRong = () => {
      document.documentElement.style.setProperty('--rong-thanh-cuon', Math.max(0, el.offsetWidth - el.clientWidth) + 'px')
    }
    doRong()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(doRong) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [])

  // ── ĐỒNG HÀNH: hỏi Premiere mỗi 1 giây ────────────────────────────────
  // Mỗi nhịp: danh sách sequence (+ tab đang mở) · vùng đang chọn (hàm NHẸ,
  // không liệt kê clip) · đầu đọc (chỉ khi đã có nội dung). So mốc rồi mới
  // setState — đứng yên thì App không vẽ lại.
  // ☠️ NHỊP 1 GIÂY, không 4: Transcripts 30/07 đặt 4 giây, kịch bản đo đạt 5/5
  // nhưng anh Tiến bấm tab thật thì "nó không thay đổi thông số" — người dựng
  // liếc panel trong ~1 giây.
  // ☠️ NGƯNG khi đang chạy việc: ExtendScript một luồng, chen vào giữa lúc
  // đang tạo sequence là xếp hàng đè nhau.
  const dangChay = chay !== null
  useEffect(() => {
    if (!trongHost || dangChay) {
      soiRef.current = null
      return
    }
    let dung = false
    let dangSoi = false
    const soi = async () => {
      if (dangSoi || banRef.current > 0) return
      dangSoi = true
      try {
        const ds = await dsSequence()
        if (dung) return
        // ☠️ HỎI HỎNG ≠ KHÔNG CÓ SEQUENCE (soát 19/09). Bản đầu nhận [] cho mọi lỗi,
        // coi là "sequence bị xoá" rồi bỏ bàn dựng — và vì tab Premiere không đổi
        // nên KHÔNG BAO GIỜ quay về (mô phỏng: [S1],[],[S1],[S1] → kẹt ở "" từ nhịp 2).
        // Một nhịp hỏng (Premiere mở hộp thoại > 8 s, đang dựng sequence) thì BỎ
        // QUA nhịp đó, giữ nguyên mọi thứ; host nạp hỏng thì nói ra.
        if (ds === null) {
          const l = loiNapHost()
          if (l && l.ma !== 'HET_GIO' && !tbNapRef.current && !KHO.thongBao) {
            const tb = thongBaoLoi(l)
            tbNapRef.current = tb
            setThongBao(tb)
          }
          return
        }
        if (tbNapRef.current) {
          if (KHO.thongBao === tbNapRef.current) setThongBao(null) // Premiere trả lời lại → câu "host hỏng" hết đúng
          tbNapRef.current = null
        }
        setDsSeq((cu) => (giongDs(cu, ds) ? cu : ds))
        const act = ds.find((d) => d.dangMo)?.id ?? ''
        let id = seqIdRef.current
        // Người dùng bấm sang tab sequence khác TRONG Premiere → panel đi theo.
        // Chỉ theo khi tab ĐỔI, để lựa chọn tay trên ô chọn không bị giật lại.
        if (act && act !== actRef.current) {
          actRef.current = act
          id = act
        }
        if (id && !ds.some((d) => d.id === id)) id = act // sequence bị xoá
        // Lưới an toàn: panel đang không làm sequence nào mà Premiere có tab mở →
        // theo tab đó, đừng đứng trống chờ người dùng tự bấm.
        if (!id && act) id = act
        if (id !== seqIdRef.current) doiSeq(id)
        if (!id) {
          if (nguonKhoaRef.current !== '') {
            nguonKhoaRef.current = ''
            setNguon(null)
          }
          return
        }
        const v = await docVung(id)
        if (dung) return
        // Nhịp này hỏi hỏng → giữ nguyên dòng nguồn (đừng nhấp nháy "Chưa có sequence").
        if (!v) return
        const n: NguonHien = { vao: v.vao, ra: v.ra, soChon: v.soChon, uocLuong: v.uocLuong }
        const k = n.vao + '|' + n.ra + '|' + n.soChon + '|' + (n.uocLuong ? 1 : 0)
        if (k !== nguonKhoaRef.current) {
          nguonKhoaRef.current = k
          setNguon(n)
        }
        const p = phienRef.current
        if (p && p.seqId === id) {
          const t = await viTriDauDoc(id)
          if (!dung) apDauDoc(t)
        }
      } catch {
        /* nhịp này hỏng (Premiere bận, đóng project…) — bỏ, nhịp sau hỏi lại */
      } finally {
        dangSoi = false
      }
    }
    soiRef.current = () => void soi()
    void soi()
    const h = window.setInterval(() => void soi(), 1000)
    return () => {
      dung = true
      window.clearInterval(h)
    }
  }, [trongHost, dangChay, doiSeq, apDauDoc])

  // ── Nhảy đầu đọc ──────────────────────────────────────────────────────
  const nhay = useCallback(
    async (giay: number) => {
      if (cheDoThu) {
        apDauDoc(giay) // đầu đọc GIẢ — để thử phần tô sáng ngoài Premiere
        return
      }
      if (!trongHost || chayRef.current) return
      const id = seqIdRef.current
      if (!id) return
      banRef.current++
      try {
        const r = await nhayToi(id, giay)
        // Đầu đọc tới được đâu thì tô đúng chỗ ĐÓ (số đọc lại), kể cả khi lệch.
        if (r.giayThat >= 0) apDauDoc(r.giayThat)
        // `setPlayerPosition` CHƯA ai đo trong repo (host ghi CHƯA ĐO) — cep.ts
        // trả `ok:false` + NHAY_LECH khi lệch quá một khung hình. Nói ra bằng
        // số, đừng im lặng coi như đã nhảy đúng.
        if (!r.ok && r.loi) setThongBao(thongBaoLoi(r.loi))
      } catch (e) {
        setThongBao(thongBaoLoi(e))
      } finally {
        banRef.current--
      }
    },
    [cheDoThu, trongHost, apDauDoc],
  )

  // ── Đọc nội dung ──────────────────────────────────────────────────────
  const docNoiDung = useCallback(
    async (epNgheLai: boolean) => {
      if (chayRef.current) return
      const idSeq = seqIdRef.current
      setThongBao(null)
      setXacNhanDocLai(null)
      setDangDung(false)
      // Cờ dừng của ffmpeg.ts: `huy()` giết tiến trình NGAY (taskkill cả cây),
      // không đợi vòng thăm dò 200 ms của cờ tự chế.
      const huy = taoCoHuy()
      huyRef.current = huy
      const batDau = Date.now()
      const viec: ViecChay = { viec: 'doc', batDau, phanTram: -1 }
      chayRef.current = viec
      setChay(viec)
      try {
        let vung: VungLam
        let ban: BanNghe[]
        let moc: string
        let soKhongFile = 0
        if (cheDoThu) {
          const r = await docDemThu(demThu)
          vung = r.vung
          ban = r.ban
          const n: NguonHien = { vao: 0, ra: vung.vungDen, soChon: 0 }
          moc = khoaVung(n)
          setNguon(n)
          setDsSeq([{ id: 'dev', ten: vung.seqName, dangMo: true } as SeqMuc])
        } else {
          if (!idSeq) throw new Error(dich('Chưa có sequence nào đang mở.'))
          await napLaiHost()
          const nhe = await docVung(idSeq)
          moc = khoaVung(nhe ? { vao: nhe.vao, ra: nhe.ra, soChon: nhe.soChon } : null)
          const r = await docVungLam(idSeq, 'tudong')
          if (r.loi) throw r.loi
          if (!r.vung || !r.vung.clips.length) {
            throw new Error(dich('Trong vùng không có clip nào để đọc — chọn clip hoặc khoanh In/Out rồi thử lại.'))
          }
          vung = r.vung
          soKhongFile = r.soKhongFile
          const chon = chonClipNghe(vung)
          // Clip đổi tốc độ: mốc file gốc → sequence không còn là phép cộng —
          // TỪ CHỐI như Transcripts, đừng quy đổi sai im lặng. Đếm theo
          // `boQuaToc` (chỉ clip SẼ NGHE) chứ không theo mọi clip trong vùng:
          // một B-roll quay chậm bị phủ không được làm cả vùng bị từ chối oan.
          if (chon.boQuaToc > 0) {
            throw new Error(
              dp(
                'Trong vùng có {n} đoạn đã đổi tốc độ. Panel chưa quy đổi được thời gian cho clip đổi tốc độ — trả về 100% rồi đọc lại.',
                { n: chon.boQuaToc },
              ),
            )
          }
          const paths = Array.from(new Set(chon.clips.map((c) => c.path)))
          if (!paths.length) throw new Error(dich('Không có clip nào nghe được trong vùng.'))
          let ptCu = -2
          ban = await layBanNghe(paths, {
            epNgheLai,
            huy,
            bao: (t) => {
              if (huy.daHuy) return
              const pt = phanTramTong(t)
              const tron = pt < 0 ? -1 : Math.floor(pt)
              if (tron === ptCu) return // đứng yên thì khỏi vẽ lại
              ptCu = tron
              setChay((c) => (c && c.viec === 'doc' ? { ...c, phanTram: tron } : c))
            },
          })
        }
        if (huy.daHuy) return
        const nd = dungNoiDung(vung, ban)
        const chia = timKhoi(nd)
        const p: Phien = {
          seqId: idSeq,
          seqName: vung.seqName,
          vung,
          soKhongFile,
          nd,
          nguonNghe: ban.map((b) => b.nguon),
          chia,
          lui: [],
          chon: [],
          chonCau: null,
          mocVung: moc,
        }
        setMoRong(new Set())
        setMoCau(new Set())
        setDaChep(null)
        setTro(null)
        setDangSua(null)
        setMenu(null)
        setOTim('')
        setTab('khoi')
        setDaTao(null)
        setDaDat(null)
        setXacNhanMarker(null)
        phatRef.current = { cau: -1, khoi: -1 }
        luuPhien(p)
        if (trongHost) {
          // Lệnh host ngắn → vòng thăm dò nhường (banRef), như ở doiSeq.
          banRef.current++
          demMarker(idSeq)
            .then((n) => {
              if (seqIdRef.current === idSeq) setSoMarker(n)
            })
            .catch(() => {})
            .finally(() => {
              banRef.current--
            })
        }
      } catch (e) {
        if (!laHuy(e) && !huy.daHuy) setThongBao(thongBaoLoi(e))
      } finally {
        huyRef.current = null
        chayRef.current = null
        setChay(null)
        setDangDung(false)
      }
    },
    [cheDoThu, demThu, trongHost, luuPhien],
  )
  // Nút "Nghe lại" trong dòng thông báo (bản nghe lệch) gọi qua biến module này.
  ngheLaiHienTai = () => void docNoiDung(true)

  // Chế độ thử: tự đọc file đệm ngay khi mở — không có gì khác để làm.
  useEffect(() => {
    // Dựng lại vì đổi ngôn ngữ thì kho đã có sẵn — đừng đọc lại đè mất khối đã sửa.
    if (cheDoThu && !KHO.phienTheoSeq.has('dev') && !KHO.chay) void docNoiDung(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dungDoc = useCallback(() => {
    const h = huyRef.current
    if (!h) return
    setDangDung(true)
    try {
      h.huy() // tự đặt daHuy = true rồi giết tiến trình đang chạy
    } catch {
      /* tiến trình đã tự thoát */
    }
    h.daHuy = true
  }, [])

  /**
   * Đọc lại (vùng đổi / nghe lại). Đã sửa khối bằng tay thì bấm lần đầu chỉ
   * HỎI — đọc lại là mất hết các lần gộp/tách/đổi tên, không lấy lại được.
   */
  const yeuCauDocLai = useCallback(
    (epNgheLai: boolean) => {
      const p = phienRef.current
      if (p && p.lui.length > 0 && xacNhanDocLai !== epNgheLai) {
        setXacNhanDocLai(epNgheLai)
        return
      }
      void docNoiDung(epNgheLai)
    },
    [docNoiDung, xacNhanDocLai],
  )
  useEffect(() => {
    if (xacNhanDocLai === null) return
    const h = window.setTimeout(() => setXacNhanDocLai(null), 5000)
    return () => window.clearTimeout(h)
  }, [xacNhanDocLai])

  // ── Sửa khối (gộp / tách / đổi tên / bỏ) — mọi sửa đều hoàn tác được ─────
  const apDoi = useCallback(
    (doi: (c: ChiaKhoi) => ChiaKhoi, sau?: (chon: number[], moi: ChiaKhoi, cu: ChiaKhoi) => number[]) => {
      capNhatPhien((p) => {
        const moi = doi(p.chia)
        if (moi === p.chia) return p
        const con = new Set(moi.ranhGioi)
        let chon = p.chon.filter((d) => con.has(d) && !moi.boTay[d])
        if (sau) chon = sau(chon, moi, p.chia)
        return { ...p, chia: moi, lui: [...p.lui, p.chia].slice(-LUI_TOI_DA), chon }
      })
    },
    [capNhatPhien],
  )

  const hoanTac = useCallback(() => {
    capNhatPhien((p) => {
      if (!p.lui.length) return p
      const cu = p.lui[p.lui.length - 1]
      const con = new Set(cu.ranhGioi)
      return { ...p, chia: cu, lui: p.lui.slice(0, -1), chon: p.chon.filter((d) => con.has(d) && !cu.boTay[d]) }
    })
    setDangSua(null)
  }, [capNhatPhien])

  const gopKhoi = useCallback(
    (dau: number) => {
      const ds = khoiRef.current
      const i = ds.findIndex((k) => k.dau === dau)
      if (i <= 0) return
      apDoi((c) => gopVoiTruoc(c, dau))
      setTro(ds[i - 1].dau)
    },
    [apDoi],
  )

  const tachKhoi = useCallback(
    (tuIdx: number) => {
      apDoi(
        (c) => tachTai(c, tuIdx),
        (chon, _moi, cu) => {
          // Khối cha đang được chọn thì nửa mới tách ra cũng được chọn.
          let cha = -1
          for (const d of cu.ranhGioi) if (d <= tuIdx) cha = d
          return cha >= 0 && chon.indexOf(cha) >= 0 && chon.indexOf(tuIdx) < 0 ? [...chon, tuIdx] : chon
        },
      )
    },
    [apDoi],
  )

  const boKhoi = useCallback((dau: number) => apDoi((c) => batBo(c, dau)), [apDoi])

  const doiTen = useCallback(
    (dau: number, ten: string) => {
      setDangSua(null)
      const v = ten.replace(/\s+/g, ' ').trim()
      const p = phienRef.current
      const k = khoiRef.current.find((x) => x.dau === dau)
      if (!p || !k) return
      const coTay = Object.prototype.hasOwnProperty.call(p.chia.tieuDeTay, dau)
      // Xoá trắng ô tên = trả về tên máy đặt (doiTieuDe nhận '' là bỏ tên tay).
      if (!v) {
        if (coTay) apDoi((c) => doiTieuDe(c, dau, ''))
        return
      }
      if (v === tenKhoi(k, coTay)) return
      apDoi((c) => doiTieuDe(c, dau, v))
    },
    [apDoi],
  )

  const chonKhoi = useCallback(
    (dau: number) => {
      const k = khoiRef.current.find((x) => x.dau === dau)
      if (!k || k.bo) return
      capNhatPhien((p) => ({
        ...p,
        chon: p.chon.indexOf(dau) >= 0 ? p.chon.filter((d) => d !== dau) : [...p.chon, dau],
      }))
    },
    [capNhatPhien],
  )

  // ── Tab "Toàn bộ lời": bấm câu / kéo vùng / bung từ ───────────────────
  /**
   * Bấm một câu. Bấm thường = nhảy đầu đọc tới đó + lấy câu đó làm NEO (vùng
   * chọn còn đúng một câu). Shift+bấm = kéo vùng từ neo tới câu này và KHÔNG
   * dời đầu đọc — đang gom một khoảng thì đừng làm playhead chạy.
   * Bấm lại đúng câu đang là cả vùng (một câu) = bỏ chọn, vẫn nhảy tới.
   */
  const bamCau = useCallback(
    (id: number, giay: number, keoDai: boolean) => {
      capNhatPhien((p) => {
        const v = p.chonCau
        if (keoDai && v) {
          const neo = v.neo
          const dau = Math.min(neo, id)
          const cuoi = Math.max(neo, id)
          if (v.dau === dau && v.cuoi === cuoi) return p
          return { ...p, chonCau: { neo, dau, cuoi } }
        }
        if (v && v.dau === id && v.cuoi === id) return { ...p, chonCau: null }
        return { ...p, chonCau: { neo: id, dau: id, cuoi: id } }
      })
      if (!keoDai) void nhay(giay)
    },
    [capNhatPhien, nhay],
  )

  const boChonCau = useCallback(() => {
    capNhatPhien((p) => (p.chonCau ? { ...p, chonCau: null } : p))
  }, [capNhatPhien])

  const moMotCau = useCallback((id: number, mo?: boolean) => {
    setMoCau((s) => {
      const co = s.has(id)
      const muon = mo === undefined ? !co : mo
      if (muon === co) return s
      const m = new Set(s)
      if (muon) m.add(id)
      else m.delete(id)
      return m
    })
  }, [])

  const moMenu = useCallback((dau: number, nut: HTMLElement) => {
    setMenu((m) => (m && m.dau === dau ? null : { dau, nut, viTri: viTriMenu(nut) }))
  }, [])

  const dongMenu = useCallback(() => setMenu(null), [])

  const cb = useMemo(
    () => ({
      onChon: chonKhoi,
      onMoRong: (dau: number) =>
        setMoRong((s) => {
          const m = new Set(s)
          if (m.has(dau)) m.delete(dau)
          else m.add(dau)
          return m
        }),
      onNhay: (giay: number) => void nhay(giay),
      onSua: (dau: number | null) => setDangSua(dau),
      onDoiTen: doiTen,
      onMenu: moMenu,
      onTach: tachKhoi,
      onTro: (dau: number) => setTro(dau),
    }),
    [chonKhoi, nhay, doiTen, moMenu, tachKhoi],
  )
  const nhayCau = useCallback((giay: number) => void nhay(giay), [nhay])

  // ── Chép / xuất lời ───────────────────────────────────────────────────
  // Chép xong người dùng KHÔNG thấy gì (bộ nhớ tạm vô hình) → nút tự làm đèn
  // báo trong ~2,5 giây. Hỏng thì mới có dòng thông báo (luật "chỉ báo khi
  // thất bại" chỉ đúng với việc người dùng THẤY được kết quả).
  //
  // ☠️ `dauTab` = có bật đèn của nút "Chép cả bài" ở ĐẦU tab hay không. Chép MỘT
  // dòng thì KHÔNG bật (sửa 21/09 sau soát): nút đó nằm đầu tab, không dính,
  // nên bấm chép ở câu thứ 700 là đèn xanh hiện cách đó mấy nghìn pixel —
  // người dùng không thấy gì. Và đang chọn 321 câu thì nhãn đổi thành "Đã chép
  // 1 câu", đọc lướt hoá ra "lệnh chép vùng chỉ chép được 1 câu".
  const chepRa = useCallback(async (chu: string, soCau: number, dauTab: boolean) => {
    try {
      await chepChu(chu)
      if (dauTab) setDaChep(soCau)
      return true
    } catch (e) {
      if (dauTab) setDaChep(null)
      setThongBao(thongBaoLoi(e))
      return false
    }
  }, [])
  useEffect(() => {
    if (daChep === null) return
    const h = window.setTimeout(() => setDaChep(null), 2500)
    return () => window.clearTimeout(h)
  }, [daChep])

  /**
   * Đèn "vừa chép" ĐẶT THẲNG LÊN DOM của đúng dòng vừa bấm — báo tại CHỖ BẤM.
   * Đi qua DOM (như `data-phat` / `data-chon`) chứ không qua props: prop mới là
   * `DsLoi` vẽ lại cả danh sách 2.000 dòng cho một cú chép (bài học 21/09).
   */
  const veVuaChep = useCallback((id: number) => {
    const root = thanRef.current
    if (!root) return
    root.querySelectorAll('[data-vua-chep]').forEach((el) => el.removeAttribute('data-vua-chep'))
    const el = root.querySelector<HTMLElement>(`.ds-cau--loi > .cau[data-cau="${id}"]`)
    if (!el) return
    el.setAttribute('data-vua-chep', '')
    window.clearTimeout(vuaChepRef.current)
    vuaChepRef.current = window.setTimeout(() => el.removeAttribute('data-vua-chep'), 1500)
  }, [])

  const chepMotCau = useCallback(
    (id: number) => {
      const p = phienRef.current
      const c = p?.nd.cau[id]
      if (!c) return
      // Câu bịa: trên màn hình là "không nghe rõ", nên chép ra chữ máy tự bịa
      // là đưa rác cho người dùng (cùng luật với .txt/.srt trong xuat.ts).
      if (c.bia) {
        setThongBao({
          loai: 'canh',
          loi: { chu: dich('Câu này là chữ máy tự bịa — không chép.'), chiTiet: '' },
        })
        return
      }
      void chepRa(dongTxt(c) + '\n', 1, false).then((ok) => {
        if (ok) veVuaChep(id)
      })
    },
    [chepRa, veVuaChep],
  )

  const chepPhan = useCallback(() => {
    const p = phienRef.current
    if (!p) return
    const k = xuatTxt(vungCauDs(p))
    if (!k.soCau) {
      setThongBao({ loai: 'canh', loi: { chu: dich('Không có câu nào để chép — chỗ này chỉ có chữ máy tự bịa.'), chiTiet: '' } })
      return
    }
    void chepRa(k.chu, k.soCau, true)
  }, [chepRa])

  /**
   * Xuất .txt / .srt của vùng đang chọn (chưa chọn thì cả bài). Trong Premiere:
   * ghi CẠNH file media đóng góp nhiều câu nhất, KHÔNG ghi đè (xem `ghiCanhMedia`)
   * và nói ra ĐƯỜNG DẪN THẬT — không nói thì người dùng không biết file nằm đâu.
   * Ngoài Premiere (chế độ thử): tải về bằng thẻ `a[download]`.
   */
  const xuatPhan = useCallback(
    (loai: 'txt' | 'srt') => {
      const p = phienRef.current
      if (!p || chayRef.current) return
      const ds = vungCauDs(p)
      const k = loai === 'srt' ? xuatSrt(ds) : xuatTxt(ds)
      if (!k.soCau) {
        setThongBao({ loai: 'canh', loi: { chu: dich('Không có câu nào để xuất — chỗ này chỉ có chữ máy tự bịa.'), chiTiet: '' } })
        return
      }
      const tenRieng = tenFileSach(p.seqName, 'Short Viral')
      const duoi = '.' + loai
      const phu: string[] = []
      if (k.soBoBia > 0) phu.push(dp('Bỏ {n} câu máy tự bịa.', { n: k.soBoBia }))
      if (k.soKeoDai > 0) phu.push(dp('{n} câu có mốc cuối hụt, đã kéo dài thêm 1 mili-giây.', { n: k.soKeoDai }))
      if (k.soChongLan > 0) phu.push(dp('{n} chỗ hai câu đè mốc nhau — mở file ra soát lại.', { n: k.soChongLan }))
      // ☠️ Mốc trong file là giây TUYỆT ĐỐI TRÊN SEQUENCE, nhưng file nằm CẠNH
      // VIDEO và mang TÊN VIDEO → chỗ đặt + tên nói "phụ đề của video này", còn
      // nội dung chỉ đúng khi đối chiếu Timeline. Sequence có clip bị trim thì
      // kéo .srt này vào chính video gốc là lệch đúng bằng phần trim, không có
      // dấu hiệu gì. Nói ra một câu (sửa 21/09). Đổi hẳn sang trục FILE GỐC
      // (`srcTu`/`srcDen` đã có sẵn trong CauSeq) hay không: CHỜ ANH CHỐT.
      if (loai === 'srt')
        phu.push(dich('Mốc trong file tính theo SEQUENCE — đối chiếu trên Timeline, đừng kéo thẳng vào video gốc.'))
      const loaiTb: ThongBao['loai'] = k.soChongLan > 0 ? 'canh' : 'ok'
      try {
        if (!trongHost) {
          taiVe(tenRieng + duoi, k.chu)
          setThongBao({
            loai: loaiTb,
            loi: { chu: [dp('Đã tải về {f} ({n} câu).', { f: tenRieng + duoi, n: k.soCau }), ...phu].join(' '), chiTiet: '' },
          })
          return
        }
        const media = mediaChinh(ds)
        if (!media) throw new Error(dich('Không biết file gốc nằm ở đâu để lưu cạnh — chưa xuất được.'))
        const g = ghiCanhMedia(media, tenRieng, duoi, k.chu)
        if (g.daDoiTen) phu.push(dich('Cạnh video đã có file cùng tên nên panel thêm số vào tên mới, không ghi đè file cũ.'))
        setThongBao({
          loai: loaiTb,
          loi: {
            chu: [dp('Đã xuất {n} câu: {f}', { n: k.soCau, f: g.duong }), ...phu].join(' '),
            chiTiet: dp('{n} byte', { n: g.soByte }),
          },
        })
      } catch (e) {
        setThongBao(thongBaoLoi(e))
      }
    },
    [trongHost],
  )

  // ── Phím tắt ──────────────────────────────────────────────────────────
  // J/K hoặc ↓/↑ chọn khối · Enter nhảy tới · M gộp với khối trên · X tích
  // chọn · Ctrl+Z hoàn tác. Đang gõ trong ô nhập thì phím thuộc về ô nhập.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const tag = el ? el.tagName : ''
      const oNhap =
        !!el &&
        (tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          el.isContentEditable ||
          (tag === 'INPUT' && (el as HTMLInputElement).type !== 'checkbox'))
      if (oNhap) return
      if (!phienRef.current || chayRef.current) return
      const k = e.key
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (k === 'z' || k === 'Z')) {
        e.preventDefault()
        hoanTac()
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      // Tab "Toàn bộ lời": Esc bỏ vùng chọn · → bung câu đang có tiêu điểm, ←
      // gập lại (kiểu cây thư mục — có nút chevron rồi, đây là đường bàn phím).
      //
      // ☠️ BỎ phím `E` (21/09, sau soát): `E` là phím mặc định *Extend Selected
      // Edit to Playhead* của Premiere. `preventDefault()` chỉ chặn hành vi của
      // trình duyệt nhúng, KHÔNG chứng minh Premiere không nhận cùng cú phím —
      // và CHƯA ĐO được (hôm nay không được mở/chạy Premiere; grep skill
      // `adobe-cep-panel` ra 0 dòng về phím bị host ăn). Nếu host cũng ăn thì `E`
      // SỬA điểm cắt trên timeline của người dùng, mà nó chẳng thêm gì so với
      // chevron + `→`. Giữ `←`/`→` vì xấu nhất chỉ là đầu đọc nhích một khung.
      // Việc phải đo ở lần cài đầu: xem `CLAUDE.md` sổ lỗi #10.
      if (tabRef.current === 'loi') {
        if (k === 'Escape') {
          e.preventDefault()
          boChonCau()
          return
        }
        const hang = el && typeof el.closest === 'function' ? el.closest('[data-cau]') : null
        const id = hang ? Number(hang.getAttribute('data-cau')) : NaN
        if (!Number.isFinite(id)) return
        if (k === 'ArrowRight') {
          e.preventDefault()
          moMotCau(id, true)
        } else if (k === 'ArrowLeft') {
          e.preventDefault()
          moMotCau(id, false)
        }
        return
      }
      if (tabRef.current !== 'khoi') return
      const ds = khoiHienRef.current
      if (!ds.length) return
      const i = ds.findIndex((x) => x.dau === troRef.current)
      const chonTro = (j: number) => {
        const kk = ds[Math.max(0, Math.min(ds.length - 1, j))]
        setTro(kk.dau)
        nguoiCuonRef.current = Date.now() // người dùng đang tự đi → đừng bám đầu đọc
        requestAnimationFrame(() => {
          const node = thanRef.current?.querySelector<HTMLElement>(`[data-khoi="${kk.dau}"]`)
          if (node) cuonVao(node)
        })
      }
      switch (k) {
        case 'j':
        case 'J':
        case 'ArrowDown':
          e.preventDefault()
          chonTro(i < 0 ? 0 : i + 1)
          return
        case 'k':
        case 'K':
        case 'ArrowUp':
          e.preventDefault()
          chonTro(i < 0 ? 0 : i - 1)
          return
        case 'Enter':
          // Tiêu điểm đang ở một nút thì Enter là của nút đó (bấm câu, bấm tên…).
          if (tag === 'BUTTON' || i < 0) return
          e.preventDefault()
          void nhay(ds[i].tu)
          return
        case 'm':
        case 'M':
          if (i < 0) return
          e.preventDefault()
          gopKhoi(ds[i].dau)
          return
        case 'x':
        case 'X':
          if (i < 0) return
          e.preventDefault()
          chonKhoi(ds[i].dau)
          return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hoanTac, nhay, gopKhoi, chonKhoi, cuonVao, moMotCau, boChonCau])

  // ── Tạo sequence ──────────────────────────────────────────────────────
  const taoSeq = useCallback(async () => {
    const p = phienRef.current
    if (!p || chayRef.current) return
    // Lựa chọn lấy ở ĐÂU: thẻ khối (tab khối) hay vùng câu (tab "Toàn bộ lời").
    const nguon: NguonChon = tabRef.current === 'loi' ? 'cau' : 'khoi'
    const dsKhoi = khoiRef.current.filter((k) => !k.bo && p.chon.indexOf(k.dau) >= 0)
    if (nguon === 'khoi' ? !dsKhoi.length : !p.chonCau) return
    if (!trongHost) {
      setThongBao(CHI_TRONG_PREMIERE())
      return
    }
    const so = danhSo(khoiRef.current)
    const nhanCua = (k: Khoi) => so.get(k.dau) || dich('Mở đầu')
    const tenCua = (k: Khoi) => tenKhoi(k, Object.prototype.hasOwnProperty.call(p.chia.tieuDeTay, k.dau))
    const goc = p.seqName || 'Sequence'
    // Vùng câu luôn là MỘT khoảng liền → luôn một sequence, không có chuyện gộp.
    const gop = nguon === 'khoi' && cheDoTao === 'gop'

    // Khối nằm trọn trong khe trống (không có media) thì bỏ — nói ra bằng số.
    // ☠️ `doanDung`, KHÔNG `doanNguon`: host nối các đoạn đuôi nhau trên một track,
    // đưa nó cả B-roll / cam phụ là B-roll bị nối vào SAU lời nói (moc.ts ghi rõ).
    // Danh sách làn dựng tính MỘT lần cho cả lượt (soát 19/09: tính lại cho từng
    // khối trên sequence 886 clip V+A = 11,2 giây đứng hình, chạy TRƯỚC khi thanh
    // tiến độ kịp hiện).
    const lan = lanDung(p.vung)
    let dsViec: ViecDung[]
    let soChonBanDau: number
    if (nguon === 'cau') {
      const dsCau = vungCauDs(p)
      const [tuG, denG] = mocDsCau(dsCau)
      const doan = doanDung(p.vung, tuG, denG, lan)
      const nhan = mocHienThi(tuG)
      // Tên sequence lấy câu đầu KHÔNG bịa (câu bịa là chữ máy tự nghĩ ra).
      const cauTen = dsCau.find((c) => !c.bia)
      const ten = `${goc} – ${nhan}${cauTen ? ' ' + rutGon(cauTen.chu, 40) : ''}`
      dsViec = doan.length ? [{ nhan, ten, doan, dau: -1 }] : []
      soChonBanDau = 1
    } else {
      dsViec = dsKhoi
        .map((k) => ({
          nhan: nhanCua(k),
          ten: `${goc} – ${so.get(k.dau) ? so.get(k.dau) + ' ' : ''}${rutGon(tenCua(k), 40)}`,
          doan: doanDung(p.vung, k.tu, k.den, lan),
          dau: k.dau,
        }))
        .filter((v) => v.doan.length > 0)
      soChonBanDau = dsKhoi.length
    }
    const soRong = soChonBanDau - dsViec.length
    if (!dsViec.length) {
      setThongBao({
        loai: 'canh',
        loi: {
          chu:
            nguon === 'cau'
              ? dich('Vùng câu đã chọn không có media nằm trong vùng.')
              : dich('Các khối đã chọn không có media nằm trong vùng.'),
          chiTiet: '',
        },
      })
      return
    }
    const nhanGop = dsViec.map((v) => v.nhan)
    const tenGop =
      goc +
      ' – ' +
      (nhanGop.length > 6 ? nhanGop.slice(0, 3).join('+') + '…' + nhanGop[nhanGop.length - 1] : nhanGop.join('+'))
    const khoa = kyHieu(p, nguon, cheDoTao)

    dungTaoRef.current = false
    setDangDung(false)
    setThongBao(null)
    setXacNhanMarker(null)
    const viec: ViecChay = { viec: 'tao', batDau: Date.now(), phanTram: 0 }
    chayRef.current = viec
    setChay(viec)

    /** Số khối đã làm XONG (mỗi khối = một sequence, hoặc một lần nối vào sequence gộp). */
    let xong = 0
    /** ID sequence gộp — có sau lần gọi đầu. */
    let seqGop = ''
    /** Sequence đã tạo ra nhưng host báo có vấn đề (lệch độ dài, thiếu tiếng…). */
    let taoMaLoi = false
    let loi: ThongBao | null = null
    let loiO = ''
    /** ID sequence vừa tạo mà host KHÔNG mở lại được sequence gốc sau đó (moLai=0). */
    let moLaiHongO = ''
    try {
      await napLaiHost()
      // ☠️ XOÁ DẤU "người dùng vừa thao tác" (soát 21/09). Cú bấm CHỌN vừa xong
      // (ô tích, pill) nằm trong `<main class="than">` — thẻ đó có
      // `onPointerDown={danhDauCuon}` — nên đã đóng dấu `nguoiCuonRef`. Lưới chặn
      // 4 giây viết cho việc máy TỰ bám đầu đọc (người dùng không yêu cầu), dùng
      // nguyên văn cho một hành động người dùng VỪA BẤM là thừa hưởng luật của
      // tình huống khác: nút "Tạo sequence" ở thanh đáy (NGOÀI `main`) không đóng
      // dấu lại, nên 1–3 khối đầu không được cuộn tới — đúng thứ việc này sinh ra
      // để chữa. Ca xấu nhất: cuộn xuống đáy 300 thẻ để tích, bấm Tạo, khối 1 nằm
      // trên đầu → thẻ sáng ở chỗ không nhìn thấy. Giữ lưới cho các vòng SAU: ai
      // cuộn đi xem chỗ khác giữa lượt thì không bị kéo giật về.
      nguoiCuonRef.current = 0
      // Mỗi khối một lần gọi host — giữa hai lần mới xét nút Dừng. MỘT lần gọi
      // chạy một lèo không ngắt được (ExtendScript một luồng), nên gộp cũng
      // chia lô: taoSequence với khối đầu → noiTiepSequence từng khối sau
      // (cep.ts khuyên đúng cách này) — có % và có đường dừng.
      for (let i = 0; i < dsViec.length; i++) {
        if (dungTaoRef.current) break
        const v = dsViec[i]
        // ĐANG LÀM KHỐI NÀY — nói TRƯỚC khi gọi host (một lần gọi chạy một lèo,
        // không ngắt được): thẻ sáng lên, danh sách cuộn tới, dòng đếm đổi số.
        // Ba thứ, một chỗ đặt, và không thứ nào đi qua props của danh sách.
        // `dangTheo` phải đo TRƯỚC khi đổi thẻ sáng (y như `apDauDoc`): khối đầu
        // chưa có thẻ nào sáng → true; người dùng cuộn đi xem chỗ khác thì thẻ
        // sáng cũ ra ngoài khung → thôi bám.
        const dangTheo = conTrongKhung('[data-dang-dua]')
        setDua({ dau: v.dau, i: i + 1, n: dsViec.length })
        veDangDua()
        cuonToiDangDua(dangTheo)
        // Lưu project CHỈ ở lần gọi đầu của lượt (host `coLuu`) — bản đầu lưu ở
        // mọi lần gọi: 65 khối = 65 lần ghi đè file .prproj của người dùng.
        const luu = i === 0
        let r: KetQuaDung
        if (gop && i > 0) r = await noiTiepSequence(p.seqId, seqGop, v.doan, luu)
        else r = await taoSequence(p.seqId, gop ? tenGop : v.ten, v.doan, luu)
        if (gop && i === 0 && r.id) seqGop = r.id
        // Lần gọi CUỐI quyết Timeline đang đứng ở đâu (mỗi lần gọi host tự mở lại gốc).
        moLaiHongO = r.moLaiHong ? r.id : ''
        if (!r.ok) {
          loi = r.loi ? thongBaoLoi(r.loi) : { loai: 'loi', loi: { chu: dich('Premiere không tạo được sequence.'), chiTiet: '' } }
          loiO = v.nhan
          taoMaLoi = !!r.id
          break
        }
        xong++
        setChay((c) => (c && c.viec === 'tao' ? { ...c, phanTram: ((i + 1) / dsViec.length) * 100 } : c))
      }
    } catch (e) {
      loi = thongBaoLoi(e)
    } finally {
      // Host không mở lại được sequence gốc → Timeline đang đứng ở sequence vừa
      // tạo. Ghi nhận nó là "tab đã biết" để vòng thăm dò KHÔNG coi đó là người
      // dùng vừa bấm sang tab khác (nếu coi vậy, panel nhảy sang sequence mới và
      // doiSeq xoá luôn dòng báo bên dưới — người dùng không bao giờ đọc được).
      if (moLaiHongO) actRef.current = moLaiHongO
      chayRef.current = null
      setChay(null)
      setDangDung(false)
      // Tắt đèn khối đang làm — kể cả khi thoát bằng lỗi hoặc bằng nút Dừng, không
      // thì một thẻ nằm sáng mãi như đang chạy (`veDangDua` đọc KHO nên gọi SAU).
      setDua(null)
      veDangDua()
    }

    const n = dsViec.length
    // Bản đầu bỏ qua `moLai=0` của host: báo xong trong khi người dùng đang đứng ở
    // sequence khác (soát 19/09). Không phải hỏng dữ liệu → câu phụ, tô vàng.
    const cauMoLai = moLaiHongO
      ? ' ' + dich('Premiere chưa quay lại được sequence gốc — Timeline đang mở sequence vừa tạo.')
      : ''
    // ☠️ Khai TRƯỚC cả ba nhánh (soát 21/09). Bản đầu khai câu này SAU hai `return`
    // sớm (lỗi, bấm Dừng) nên đúng hai đường người dùng đang lo thì khoảng cách
    // 12 → 10 không có chữ nào giải thích: nút hứa "Tạo 12 sequence", dòng đếm
    // chạy "khối i/10", kết quả nói "3/10". Mẫu số phải giải thích được ở MỌI
    // đường ra, không chỉ đường thành công (brain 5k-bis).
    const cauRong = soRong > 0 ? ' ' + dp('Bỏ qua {n} khối không có media nằm trong vùng.', { n: soRong }) : ''
    if (loi) {
      // Luôn nói ĐÃ LÀM ĐƯỢC BAO NHIÊU trước, rồi mới tới lỗi — người dùng cần
      // biết trong project đang có gì (sequence tạo dở vẫn nằm trong bin).
      let chu: string
      if (gop) {
        // ☠️ `ok:false` KÈM `id` = sequence ĐÃ tạo và nội dung khối đã vào, chỉ
        // lệch độ dài / thiếu tiếng / chưa trả in-out (cep.ts docKetQuaDung: cả 4
        // loại lỗi đó xảy ra SAU khi đã dựng). Bản đầu nhánh gộp đếm `xong` trơn
        // nên lỗi ngay khối đầu ra "Sequence gộp mới có 0/12 khối" cho một
        // sequence thật sự đang chứa khối 1 — người đọc "0 khối" không đi tìm cái
        // sequence lạ đó trong bin. Đếm như nhánh mỗi-khối-một-sequence.
        chu = !seqGop
          ? dp('Chưa tạo được sequence gộp. Lỗi ở {k}: {l}', { k: loiO, l: loi.loi.chu })
          : taoMaLoi
            ? dp('Sequence gộp mới có {x}/{n} khối — khối {k} đã vào nhưng cần kiểm: {l}', {
                x: xong + 1,
                n,
                k: loiO,
                l: loi.loi.chu,
              })
            : dp('Sequence gộp mới có {x}/{n} khối. Lỗi ở {k}: {l}', { x: xong, n, k: loiO, l: loi.loi.chu })
      } else {
        chu = taoMaLoi
          ? dp('Đã tạo {x}/{n} sequence. Sequence của {k} đã tạo nhưng cần kiểm: {l}', { x: xong + 1, n, k: loiO, l: loi.loi.chu })
          : dp('Đã tạo {x}/{n} sequence. Dừng ở {k}: {l}', { x: xong, n, k: loiO, l: loi.loi.chu })
      }
      setThongBao({ loai: loi.loai, loi: { chu: chu + cauRong + cauMoLai, chiTiet: loi.loi.chiTiet } })
      return
    }
    if (dungTaoRef.current && xong < n) {
      setThongBao({
        loai: 'canh',
        loi: {
          chu:
            (gop
              ? dp('Đã dừng — sequence gộp mới có {x}/{n} khối.', { x: xong, n })
              : dp('Đã dừng — tạo được {x}/{n} sequence.', { x: xong, n })) + cauRong + cauMoLai,
          chiTiet: '',
        },
      })
      return
    }
    // MỘT dòng kết quả ngắn (anh Tiến giao 21/09). Nút chính cũng xanh lên
    // ("Đã tạo N sequence") nên dòng này phải nói thứ nút KHÔNG nói được:
    //  - gộp: nút chỉ biết "1 sequence", dòng này nói ĐƯA ĐƯỢC BAO NHIÊU KHỐI;
    //  - cả hai: mất bao lâu — người dựng 60 khối cần biết con số đó.
    // Cảnh báo (bỏ khối rỗng, Timeline không quay về) gộp vào CÙNG dòng, không
    // đẻ dòng thứ hai; có cảnh báo thì tô vàng.
    const t = dongHo(Math.max(0, Math.round((Date.now() - viec.batDau) / 1000)))
    const cauXong = gop
      ? dp('Đã đưa {n} khối vào 1 sequence mới · {t}', { n: xong, t })
      : dp('Đã tạo {n} sequence · {t}', { n: xong, t })
    if (xong > 0) {
      setThongBao({
        loai: cauRong || cauMoLai ? 'canh' : 'ok',
        loi: { chu: (cauXong + cauRong + cauMoLai).trim(), chiTiet: '' },
      })
      setDaTao({ n: gop ? 1 : xong, khoa })
    } else if (cauRong || cauMoLai) {
      setThongBao({ loai: 'canh', loi: { chu: (cauRong + cauMoLai).trim(), chiTiet: '' } })
    }
  }, [trongHost, cheDoTao, veDangDua, cuonToiDangDua, conTrongKhung])

  const dungTao = useCallback(() => {
    dungTaoRef.current = true
    setDangDung(true)
  }, [])

  // ── Marker ────────────────────────────────────────────────────────────
  /**
   * Bấm "Đặt marker". ☠️ Host XOÁ mọi marker cũ của panel RỒI mới đặt — nên nút này
   * cũng là nút xoá (soát 19/09: "Đặt 3 marker" xoá luôn 19 marker lần trước, người
   * dùng chỉ biết SAU khi đã xoá). Đếm lại NGAY lúc bấm; có marker cũ thì chỉ HỎI,
   * nói hậu quả bằng số — bấm "Đặt và thay" mới làm.
   */
  const datMarkerKhoi = useCallback(async () => {
    const p = phienRef.current
    if (!p || chayRef.current) return
    if (tabRef.current === 'loi' ? !p.chonCau : !khoiRef.current.some((k) => !k.bo && p.chon.indexOf(k.dau) >= 0)) return
    if (!trongHost) {
      setThongBao(CHI_TRONG_PREMIERE())
      return
    }
    banRef.current++
    let n = -1
    try {
      n = await demMarker(p.seqId)
    } finally {
      banRef.current--
    }
    if (seqIdRef.current !== p.seqId) return
    if (n < 0) {
      setThongBao({ loai: 'loi', loi: { chu: dich('Không đếm được marker trên sequence này — chưa đặt gì.'), chiTiet: '' } })
      return
    }
    setSoMarker(n)
    if (n > 0) {
      setXacNhanMarker(n)
      return
    }
    await datMarkerThatRef.current(0)
  }, [trongHost])

  /** Đặt thật (sau khi đã hỏi, hoặc không có marker cũ). `soCu` = số marker cũ đã báo trước. */
  const datMarkerThat = useCallback(async (soCu: number) => {
    const p = phienRef.current
    if (!p || chayRef.current) return
    const nguon: NguonChon = tabRef.current === 'loi' ? 'cau' : 'khoi'
    let dsMarker: { giay: number; den: number; ten: string; ghiChu: string }[]
    if (nguon === 'cau') {
      if (!p.chonCau) return
      const dsCau = vungCauDs(p)
      const [tuG, denG] = mocDsCau(dsCau)
      const cauTen = dsCau.find((c) => !c.bia)
      // MỘT marker phủ cả vùng câu. Ghi chú nói bằng số (bao nhiêu câu, dài bao
      // lâu) — người mở marker trên Timeline biết mình đã khoanh cái gì.
      dsMarker = [
        {
          giay: tuG,
          den: denG,
          ten: rutGon(cauTen ? cauTen.chu : mocHienThi(tuG), 60),
          ghiChu: dp('{n} câu · {t}', { n: dsCau.length, t: mocHienThi(Math.max(0, denG - tuG)) }),
        },
      ]
    } else {
      const ds = khoiRef.current.filter((k) => !k.bo && p.chon.indexOf(k.dau) >= 0)
      if (!ds.length) return
      const so = danhSo(khoiRef.current)
      dsMarker = ds.map((k) => {
        const n = so.get(k.dau)
        const ten = tenKhoi(k, Object.prototype.hasOwnProperty.call(p.chia.tieuDeTay, k.dau))
        return { giay: k.tu, den: k.den, ten: (n ? n + ' ' : '') + rutGon(ten, 60), ghiChu: k.traLoiDau }
      })
    }
    const khoa = kyHieu(p, nguon, '')
    setThongBao(null)
    const viec: ViecChay = { viec: 'marker', batDau: Date.now(), phanTram: -1 }
    chayRef.current = viec
    setChay(viec)
    try {
      await napLaiHost()
      const r = await datMarker(p.seqId, dsMarker)
      // Host xoá marker cũ của panel RỒI mới đặt — có xoá hoặc có đặt là số trên
      // sequence đã đổi thành `daDat`, kể cả khi đặt thiếu (lỗi DAT_THIEU).
      if (r.daDat > 0 || r.daXoa > 0) setSoMarker(r.daDat)
      if (r.loi) {
        setThongBao(thongBaoLoi(r.loi))
        return
      }
      setDaDat({ n: r.daDat, khoa })
      // Nút xanh "Đã đặt N marker" đã nói việc thành công — chỉ nói thêm khi có
      // con số cần soát (bản đầu host trả mấy số này mà panel bỏ qua — bài 5l).
      const cau: string[] = []
      // Số marker cũ bị thay KHÁC số đã hỏi (người dùng đặt / xoá tay trong lúc hỏi).
      if (r.daXoa !== soCu) cau.push(dp('Đã thay {n} marker cũ của panel.', { n: r.daXoa }))
      if (r.soDiem > 0) cau.push(dp('{n} marker chỉ đặt được dạng điểm (Premiere không nhận độ dài).', { n: r.soDiem }))
      // Mốc đầu đọc lại lệch quá một khung → marker nằm sai chỗ dù "đặt đủ" (CHƯA ĐO
      // với sequence có timecode bắt đầu khác 0 — sequence dựng từ multicam hay gặp).
      if (r.lechDau !== null && Math.abs(r.lechDau) > r.khung + 1e-3) {
        // ☠️ Chữ phải đúng cho CẢ HAI nguồn chọn: đặt marker từ VÙNG CÂU (tab
        // "Toàn bộ lời") thì không có khối nào — câu cũ bắt người dùng đi tìm một
        // cái khối không tồn tại, đúng lúc đang có chuyện cần soát (sửa 21/09).
        cau.push(dp('Marker nằm lệch {x} giây so với mốc đầu đã chọn — kiểm tra lại trên Timeline.', { x: r.lechDau.toFixed(2) }))
      }
      if (cau.length) setThongBao({ loai: 'canh', loi: { chu: cau.join(' '), chiTiet: '' } })
    } catch (e) {
      setThongBao(thongBaoLoi(e))
    } finally {
      chayRef.current = null
      setChay(null)
    }
  }, [])
  const datMarkerThatRef = useRef(datMarkerThat)
  datMarkerThatRef.current = datMarkerThat

  /** Số marker trên nút Xoá có thể cũ (người dùng xoá tay trong Premiere) — đếm lại khi rê chuột vào, tối đa 2 s một lần. */
  const lamMoiSoMarker = useCallback(() => {
    const id = seqIdRef.current
    if (!trongHost || !id || chayRef.current || Date.now() - lanDemMarkerRef.current < 2000) return
    lanDemMarkerRef.current = Date.now()
    banRef.current++
    demMarker(id)
      .then((n) => {
        if (n >= 0 && seqIdRef.current === id) setSoMarker(n)
      })
      .catch(() => {})
      .finally(() => {
        banRef.current--
      })
  }, [trongHost])

  /** Bấm "Xoá marker": ĐẾM LẠI ngay lúc bấm rồi mới hỏi — không hỏi bằng số cũ. */
  const moXoaMarker = useCallback(async () => {
    const id = seqIdRef.current
    if (!trongHost || !id || chayRef.current) return
    banRef.current++
    try {
      const n = await demMarker(id)
      if (n < 0) {
        // -1 = không đếm được. KHÔNG hỏi "xoá ? marker" — hậu quả phải là số thật.
        setThongBao({ loai: 'loi', loi: { chu: dich('Không đếm được marker trên sequence này — chưa xoá gì.'), chiTiet: '' } })
        return
      }
      setSoMarker(n)
      if (n === 0) {
        setThongBao({ loai: 'ok', loi: { chu: dich('Sequence này không còn marker nào do panel đặt.'), chiTiet: '' } })
        return
      }
      setXacNhanXoa(n)
    } catch (e) {
      setThongBao(thongBaoLoi(e))
    } finally {
      banRef.current--
    }
  }, [trongHost])

  const xoaMarkerThat = useCallback(async () => {
    const id = seqIdRef.current
    const n = xacNhanXoa
    setXacNhanXoa(null)
    if (!id || n === null || chayRef.current) return
    const viec: ViecChay = { viec: 'marker', batDau: Date.now(), phanTram: -1 }
    chayRef.current = viec
    setChay(viec)
    try {
      await napLaiHost()
      const r = await xoaMarker(id)
      if (r.loi) {
        setThongBao(thongBaoLoi(r.loi))
        return
      }
      setSoMarker(Math.max(0, n - r.daXoa))
      setDaDat(null)
      // Xoá đủ thì im lặng (marker biến mất ngay trên timeline); lệch số thì nói.
      if (r.daXoa !== n) {
        setThongBao({ loai: 'canh', loi: { chu: dp('Đã xoá {a}/{b} marker.', { a: r.daXoa, b: n }), chiTiet: '' } })
      }
    } catch (e) {
      setThongBao(thongBaoLoi(e))
    } finally {
      chayRef.current = null
      setChay(null)
    }
  }, [xacNhanXoa])

  const chonHet = useCallback(() => {
    // Tab "Toàn bộ lời": chọn hết = cả bài thành một vùng (đang lọc thì vẫn là
    // CẢ BÀI, vì vùng chọn là một khoảng liền — DsLoi nói ra số câu đang ẩn).
    if (tabRef.current === 'loi') {
      capNhatPhien((p) => {
        const n = p.nd.cau.length
        if (!n) return p
        const v = p.chonCau
        if (v && v.dau === 0 && v.cuoi === n - 1) return { ...p, chonCau: null }
        return { ...p, chonCau: { neo: 0, dau: 0, cuoi: n - 1 } }
      })
      return
    }
    // Tab khối: MỘT hàm thuần đảo trạng thái (hoidap.ts) — cùng hàm mà pill dùng
    // để viết nhãn, nên nhãn "Bỏ chọn (31)" không bao giờ nói khác việc cú bấm làm.
    // Chỉ đụng khối ĐANG HIỆN; khối đã chọn mà ô tìm che thì giữ nguyên.
    const ds = khoiHienRef.current
    capNhatPhien((p) => {
      const chon = daoChonHet(ds, p.chon)
      return chon === p.chon ? p : { ...p, chon }
    })
  }, [capNhatPhien])

  const doiCheDoTao = useCallback((c: CheDoTao) => {
    setCheDoTao(c)
    ghiCheDoTao(c)
  }, [])

  // ── Suy ra để vẽ ──────────────────────────────────────────────────────
  const chayDoc = chay?.viec === 'doc' ? chay : null
  const chayBar = chay && chay.viec !== 'doc' ? chay : null
  // Đọc theo CLIP ĐANG CHỌN rồi bấm ra chỗ trống (bỏ chọn) KHÔNG phải vùng đổi —
  // clip đã đọc vẫn nguyên. Bản đầu so vân tay 'chon:N' với 'io:…'/'trong' nên hiện
  // nút vàng "Vùng đã đổi" giả, bấm vào lại đọc theo In/Out = vùng khác hẳn (soát 19/09).
  const vungDoi =
    !!phien &&
    !cheDoThu &&
    nguon !== null &&
    khoaVung(nguon) !== phien.mocVung &&
    !(phien.vung.cheDo === 'chon' && nguon.soChon === 0)
  // soChon = -1: bản Premiere không cho biết clip đang chọn → cứ cho bấm, host
  // tự quyết và báo đúng câu nếu thiếu vùng.
  const coVung = !!nguon && (nguon.soChon !== 0 || (nguon.vao >= 0 && nguon.ra > nguon.vao))
  // KHÔNG khoá khi thiếu bộ nghe (soát 19/09): đủ đệm dùng chung (Autocut /
  // Transcripts đã nghe) thì không cần bộ nghe — nghe.ts chỉ đòi khi phải nghe mới
  // và tự báo THIEU_BO_MAY (tô vàng). Khoá ở đây là chặn oan người có sẵn đệm.
  const coTheDoc = cheDoThu || (trongHost && !!seqId && coVung)
  const khoiDangMenu = menu ? khoi.find((k) => k.dau === menu.dau) ?? null : null
  const iMenu = khoiDangMenu ? khoi.indexOf(khoiDangMenu) : -1
  // Nguồn lựa chọn cho thanh đáy = tab đang xem. Đổi tab KHÔNG xoá lựa chọn bên
  // kia: chọn 5 khối ở tab khối, sang tab lời khoanh một vùng câu, quay lại thì
  // 5 khối vẫn còn.
  const nguonChon: NguonChon = tab === 'loi' ? 'cau' : 'khoi'
  const soChonHien = nguonChon === 'cau' ? (cauChon ? cauChon.length : 0) : khoiChon.length
  const tatCaHien =
    nguonChon === 'cau'
      ? !!phien && !!phien.chonCau && phien.chonCau.dau === 0 && phien.chonCau.cuoi === phien.nd.cau.length - 1
      : ttChon.muc === 'het'
  const coTheChonHien = nguonChon === 'cau' ? !!phien && phien.nd.cau.length > 0 : ttChon.muc !== 'khong'
  /**
   * Dòng đếm trên thanh tiến độ lúc dựng sequence. Chỉ hiện khi có TỪ HAI bước
   * trở lên — "1/1" không nói thêm được gì (vùng câu luôn ra một sequence).
   *
   * MỘT câu cho CẢ HAI cách tạo (gộp / mỗi khối một sequence): đơn vị việc của
   * cả hai đúng là MỘT KHỐI, và câu ngắn mới vừa khổ 300 px. Cách tạo đã nói ở
   * nhãn nút chính.
   *
   * ☠️ SỐ ĐO SỬA LẠI 21/09 — mấy con số ghi lần đầu ở đây ("cần 170 px", "chỗ
   * 158–169 px", "= 138 px", "thừa ≥ 20 px") đều THIẾU, vì thước cũ là canvas
   * measureText chứ không phải bề rộng dàn trang, và không tính bề rộng thanh
   * cuộn (`--rong-thanh-cuon` 11–15 px khi danh sách dài) lẫn nhãn nút Dừng.
   * Đo lại bằng DOM thật trên dist đã build (72 cảnh, xem `DangChay.tsx`):
   * "Đang đưa khối 12/12" = 132,6 px · chỗ cho chữ 97–175 px · hẹp nhất còn
   * dùng được (gutter 15 + đồng hồ "100:05") = 140 px → còn thừa 7,4 px.
   * Kết luận vẫn như cũ (câu "Đang tạo sequence 12/12" dài hơn thì tràn), chỉ
   * con số là sai. Đừng đọc chú thích này rồi tưởng còn 20 px trống mà nhét
   * thêm thứ gì vào thanh — phải đo lại với BA biến đó.
   */
  const demChay =
    chayBar && chayBar.viec === 'tao' && dua && dua.n > 1
      ? dp('Đang đưa khối {i}/{n}', { i: dua.i, n: dua.n })
      : undefined
  /**
   * Câu nằm TRONG vùng chọn mà ô tìm đang che. Vùng chọn là một khoảng id liền
   * nhau, nên Shift+bấm lúc đang lọc là gom cả câu không khớp — phải nói ra bằng
   * số, không thì người dùng tưởng mình chọn 3 câu mà thật ra 300.
   */
  let soCauAn = 0
  if (nguonChon === 'cau' && phien?.chonCau && khop) {
    for (let i = phien.chonCau.dau; i <= phien.chonCau.cuoi; i++) if (!khop.has(i)) soCauAn++
  }
  /**
   * KHỐI đang chọn mà ô tìm đang che — cùng khuôn với `soCauAn` của tab "Toàn bộ
   * lời" (soát 21/09, brain 5k-bis). Vì sao phải nói ra: ba con số trên cùng màn
   * hình đếm theo BA mẫu số khác nhau — pill "Chọn tất cả (3)" đếm khối ĐANG HIỆN,
   * thanh đáy "Đã chọn 20 khối" và nút "Tạo 20 sequence" đếm CẢ khối bị che (lượt
   * tạo lấy từ `khoiRef`, không phải `khoiHien`). Và với khối bị che thì hai thứ
   * anh Tiến giao (thẻ sáng lên · danh sách cuộn tới) im lặng không làm gì được vì
   * không có thẻ nào trong DOM — chỉ dòng đếm nhảy số. Nói bằng SỐ, đừng để im.
   * `ttChon.daChon` đếm trên khối đang hiện, `khoiChon` đếm trên mọi khối → hiệu
   * hai số là phần bị che, cùng một hàm với cú bấm nên không bao giờ nói khác việc.
   */
  const soKhoiAn = Math.max(0, khoiChon.length - ttChon.daChon)
  const daTaoHien = phien && daTao && daTao.khoa === kyHieu(phien, nguonChon, cheDoTao) ? daTao.n : null
  const daDatHien = phien && daDat && daDat.khoa === kyHieu(phien, nguonChon, '') ? daDat.n : null
  const coDemV1 = !!phien && phien.nd.coDemV1

  const dongMenuVaTraTieuDiem = () => {
    const nut = menu?.nut
    setMenu(null)
    if (nut && nut.isConnected) nut.focus()
  }

  return (
    <div className="app">
      <ThanhTren
        trongHost={trongHost}
        dsSeq={dsSeq}
        seqId={seqId}
        onDoiSeq={(id) => {
          doiSeq(id)
          // Hỏi Premiere NGAY cho sequence vừa chọn — đợi nhịp 1 giây thì dòng
          // nguồn còn hiện vùng của sequence cũ thêm tới 1 giây.
          soiRef.current?.()
        }}
        khoa={dangChay || cheDoThu}
      />

      <main
        className="than"
        ref={thanRef}
        // Người dùng đang thao tác trong danh sách → đừng tự cuộn theo đầu đọc.
        // Soát 19/09: bản đầu chỉ tính lăn chuột / chạm / bấm thanh cuộn — bấm
        // checkbox, mở menu "⋯", gõ đổi tên đều không tính, nên quá 4 giây là danh
        // sách giật về chỗ đang phát giữa lúc đang làm.
        onWheel={danhDauCuon}
        onTouchMove={danhDauCuon}
        onPointerDown={danhDauCuon}
        onKeyDown={danhDauCuon}
        onFocus={danhDauCuon}
      >
        {cheDoThu && (
          <p className="ghi-chu ghi-chu--thu">{dich('Chế độ thử ngoài Premiere — đọc từ file đệm, các nút ghi vào Premiere không chạy.')}</p>
        )}

        <DongNguon nguon={nguon} coSeq={!!seqId} />

        {vungDoi && !chayDoc && (
          <button type="button" className="nut-canh" onClick={() => yeuCauDocLai(false)}>
            <Ic ten="docLai" co={14} />
            {xacNhanDocLai === false
              ? dp('Đọc lại sẽ bỏ {n} lần sửa khối — bấm lần nữa để đọc lại', { n: phien ? phien.lui.length : 0 })
              : dich('Vùng đã đổi — đọc lại')}
          </button>
        )}

        {chayDoc && <DangChay batDau={chayDoc.batDau} phanTram={chayDoc.phanTram} onDung={cheDoThu ? undefined : dungDoc} dangDung={dangDung} />}

        {!phien && !chayDoc && (
          <section className="bat-dau">
            <p className="gioi-thieu">
              {dich('Máy nghe vùng đang chọn rồi chia thành từng khối hỏi–đáp. Gộp, tách, bỏ khối xong thì đặt marker hoặc tạo sequence mới.')}
            </p>
            <button
              type="button"
              className="btn btn--chinh btn--lon"
              disabled={!coTheDoc}
              onClick={() => void docNoiDung(false)}
            >
              {dich('Đọc nội dung')}
            </button>
            {!trongHost && !cheDoThu && <p className="ghi-chu">{dich('Panel này chỉ chạy bên trong Premiere.')}</p>}
            {trongHost && boMay && (
              <div className="thieu-may" role="alert">
                <p className="thieu-may__chu">{boMay}</p>
                <button type="button" className="btn btn--nho" onClick={kiemLaiBoMay}>
                  {dich('Kiểm lại')}
                </button>
              </div>
            )}
            {thongBao && <DongThongBao tb={thongBao} onDong={() => setThongBao(null)} />}
          </section>
        )}

        {phien && (
          <>
            {(coDemV1 || phien.nd.soClipBoQua > 0 || phien.vung.soTat > 0 || phien.soKhongFile > 0) && (
              <div className="ghi-chu-khoi">
                {coDemV1 && (
                  <div className="ghi-chu ghi-chu--canh">
                    <span>
                      {xacNhanDocLai === true
                        ? dp('Nghe lại sẽ bỏ {n} lần sửa khối — bấm lần nữa để nghe lại.', { n: phien.lui.length })
                        : dich('Nội dung lấy từ bản nghe cũ của Autocut (luôn nghe tiếng Việt). Video không phải tiếng Việt thì bấm Nghe lại.')}
                    </span>
                    <button type="button" className="btn btn--nho" disabled={dangChay || cheDoThu} onClick={() => yeuCauDocLai(true)}>
                      {dich('Nghe lại')}
                    </button>
                  </div>
                )}
                {phien.nd.soClipBoQua > 0 && (
                  <p className="ghi-chu">
                    {dp('Bỏ qua {n} clip chồng thời gian với phần đang đọc (cam phụ, B-roll, nhạc, mic rời, logo) — không đọc và không đưa vào sequence mới.', { n: phien.nd.soClipBoQua })}
                  </p>
                )}
                {phien.vung.soTat > 0 && (
                  <p className="ghi-chu">{dp('{n} clip đang tắt — không đọc.', { n: phien.vung.soTat })}</p>
                )}
                {phien.soKhongFile > 0 && (
                  // Host đếm mà bản đầu bỏ qua (soát 19/09): clip multicam source,
                  // sequence lồng, title bị bỏ IM LẶNG → nội dung thiếu mà không ai biết.
                  <p className="ghi-chu">{dp('{n} clip không có file gốc (title, sequence lồng, multicam) — không đọc.', { n: phien.soKhongFile })}</p>
                )}
              </div>
            )}

            <div className="cong-cu" ref={congCuRef}>
              <div className="tim">
                <Ic ten="tim" co={14} className="tim__ic" />
                <input
                  className="tim__o"
                  type="text"
                  value={oTim}
                  onChange={(e) => setOTim(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setOTim('')
                  }}
                  placeholder={dich('Tìm chữ (không cần gõ dấu)')}
                  aria-label={dich('Tìm chữ trong lời')}
                  spellCheck={false}
                  autoComplete="off"
                />
                {q && (
                  <span className="tim__dem">
                    {tab === 'khoi'
                      ? dp('{n} khối', { n: khoiHien.length })
                      : dp('{n} câu', { n: khop ? khop.size : 0 })}
                  </span>
                )}
                {oTim && (
                  <button type="button" className="nut-ic nut-ic--nho" aria-label={dich('Xoá ô tìm')} title={dich('Xoá ô tìm')} onClick={() => setOTim('')}>
                    <Ic ten="xoa" co={13} />
                  </button>
                )}
              </div>
              <div className="the-hang">
                <div className="the" role="tablist" aria-label={dich('Cách xem')}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'khoi'}
                    className={'the__nut' + (tab === 'khoi' ? ' the__nut--dang' : '')}
                    onClick={() => setTab('khoi')}
                  >
                    {dich('Khối hỏi–đáp')}
                    <span className="the__so">{khoi.length}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'loi'}
                    className={'the__nut' + (tab === 'loi' ? ' the__nut--dang' : '')}
                    onClick={() => setTab('loi')}
                  >
                    {dich('Toàn bộ lời')}
                    <span className="the__so">{phien.nd.cau.length}</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="nut-ic"
                  disabled={!phien.lui.length || dangChay}
                  onClick={hoanTac}
                  aria-label={dich('Hoàn tác')}
                  title={phien.lui.length ? dp('Hoàn tác ({n}) — Ctrl+Z', { n: phien.lui.length }) : dich('Chưa có gì để hoàn tác')}
                >
                  <Ic ten="hoanTac" />
                </button>
              </div>
              {/* Pill chọn/bỏ chọn tất cả — ĐẦU danh sách khối, và nằm TRONG thanh
                  công cụ dính nên cuộn xuống giữa 300 thẻ vẫn bấm được (thanh này
                  là tầng sticky DUY NHẤT — đừng thêm tầng thứ hai). Chỉ tab khối:
                  vùng câu ở tab "Toàn bộ lời" là một khoảng liền, chọn hết ở đó là
                  việc khác (nút chữ ở thanh đáy). */}
              {tab === 'khoi' && khoi.length > 0 && <PillChon tt={ttChon} khoa={dangChay} onBam={chonHet} />}
            </div>

            {tab === 'khoi' ? (
              <>
                {/* Nằm NGOÀI thanh công cụ dính (đừng làm tầng sticky cao thêm) —
                    cùng chỗ và cùng khuôn với dòng `soAn` của tab "Toàn bộ lời". */}
                {soKhoiAn > 0 && (
                  <p className="ghi-chu">
                    {dp('Đang chọn {n} khối, trong đó {m} khối không khớp ô tìm nên đang bị ẩn — nút tạo sequence vẫn dựng cả {n}.', {
                      n: khoiChon.length,
                      m: soKhoiAn,
                    })}
                  </p>
                )}
                <DsKhoi
                  khoi={khoiHien}
                  nhan={nhanSo}
                  nd={phien.nd}
                  tieuDeTay={phien.chia.tieuDeTay}
                  chon={chonSet}
                  moRong={moRong}
                  tro={tro}
                  dangSua={dangSua}
                  soKhop={soKhop}
                  q={q}
                  khoa={dangChay}
                  cb={cb}
                />
                {khoi.length > 0 && (
                  <p className="phim-tat">
                    <kbd>J</kbd>/<kbd>K</kbd> {dich('chọn khối')} · <kbd>Enter</kbd> {dich('nhảy tới')} · <kbd>M</kbd>{' '}
                    {dich('gộp với khối trên')} · <kbd>X</kbd> {dich('tích chọn')} · <kbd>Ctrl+Z</kbd> {dich('hoàn tác')}
                  </p>
                )}
                {trongHost && soMarker > 0 && xacNhanXoa === null && (
                  <button
                    type="button"
                    className="nut-nguy"
                    disabled={dangChay}
                    // Số trên nhãn có thể cũ (người dùng xoá tay marker trong Premiere) —
                    // đếm lại khi rê chuột tới. Bấm thì vẫn đếm lại lần nữa trước khi hỏi.
                    onMouseEnter={lamMoiSoMarker}
                    onFocus={lamMoiSoMarker}
                    onClick={() => void moXoaMarker()}
                  >
                    {dp('Xoá {n} marker panel đã đặt', { n: soMarker })}
                  </button>
                )}
                {xacNhanXoa !== null && (
                  <div className="xac-nhan" role="alertdialog" aria-label={dich('Xoá marker')}>
                    <p className="xac-nhan__chu">
                      {dp('Xoá {n} marker do panel đặt (tên bắt đầu bằng “SV ”)? Marker khác trên sequence giữ nguyên.', {
                        n: xacNhanXoa,
                      })}
                    </p>
                    <div className="xac-nhan__nut">
                      <button type="button" className="btn btn--nho" onClick={() => setXacNhanXoa(null)}>
                        {dich('Thôi')}
                      </button>
                      <button type="button" className="btn btn--nho btn--nguy" onClick={() => void xoaMarkerThat()}>
                        {dp('Xoá {n} marker', { n: xacNhanXoa })}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <DauLoi
                  soLieu={soLieu}
                  soChon={soChonHien}
                  soAn={soCauAn}
                  daChep={daChep}
                  khoa={dangChay}
                  coCau={phien.nd.cau.length > 0}
                  onChepHet={chepPhan}
                  onXuat={xuatPhan}
                />
                <DsLoi
                  nd={phien.nd}
                  khop={khop}
                  q={q}
                  dauKhoi={dauKhoi}
                  moCau={moCau}
                  onNhay={nhayCau}
                  onBam={bamCau}
                  onMo={moMotCau}
                  onChep={chepMotCau}
                />
                {/* ☠️ Shift+bấm và Esc KHÔNG có đường nào khác để người dùng biết
                    (chevron thì thấy được) — mà Shift+bấm là thứ DUY NHẤT gom được
                    một khoảng câu cho thanh đáy. Thiếu dòng này là "có đường VÀO mà
                    không có đường RA" (thêm 21/09, cùng khuôn với dòng của tab khối). */}
                {phien.nd.cau.length > 0 && (
                  <p className="phim-tat">
                    <kbd>{dich('Bấm')}</kbd> {dich('nhảy tới câu')} · <kbd>Shift</kbd>+{dich('bấm')}{' '}
                    {dich('chọn cả khoảng')} · <kbd>Esc</kbd> {dich('bỏ chọn')} · <kbd>→</kbd> {dich('xem từng từ')}
                  </p>
                )}
              </>
            )}
          </>
        )}
      </main>

      {phien && (
        <ThanhHanhDong
          nguon={nguonChon}
          soChon={soChonHien}
          tatCa={tatCaHien}
          coTheChon={coTheChonHien}
          cheDoTao={cheDoTao}
          onDoiCheDo={doiCheDoTao}
          onChonHet={chonHet}
          onTao={() => void taoSeq()}
          onMarker={() => void datMarkerKhoi()}
          daTao={daTaoHien}
          daDat={daDatHien}
          chay={chayBar ? { batDau: chayBar.batDau, phanTram: chayBar.phanTram } : null}
          demChay={demChay}
          onDung={chayBar && chayBar.viec === 'tao' ? dungTao : undefined}
          dangDung={dangDung}
          thongBao={thongBao}
          onDongThongBao={() => setThongBao(null)}
          khoa={dangChay}
          chiXem={!trongHost}
          xacNhanMarker={xacNhanMarker}
          onXacNhanMarker={() => {
            const n = xacNhanMarker
            setXacNhanMarker(null)
            void datMarkerThat(n ?? 0)
          }}
          onThoiMarker={() => setXacNhanMarker(null)}
        />
      )}

      {menu && khoiDangMenu && (
        <MenuKhoi
          viTri={menu.viTri}
          coTren={iMenu > 0}
          bo={khoiDangMenu.bo}
          onDong={dongMenu}
          onNhay={() => {
            dongMenuVaTraTieuDiem()
            void nhay(khoiDangMenu.tu)
          }}
          onDoiTen={() => {
            setMenu(null)
            setDangSua(khoiDangMenu.dau)
          }}
          onGop={() => {
            dongMenuVaTraTieuDiem()
            gopKhoi(khoiDangMenu.dau)
          }}
          onBo={() => {
            dongMenuVaTraTieuDiem()
            boKhoi(khoiDangMenu.dau)
          }}
        />
      )}
    </div>
  )
}
