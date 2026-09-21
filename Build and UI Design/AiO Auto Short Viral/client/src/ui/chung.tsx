/**
 * ui/chung.tsx — đồ dùng chung của phần giao diện Auto Short Viral.
 *
 * Nằm ở `ui/` (không ở `services/`) vì mọi thứ ở đây phục vụ VIỆC HIỆN RA màn
 * hình: dịch có chỗ trống, đồng hồ, tô chữ khớp tìm, icon, gói lỗi thành câu.
 * Không gọi Premiere, không gọi Node.
 */
import type { ReactNode } from 'react'
import { dich } from '../ngonngu'
import type { Khoi } from '../services/kieu'

/**
 * Tên hiện của khối. Khối "Mở đầu" chưa đổi tên thì DỊCH chữ "Mở đầu" (hoidap.ts
 * đặt sẵn tiếng Việt) — không thì bản EN hiện một chữ Việt lạc giữa màn hình,
 * đúng lỗi anh Tiến bắt ở Autocut 19/08.
 * (Nằm ở đây chứ không ở DsKhoi.tsx: file component mà xuất thêm hàm thường thì
 * Vite không Fast Refresh được — đo 19/09, log "tenKhoi export is incompatible".)
 */
export function tenKhoi(k: Khoi, daDoiTen: boolean): string {
  if (!daDoiTen && k.co.indexOf('mo-dau') >= 0) return dich('Mở đầu')
  return k.tieuDe || dich('(chưa có tên)')
}

// ═══ DỊCH CÓ CHỖ TRỐNG ════════════════════════════════════════════════════

/**
 * `dich()` kèm điền chỗ trống `{n}`.
 *
 * ☠️ Khoá phải là CẢ CÂU có chỗ trống (`'Đã chọn {n} khối'`), đừng ghép mẩu
 * (dịch "Đã chọn" + n + dịch "khối") — mẩu rời dịch ra tiếng Anh sai trật tự
 * từ, và bảng dịch phình ra toàn mảnh vụn. Cùng luật Transcripts đã trả giá.
 */
export function dp(k: string, thay: Record<string, string | number>): string {
  let s = dich(k)
  for (const kk of Object.keys(thay)) s = s.split('{' + kk + '}').join(String(thay[kk]))
  return s
}

// ═══ SỐ THẬP PHÂN ═════════════════════════════════════════════════════════

/**
 * Số lẻ theo dấu thập phân của ngôn ngữ đang dùng: tiếng Việt dùng PHẨY, tiếng
 * Anh dùng CHẤM.
 *
 * ☠️ Vì sao đi qua `dich(',')` (khoá một ký tự, bản EN là '.'): hàm này nằm ngoài
 * React nên không dùng được hook `useNgonNgu()`, mà `dich()` gọi được ở bất kỳ
 * đâu. Viết cứng dấu phẩy thì bản EN hiện "0,87" — người đọc tiếng Anh hiểu đó
 * là dấu ngăn nghìn, tức 87 lần con số thật.
 */
export function soLe(x: number, le = 1): string {
  const n = Number.isFinite(x) ? x : 0
  return n.toFixed(le).replace('.', dich(','))
}

// ═══ ĐỒNG HỒ ══════════════════════════════════════════════════════════════

/**
 * Mốc của MỘT TỪ: "m:ss,d" (có phần mười giây). Các từ cách nhau 0,2–0,6 giây
 * (đo trên đệm thật) nên hiện tới giây thôi là hai từ liền nhau ra cùng một mốc.
 */
export function mocTu(giay: number): string {
  const g = Number.isFinite(giay) && giay > 0 ? giay : 0
  const nguyen = Math.floor(g)
  const le = Math.floor((g - nguyen) * 10 + 1e-9)
  const h = Math.floor(nguyen / 3600)
  const p = Math.floor((nguyen % 3600) / 60)
  const s = nguyen % 60
  const hai = (x: number) => (x < 10 ? '0' + x : String(x))
  return (h > 0 ? `${h}:${hai(p)}:${hai(s)}` : `${p}:${hai(s)}`) + dich(',') + le
}

/** Độ dài một câu: "3,4 s" (VI) / "3.4s" (EN). */
export function daiHienThi(giay: number): string {
  return dp('{x} s', { x: soLe(Math.max(0, giay), 1) })
}

/** Giây trôi → "m:ss". Dùng cho đồng hồ lúc đang chạy (khác mốc timeline). */
export function dongHo(giay: number): string {
  const g = Math.max(0, Math.floor(giay))
  const m = Math.floor(g / 60)
  const s = g % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

// ═══ CHỮ ══════════════════════════════════════════════════════════════════

/** Rút gọn một câu về tối đa `toiDa` ký tự, cắt ở khoảng trắng gần nhất. */
export function rutGon(s: string, toiDa: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= toiDa) return t
  const cat = t.slice(0, toiDa)
  const i = cat.lastIndexOf(' ')
  return (i > toiDa * 0.5 ? cat.slice(0, i) : cat).replace(/[\s,.;:–-]+$/, '') + '…'
}

/**
 * Dải dấu tổ hợp U+0300–U+036F (sắc, huyền, hỏi, ngã, nặng, mũ, móc…).
 * Dựng bằng mã số thay vì viết thẳng vào regex: bản trước viết dạng thoát
 * backslash-u trong công cụ ghi file và nó bị ĐỔI thành ký tự dấu thật nằm
 * trần trong mã (vô hình khi đọc, đọc lại không biết regex đang lọc gì).
 */
const DAU_TO_HOP = '[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']'
const RE_DAU_MOI = new RegExp(DAU_TO_HOP, 'g')
const RE_DAU_MOT = new RegExp(DAU_TO_HOP)

/**
 * Bỏ dấu MỘT ký tự, giữ đúng 1:1 vị trí để tô được chỗ khớp.
 * `đ` không tách được bằng NFD (nó là chữ riêng, không phải d + dấu) nên phải
 * đổi tay — quên dòng này là gõ "dau" không tìm ra "đâu".
 */
function boDauKyTu(ch: string): string {
  if (ch === 'đ' || ch === 'Đ') return 'd'
  return ch.normalize('NFD').replace(RE_DAU_MOI, '').toLowerCase()
}

/** Bỏ dấu cả chuỗi + gộp khoảng trắng — dạng so khớp của ô tìm. */
export function boDau(s: string): string {
  let r = ''
  for (let i = 0; i < s.length; i++) r += boDauKyTu(s[i])
  return r.replace(/\s+/g, ' ').trim()
}

/**
 * Các đoạn [đầu, cuối) trong `chu` khớp `q` khi so KHÔNG DẤU.
 *
 * Chỉ để TÔ SÁNG. Câu nào được coi là khớp thì do `timChu()` của hoidap.ts
 * quyết định (một nguồn chân lý) — ở đây không tìm thấy đoạn nào thì dòng đó
 * vẫn hiện, chỉ không tô.
 */
export function khopKhongDau(chu: string, q: string): [number, number][] {
  const qn = boDau(q)
  if (!qn) return []
  let s = ''
  const viTri: number[] = []
  for (let i = 0; i < chu.length; i++) {
    const n = boDauKyTu(chu[i])
    for (let j = 0; j < n.length; j++) {
      s += n[j]
      viTri.push(i)
    }
  }
  // Khoảng trắng liên tiếp trong câu gốc vẫn khớp một khoảng trắng của ô tìm.
  const ra: [number, number][] = []
  let tu = 0
  for (;;) {
    const j = s.indexOf(qn, tu)
    if (j < 0) break
    const a = viTri[j]
    let b = viTri[j + qn.length - 1] + 1
    // Câu gốc ở dạng dấu rời (NFD) thì dấu nằm SAU chữ — kéo cuối đoạn qua dấu
    // để khỏi tô nửa chữ.
    while (b < chu.length && RE_DAU_MOT.test(chu[b])) b++
    ra.push([a, b])
    tu = j + qn.length
  }
  return ra
}

/** Hiện `chu`, tô `<mark>` chỗ khớp `q`. `q` rỗng thì trả nguyên văn. */
export function ToSang({ chu, q }: { chu: string; q: string }) {
  if (!q) return <>{chu}</>
  const ds = khopKhongDau(chu, q)
  if (!ds.length) return <>{chu}</>
  const phan: ReactNode[] = []
  let cu = 0
  ds.forEach(([a, b], i) => {
    if (a > cu) phan.push(chu.slice(cu, a))
    phan.push(<mark key={i}>{chu.slice(a, b)}</mark>)
    cu = b
  })
  if (cu < chu.length) phan.push(chu.slice(cu))
  return <>{phan}</>
}

// ═══ LỖI → CÂU NGƯỜI ĐỌC ĐƯỢC ═════════════════════════════════════════════

export interface LoiHien {
  /** Câu đã dịch, hiện lên màn hình. */
  chu: string
  /** Chi tiết kỹ thuật — CHỈ để trong tooltip, không hiện thẳng (luật: không mã thô). */
  chiTiet: string
}

/**
 * Lỗi do người dùng bấm Dừng — không phải lỗi, im lặng.
 * ☠️ ffmpeg.ts ném lỗi Dừng với `message` = câu ĐÃ DỊCH ("Đã dừng.") và mã nằm
 * ở `e.ma = 'DA_HUY'` — so `message` với 'DA_HUY' là trượt, panel sẽ báo đỏ
 * "Đã dừng." như một lỗi. Kiểm `ma` trước, `message` chỉ là đường lùi.
 */
export function laHuy(e: unknown): boolean {
  if (e && typeof e === 'object' && (e as { ma?: unknown }).ma === 'DA_HUY') return true
  const m = e instanceof Error ? e.message : typeof e === 'string' ? e : ''
  return m.indexOf('DA_HUY') >= 0
}

/**
 * Gói mọi kiểu lỗi (HostLoi của cep.ts, Error của nghe/moc, chuỗi) thành một
 * câu. ☠️ Không bao giờ để mã thô kiểu `NHAP_LOI|importFiles…` lên màn hình —
 * panel tải video của bộ đã lộ đúng lỗi đó (khuon-panel.md, cep.ts:58). Mã nằm trước
 * dấu `|` thì cắt đi, phần kỹ thuật dời vào tooltip.
 */
export function thanhLoi(e: unknown): LoiHien {
  // LoiNoiDung (moc.ts): `message` đã điền số nên KHÔNG còn là khoá dịch —
  // dịch `khoa` rồi mới điền `thay`.
  if (e && typeof e === 'object' && 'khoa' in e && 'thay' in e) {
    const l = e as { khoa: unknown; thay: unknown }
    if (typeof l.khoa === 'string' && l.thay && typeof l.thay === 'object') {
      return { chu: dp(l.khoa, l.thay as Record<string, string | number>), chiTiet: '' }
    }
  }
  if (e && typeof e === 'object' && 'thongDiep' in e) {
    const h = e as { thongDiep?: unknown; chiTiet?: unknown }
    return {
      chu: String(h.thongDiep || '') || dich('Premiere không làm được việc này.'),
      chiTiet: String(h.chiTiet || ''),
    }
  }
  const tho = e instanceof Error ? e.message : String(e ?? '')
  // Lỗi đã có câu cho người dùng + phần kỹ thuật riêng (`chiTiet`: ffmpeg.ts
  // `loiKhongChayDuoc`, whisper.ts `trichTieng`) → câu lên màn hình, kỹ thuật vào tooltip.
  const chiTietRieng = e && typeof e === 'object' ? (e as { chiTiet?: unknown }).chiTiet : undefined
  if (typeof chiTietRieng === 'string' && chiTietRieng && tho) return { chu: tho, chiTiet: chiTietRieng }
  // Lưới cuối: lỗi Node thô lọt tới đây ("spawn … ENOENT", "Command failed: <dòng
  // lệnh>") thì KHÔNG hiện nguyên văn — nó lộ đường dẫn + tên công cụ nền.
  if (/^(spawn\s|Command failed)/.test(tho)) {
    return { chu: dich('Không chạy được bộ xử lý media. Cài lại panel hoặc khởi động lại máy.'), chiTiet: tho }
  }
  const sach = tho.replace(/^ERR:/, '').replace(/^[A-Z0-9_]{3,}\|/, '').trim()
  // Chỉ còn trơ một mã (không có câu nào) thì đừng hiện mã — nói chung chung,
  // mã để trong tooltip cho lần chẩn đoán sau.
  if (!sach || /^[A-Z0-9_]+$/.test(sach)) return { chu: dich('Có lỗi không rõ nguyên nhân.'), chiTiet: tho }
  return { chu: sach, chiTiet: sach === tho ? '' : tho }
}

// ═══ ICON ═════════════════════════════════════════════════════════════════
//
// ☠️ LUẬT ICON 07/08: SVG inline, viewBox 24, fill none, stroke currentColor,
// nét 1.9, đầu tròn. KHÔNG emoji (Segoe UI Emoji vẽ khối đen khi panel hẹp).
// Đường nét lấy nguyên từ bộ Lucide (giấy phép ISC — bán được), KHÔNG tự vẽ
// bằng tay: 08/09 tự vẽ icon trung tâm brain-map bị anh Tiến gọi là "xấu điên".
// Riêng `ngoac` (dấu ngoặc In/Out) chép từ `.selbar` của Transcripts cho hai
// panel mở cạnh nhau nói cùng một kiểu.

const DUONG = {
  /** Lucide messages-square — hai bong bóng lời: HỎI và ĐÁP. */
  hoiDap: (
    <>
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </>
  ),
  ngoac: <path d="M9 4H5v16h4M15 4h4v16h-4" />,
  /** Lucide rectangle-horizontal — một clip trên timeline. */
  clip: <rect width="20" height="12" x="2" y="6" rx="2" />,
  tim: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  xoa: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  xuong: <path d="m6 9 6 6 6-6" />,
  /** Lucide check — mục đang chọn trong menu. */
  dung: <path d="M20 6 9 17l-5-5" />,
  /** Lucide minus — ô tích của pill ở trạng thái NỬA VỜI (chọn một phần). */
  gach: <path d="M5 12h14" />,
  phai: <path d="m9 18 6-6-6-6" />,
  them: (
    <>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </>
  ),
  but: (
    <>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </>
  ),
  hoanTac: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
    </>
  ),
  keo: (
    <>
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12 12 12" />
      <path d="M20 4 8.12 15.88" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
    </>
  ),
  docLai: (
    <>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  /** Lucide copy — chép vào bộ nhớ tạm. */
  chep: (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
  /** Lucide download — xuất ra file. */
  xuatFile: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </>
  ),
  canh: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
}

export type TenIc = keyof typeof DUONG

export function Ic({ ten, co = 16, className }: { ten: TenIc; co?: number; className?: string }) {
  return (
    <svg
      className={'ic' + (className ? ' ' + className : '')}
      width={co}
      height={co}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {DUONG[ten]}
    </svg>
  )
}
