import { dich } from '../ngonngu'
import type { CheDoVung, ClipVung, DoanNguon, VungLam } from '../services/kieu'

/**
 * cep.ts — cầu nối panel ↔ Premiere của AiO Auto Short Viral (0.1.0, 19/09/2026).
 *
 * Khung chép từ panel tải video của bộ (khuôn 08/09) / Transcripts (đã chạy thật trong Premiere). Mọi
 * hàm host ở `host/shortviral.jsx`, tiền tố `sv_`.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * BA LUẬT CỦA FILE NÀY
 * ══════════════════════════════════════════════════════════════════════════
 * 1. MỌI hàm nhận `seqId` và host tự tìm sequence theo ID. ☠️ Không có hàm nào
 *    "làm trên sequence đang mở": activeSequence TRÔI về tab Timeline có tiêu
 *    điểm (Transcripts 24/08: 37 clip caption rơi sang sequence khác, panel báo
 *    thành công). Panel giữ ID của thứ người dùng đang thấy, gửi kèm mỗi lần.
 * 2. Host trả MÃ, file này dịch ra CÂU (`dichLoi`). Không bao giờ để mã thô
 *    ("CHUA_KHOANH_VUNG") lên màn hình — nhìn y như lỗi hệ thống, và việc người
 *    dùng CẦN LÀM bị hiện ra như HỎNG HÓC (`laViecCanLam` tách hai loại đó).
 * 3. Chuỗi gửi sang ExtendScript đi qua `jsx()`: mọi ký tự ngoài ASCII in được
 *    đổi thành \uXXXX. Không phụ thuộc bảng mã của cầu CEP, không có đường nào
 *    để dấu `\` hay `"` trong chữ phá lệnh (skill 6e: `\2` là escape bát phân).
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NHẸ / NẶNG
 * ══════════════════════════════════════════════════════════════════════════
 * - Hàm NHẸ (docVung, viTriDauDoc, nhayToi, demMarker, dsSequence): gọi được
 *   theo nhịp giây / mỗi cú bấm. KHÔNG nạp lại host mỗi lần — chỉ nạp khi phiên
 *   panel này chưa nạp lần nào, hoặc hàm chưa có trong engine.
 * - Hàm NẶNG / GHI (docVungLam, datMarker, xoaMarker, taoSequence, noiTiepSequence):
 *   luôn `napLaiHost()` trước (Premiere nạp host ĐÚNG MỘT LẦN lúc khởi động — cài
 *   bản mới rồi reload panel là giao diện mới nói chuyện với host cũ) và KIỂM
 *   `sv_phienBan()` khớp `PHIEN_BAN_HOST`, lệch thì KHÔNG chạy.
 * - ExtendScript MỘT LUỒNG: lúc hàm nặng đang chạy, hàm nhẹ xếp hàng sau nó và
 *   hết giờ chờ (HET_GIO). Vòng thăm dò của giao diện phải NGỪNG trong lúc
 *   dựng/đặt marker (skill 19c), đừng coi HET_GIO lúc đó là hỏng.
 */

declare global {
  interface Window {
    __adobe_cep__?: unknown
    CSInterface?: new () => CSInterfaceLike
    SystemPath?: Record<string, string>
  }
}

interface CSInterfaceLike {
  isInHost(): boolean
  evalScript(script: string, cb: (result: string) => void): void
  getApplicationID(): string | null
  getSystemPath(pathType: string): string
}

/** Phiên bản host mà giao diện này cần — phải khớp `sv_phienBan()` ở CUỐI host/shortviral.jsx. */
export const PHIEN_BAN_HOST = '0.1.2'

/** Chờ tối đa cho hàm nhẹ (skill 6f: ~8 s — quá thì gần như chắc có hộp thoại modal chặn engine). */
const CHO_NHE = 8000
const CHO_DOC_VUNG = 60000
const CHO_MARKER = 30000
/** Dựng sequence: overwriteClip ~0,3 s/clip và chậm dần theo độ đông timeline (skill 18f) — trần rộng. */
function choDung(soDoan: number): number {
  return 30000 + 3000 * soDoan
}

/** Ngăn trường / ngăn bản ghi — cách Transcripts đã chạy thật khi gửi caption có chữ Việt. */
const US = String.fromCharCode(0x1f)
const RS = String.fromCharCode(0x1e)

let _cs: CSInterfaceLike | null = null

export function cs(): CSInterfaceLike | null {
  if (_cs) return _cs
  if (typeof window === 'undefined' || !window.CSInterface) return null
  _cs = new window.CSInterface()
  return _cs
}

/** Có đang chạy bên trong Premiere không. */
export function isInHost(): boolean {
  const c = cs()
  return !!c && c.isInHost()
}

/**
 * Chạy ExtendScript, trả Promise<string>.
 * @param choToiDa  ms; > 0 thì quá giờ trả 'ERR:HET_GIO|<giây>'. Lệnh host VẪN chạy
 *                  tiếp trong Premiere — hết giờ chỉ là panel thôi chờ.
 */
export function evalScript(script: string, choToiDa = 0): Promise<string> {
  return new Promise((resolve) => {
    const c = cs()
    if (!c) {
      resolve('')
      return
    }
    let xong = false
    let hen: ReturnType<typeof setTimeout> | undefined
    if (choToiDa > 0) {
      hen = setTimeout(() => {
        if (xong) return
        xong = true
        resolve('ERR:HET_GIO|' + Math.round(choToiDa / 1000))
      }, choToiDa)
    }
    c.evalScript(script, (result: string) => {
      if (xong) return
      xong = true
      if (hen) clearTimeout(hen)
      resolve(result)
    })
  })
}

/** Kết quả thô của host: `ma` là mã lỗi ('' khi OK), `noiDung` là phần sau 'OK:' hoặc chi tiết sau '|'. */
export interface HostResult {
  ok: boolean
  ma: string
  noiDung: string
}

/** Tách "OK:..." / "ERR:MA|chi tiet" — MÃ thành trường riêng để dịch. */
export function parseResult(raw: string): HostResult {
  if (raw === undefined || raw === null || raw === '') return { ok: false, ma: 'KHONG_PHAN_HOI', noiDung: '' }
  const s = String(raw)
  if (s.indexOf('OK:') === 0) return { ok: true, ma: '', noiDung: s.slice(3) }
  if (s.indexOf('ERR:') === 0) {
    const than = s.slice(4)
    const v = than.indexOf('|')
    const ma = v >= 0 ? than.slice(0, v) : than
    const chiTiet = v >= 0 ? than.slice(v + 1) : ''
    // Mã hợp lệ chỉ gồm chữ in + số + gạch dưới. Khác thế = host trả câu tự do.
    if (!/^[A-Z0-9_]+$/.test(ma)) return { ok: false, ma: 'KHONG_RO', noiDung: than }
    return { ok: false, ma, noiDung: chiTiet }
  }
  if (s.indexOf('EvalScript error') >= 0) return { ok: false, ma: 'EVALSCRIPT_LOI', noiDung: s }
  return { ok: false, ma: 'KHONG_RO', noiDung: s }
}

/** Đường dẫn thư mục extension trên đĩa. */
export function extensionPath(): string {
  const c = cs()
  if (!c || !window.SystemPath) return ''
  return c.getSystemPath(window.SystemPath.EXTENSION)
}

/**
 * Tách các dòng "khoá=giá trị" host trả về (lấy lần xuất hiện ĐẦU của mỗi khoá).
 * ☠️ Đừng tự dựng regex từ template literal để đọc số: Transcripts 30/07 viết
 * "\d" trong template literal, gạch chéo rụng, pattern thành "d+" — host trả
 * `marker=60` mà panel đọc ra 0, hỏng câm. Tách theo dòng thì không có tầng
 * escape nào để sai.
 */
export function parseKV(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const i = line.indexOf('=')
    if (i > 0 && !(line.slice(0, i) in out)) out[line.slice(0, i).trim()] = line.slice(i + 1)
  }
  return out
}

// ── Mã hoá tham số gửi sang ExtendScript ─────────────────────────────────────

/**
 * Chuỗi JS → literal ExtendScript (ES3) trong ngoặc kép.
 * Mọi ký tự ngoài ASCII in được (chữ Việt, U+001E/U+001F, xuống dòng, U+2028…)
 * thành \uXXXX: ExtendScript hiểu escape này trong chuỗi, và không còn ký tự
 * nào phụ thuộc bảng mã khi đi qua cầu CEP. U+2028/2029 để trần trong literal
 * ES3 là KẾT THÚC DÒNG → lỗi cú pháp; escape rồi thì hết.
 */
function jsx(s: string): string {
  let out = '"'
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c === 0x5c) out += '\\\\'
    else if (c === 0x22) out += '\\"'
    else if (c >= 0x20 && c < 0x7f) out += s[i]
    else out += '\\u' + c.toString(16).padStart(4, '0')
  }
  return out + '"'
}

/** Chữ đi vào một trường: bỏ hai ký tự ngăn để chữ không bao giờ phá khung bản ghi. */
function truong(s: string): string {
  return String(s ?? '').split(RS).join(' ').split(US).join(' ')
}

/** Số → chuỗi đủ độ chính xác. Không hữu hạn thì 'NaN' để host loại đoạn đó (và đếm). */
function soChuoi(n: number): string {
  return Number.isFinite(n) ? String(n) : 'NaN'
}

/** Đường dẫn Windows → gạch xuôi (skill 6e). */
function duong(p: string): string {
  return String(p ?? '').replace(/\\/g, '/')
}

// ── Lỗi: mã → câu ───────────────────────────────────────────────────────────

export interface HostLoi {
  /** Mã máy — để code rẽ nhánh. KHÔNG hiện lên màn hình. */
  ma: string
  /** Câu cho người dùng (đã qua dich()). */
  thongDiep: string
  /** Chi tiết kỹ thuật (lỗi nguyên văn của Premiere…) — chỉ hiện khi bấm "chi tiết". */
  chiTiet: string
}

/**
 * Mã host/cầu → câu cho người dùng, qua dich().
 * `x` điền vào chỗ trống `{x}` của câu (con số, số phiên bản…).
 * ☠️ Câu có chỗ trống thì giữ NGUYÊN CÂU làm khoá dịch rồi `.replace('{x}')` —
 * đừng cắt thành mấy mẩu rời, mẩu rời dịch ra đọc không thành câu (Transcripts).
 */
export function dichLoi(ma: string, x = ''): string {
  const dien = (cau: string) => cau.replace('{x}', () => x)
  switch (ma) {
    // ── Người dùng cần làm một việc (không phải hỏng) ──
    case 'CHUA_MO_PROJECT':
      return dich('Chưa mở project nào trong Premiere.')
    case 'THIEU_ID':
      return dich('Chưa chọn sequence để làm.')
    case 'KHONG_THAY_SEQUENCE':
      return dich('Không tìm thấy sequence đang chọn — có thể nó vừa bị xoá hoặc project vừa đổi. Chọn lại sequence.')
    case 'MO_KHONG_AN':
      return dich('Premiere không chuyển sang được sequence đang chọn. Bấm vào tab của sequence đó trên Timeline rồi thử lại.')
    case 'CHUA_KHOANH_VUNG':
      return dich('Chưa khoanh vùng. Trên Timeline: đặt điểm vào bằng phím I, điểm ra bằng phím O, rồi bấm lại.')
    case 'CHUA_CHON_CLIP':
      return dich('Chưa chọn clip nào trên Timeline. Bấm chọn clip rồi bấm lại.')
    case 'CHUA_CHON_GI':
      return dich('Chưa chọn clip và cũng chưa khoanh vùng. Chọn clip trên Timeline, hoặc đặt điểm vào (I) và điểm ra (O), rồi bấm lại.')
    case 'KHONG_DO_DUOC_CLIP_CHON':
      return dien(dich('Premiere báo đang chọn {x} mục nhưng panel không tìm ra clip đó trên Timeline. Bỏ chọn, khoanh vùng bằng I và O rồi bấm lại.'))
    case 'CHON_MO_HO':
      return dien(dich('Có {x} clip nằm chồng đúng mốc với clip đang chọn nên panel không phân biệt được clip nào đang chọn. Bỏ chọn, khoanh vùng bằng I và O rồi bấm lại.'))
    case 'VUNG_KHONG_CO_CLIP':
      return dich('Chỗ đang chọn không có clip nào đọc được file gốc. Clip đang tắt, title và sequence lồng đều bị bỏ qua.')
    case 'DS_RONG':
      return dich('Không có mục nào để làm.')
    case 'CLIP_DA_DOI':
      return dich('Timeline đã thay đổi từ lúc panel đọc nội dung. Đọc lại nội dung rồi làm tiếp.')
    case 'DOAN_TRON_LOAI':
      return dich('Các đoạn lẫn cả clip hình và clip chỉ có tiếng — chưa dựng chung được một sequence.')
    case 'KHONG_CO_FILE_GOC':
      return dich('Có đoạn nằm trên clip không có file gốc (title, sequence lồng) nên không dựng được.')
    case 'DICH_KHONG_AN_TOAN':
      return dich('Sequence đích đã có clip nằm sau chỗ nối — nối thêm sẽ đè lên. Đã dừng, không đè.')
    case 'KHONG_THAY_SEQ_MOI':
      return dich('Không tìm thấy sequence vừa tạo — có thể nó đã bị xoá.')
    case 'HET_GIO':
      return dien(dich('Premiere không trả lời sau {x} giây — có thể đang mở một hộp thoại. Nhìn màn hình Premiere, đóng hộp thoại rồi thử lại.'))
    case 'NGOAI_PREMIERE':
      return dich('Panel này chỉ chạy bên trong Premiere.')

    // ── Hỏng thật ──
    case 'KHONG_PHAN_HOI':
      return dich('Không có phản hồi từ Premiere')
    case 'EVALSCRIPT_LOI':
    case 'CHUA_NAP':
      return dich('Phần điều khiển của panel chưa nạp vào Premiere. Đóng panel rồi mở lại.')
    case 'NAP_LOI':
      return dich('Không nạp được phần điều khiển của panel vào Premiere. Cài lại panel.')
    case 'HOST_CU':
      return dien(dich('Phần chạy trong Premiere đang là bản {x}, không khớp giao diện. Tắt hẳn Premiere rồi mở lại; còn lệch thì cài lại panel.'))
    case 'KHONG_DOC_DUOC':
      return dich('Không đọc được vị trí đầu đọc.')
    case 'GIAY_SAI':
      return dich('Mốc thời gian không hợp lệ.')
    case 'NHAY_LOI':
      return dich('Premiere không cho dời đầu đọc.')
    case 'NHAY_LECH':
      return dien(dich('Đầu đọc không tới đúng chỗ (lệch {x} giây).'))
    case 'THIEU_API':
      // Tên API (sequence.markers.createMarker…) là chữ kỹ thuật → chỉ ở chiTiet (tooltip).
      return dich('Bản Premiere này thiếu chức năng panel cần.')
    case 'XOA_MARKER_LOI':
      return dich('Không xoá được marker cũ của panel.')
    case 'DAT_THIEU':
      return dien(dich('Chỉ đặt được {x} marker.'))
    case 'DOAN_SAI':
    case 'CHE_DO_SAI':
      return dich('Dữ liệu gửi sang Premiere bị hỏng.')
    case 'KHONG_DOC_DUOC_INOUT':
      return dich('Không đọc được điểm vào/ra gốc của clip nguồn — đã dừng để không ghi đè.')
    case 'INOUT_LOI':
      return dich('Premiere không nhận điểm vào/ra của đoạn.')
    case 'INOUT_CHUA_TRA':
      return dien(dich('Đã dựng nhưng chưa trả lại được điểm vào/ra gốc của {x} clip nguồn. Mở clip đó trong Source Monitor để kiểm tra.'))
    case 'TAO_SEQ_LOI':
      return dich('Tạo sequence mới thất bại.')
    case 'KHONG_CO_TRACK':
      return dich('Sequence mới không có track để đặt clip.')
    case 'DICH_TRUNG_GOC':
      return dich('Không được nối vào chính sequence nguồn.')
    case 'DUNG_THIEU':
      return dien(dich('Sequence mới thiếu {x} đoạn — Premiere không nhận một số đoạn.'))
    case 'LECH_DO_DAI':
      return dien(dich('Độ dài sequence mới không khớp độ dài cần có ({x}).'))
    case 'THIEU_TIENG':
      return dien(dich('Sequence mới có {x} đoạn thiếu tiếng.'))
    case 'NGOAI_LE':
      return dich('Premiere báo lỗi khi chạy lệnh.')
    case 'KHONG_RO':
      return dich('Premiere trả về kết quả không đọc được.')
    default:
      return dich('Premiere báo lỗi chưa rõ nguyên nhân.')
  }
}

/** Mã là VIỆC NGƯỜI DÙNG CẦN LÀM, không phải hỏng hóc → giao diện không tô đỏ (luật anh Tiến: chỉ báo động khi thất bại thật). */
const VIEC_CAN_LAM = new Set([
  'CHUA_MO_PROJECT',
  'THIEU_ID',
  'KHONG_THAY_SEQUENCE',
  'MO_KHONG_AN',
  'CHUA_KHOANH_VUNG',
  'CHUA_CHON_CLIP',
  'CHUA_CHON_GI',
  'KHONG_DO_DUOC_CLIP_CHON',
  'CHON_MO_HO',
  'VUNG_KHONG_CO_CLIP',
  'DS_RONG',
  'CLIP_DA_DOI',
  'DOAN_TRON_LOAI',
  'KHONG_CO_FILE_GOC',
  'DICH_KHONG_AN_TOAN',
  'KHONG_THAY_SEQ_MOI',
  'HET_GIO',
  'NGOAI_PREMIERE',
])

export function laViecCanLam(loi: HostLoi | null): boolean {
  return !!loi && VIEC_CAN_LAM.has(loi.ma)
}

/** Dựng HostLoi. `x` điền vào câu; `chiTiet` mặc định = x. */
function taoLoi(ma: string, x = '', chiTiet?: string): HostLoi {
  return { ma, thongDiep: dichLoi(ma, x), chiTiet: chiTiet ?? x }
}

/**
 * HostLoi từ một kết quả hỏng — chỉ điền vào câu với những mã mà chi tiết LÀ con
 * số / số phiên bản người đọc được. ☠️ THIEU_API KHÔNG nằm ở đây (soát 19/09): chi
 * tiết của nó là tên API ("sequence.markers.createMarker") — điền vào câu là chữ
 * kỹ thuật lên thẳng màn hình. Nó đi nhánh mặc định: câu chung, tên API vào tooltip.
 */
function loiTu(r: HostResult): HostLoi {
  switch (r.ma) {
    case 'HET_GIO':
    case 'HOST_CU':
    case 'KHONG_DO_DUOC_CLIP_CHON':
      return taoLoi(r.ma, r.noiDung)
    default:
      return taoLoi(r.ma, '', r.noiDung)
  }
}

// ── Nạp host ───────────────────────────────────────────────────────────────

let daNap = false
let lanNapCuoi = 0
let loiNap: HostLoi | null = null

/**
 * NẠP LẠI host từ đĩa rồi KIỂM phiên bản. true = nạp trọn vẹn và khớp PHIEN_BAN_HOST.
 *
 * ☠️ Premiere nạp `host/index.jsx` ĐÚNG MỘT LẦN lúc extension khởi động. Cài bản
 * mới rồi reload panel = giao diện mới, host cũ, hàm mới báo "EvalScript error."
 * (Autocut 28/07). `$.evalFile` đọc thẳng đĩa nên luôn lấy bản mới.
 * ☠️ Gọi `$.evalFile` ở CẤP NGOÀI CÙNG, không bọc trong hàm: nó chạy nội dung
 * file trong scope chỗ gọi — bọc hàm là mọi hàm biến mất cùng scope đó, không
 * ném lỗi. try/catch cấp ngoài cùng vẫn giữ scope toàn cục.
 * ☠️ `$.evalFile` có thể NUỐT FILE GIỮA CHỪNG không báo lỗi (Podcast 01/08) →
 * đọc `sv_phienBan()` — hàm CUỐI file — ngay trong cùng lệnh. Khớp số = cả file
 * đã nạp.
 */
export async function napLaiHost(): Promise<boolean> {
  lanNapCuoi = Date.now()
  if (!isInHost()) {
    loiNap = taoLoi('NGOAI_PREMIERE')
    daNap = false
    return false
  }
  const ext = extensionPath()
  if (!ext) {
    // Chi tiết kỹ thuật (chỉ hiện ở tooltip): viết ASCII như mọi chi tiết host trả về —
    // có dấu thì bản EN lộ tiếng Việt, mà dịch thì phình bảng bằng câu người dùng không đọc.
    loiNap = taoLoi('NAP_LOI', '', 'extensionPath rong')
    daNap = false
    return false
  }
  const p = ext.replace(/\\/g, '/') + '/host/index.jsx'
  const raw = await evalScript(
    `var __svNap='OK'; try { $.evalFile(${jsx(p)}) } catch(e) { __svNap='ERR:'+e.toString() } ` +
      `__svNap + '|' + (typeof sv_phienBan==='function' ? sv_phienBan() : 'THIEU')`,
    CHO_NHE,
  )
  const s = String(raw ?? '')
  if (s.indexOf('ERR:HET_GIO|') === 0) {
    loiNap = loiTu(parseResult(s))
    daNap = false
    return false
  }
  const vach = s.lastIndexOf('|')
  const trangThai = vach >= 0 ? s.slice(0, vach) : s
  const phienBan = vach >= 0 ? s.slice(vach + 1) : ''
  if (trangThai !== 'OK') {
    loiNap = taoLoi('NAP_LOI', '', s)
    daNap = false
    return false
  }
  // ☠️ 'THIEU' = $.evalFile KHÔNG ném lỗi mà hàm cuối file vẫn chưa có — đúng ca
  // "nuốt file giữa chừng" ở trên. Đó là nạp HỎNG, không phải "host bản cũ": bản
  // đầu điền thẳng 'THIEU' vào câu HOST_CU → người dùng đọc "Phần chạy trong
  // Premiere đang là bản THIEU" (soát 19/09). Chỉ gọi là HOST_CU khi đọc được một
  // số phiên bản thật; còn lại là NAP_LOI, chuỗi thô vào tooltip.
  if (phienBan !== PHIEN_BAN_HOST) {
    loiNap = /^\d+(\.\d+){1,3}$/.test(phienBan) ? taoLoi('HOST_CU', phienBan) : taoLoi('NAP_LOI', '', s)
    daNap = false
    return false
  }
  loiNap = null
  daNap = true
  return true
}

/**
 * Lỗi NẠP host hiện tại (null = đã nạp trọn vẹn và khớp phiên bản, hoặc chưa thử).
 * Vòng thăm dò dùng để tách "host hỏng" khỏi "chưa mở sequence" — hai thứ trước
 * đây cùng hiện ra một câu "Chưa có sequence nào đang mở." (soát 19/09), và câu
 * "cài lại panel / tắt hẳn Premiere" không bao giờ tới được người dùng.
 */
export function loiNapHost(): HostLoi | null {
  return daNap ? null : loiNap
}

/**
 * Gọi hàm NHẸ: không nạp lại mỗi lần. Chưa nạp lần nào trong phiên thì nạp
 * (tối đa mỗi 10 s một lần — host lệch bản thì đừng đọc lại file mỗi giây).
 * Hàm chưa có trong engine → nạp rồi gọi lại đúng một lần.
 * ☠️ Lần nạp lại vì CHUA_NAP cũng phải theo giới hạn 10 s (soát 19/09): bản đầu
 * không giới hạn chỗ này → host hỏng thì vòng thăm dò (3 lệnh/giây) `$.evalFile`
 * lại file host ~1.400 dòng ~3 lần mỗi giây. Chỉ bỏ giới hạn khi phiên này ĐÃ nạp
 * được mà hàm lại biến mất (engine bị nạp lại) — lúc đó thử ngay một lần.
 * Host chưa nạp được thì trả MÃ NẠP THẬT (NAP_LOI / HOST_CU…) thay cho CHUA_NAP.
 */
async function goiNhe(ten: string, lenh: string, cho = CHO_NHE): Promise<HostResult> {
  if (!isInHost()) return { ok: false, ma: 'NGOAI_PREMIERE', noiDung: '' }
  if (!daNap && Date.now() - lanNapCuoi > 10000) await napLaiHost()
  let raw = await evalScript(`typeof ${ten}==='function' ? ${lenh} : 'ERR:CHUA_NAP|${ten}'`, cho)
  if (
    String(raw ?? '').indexOf('ERR:CHUA_NAP|') === 0 &&
    (daNap || Date.now() - lanNapCuoi > 10000) &&
    (await napLaiHost())
  ) {
    raw = await evalScript(lenh, cho)
  }
  const r = parseResult(raw)
  if (!r.ok && r.ma === 'CHUA_NAP' && !daNap && loiNap) return { ok: false, ma: loiNap.ma, noiDung: loiNap.chiTiet }
  return r
}

/** Gọi hàm NẶNG / GHI: luôn nạp lại + kiểm phiên bản trước; lệch là KHÔNG chạy. */
async function goiNang(lenh: string, cho: number): Promise<HostResult> {
  if (!isInHost()) return { ok: false, ma: 'NGOAI_PREMIERE', noiDung: '' }
  if (!(await napLaiHost())) {
    const l = loiNap ?? taoLoi('NAP_LOI')
    // Trả mã + chi tiết đúng dạng host để bên gọi dịch một đường (loiTu).
    return { ok: false, ma: l.ma, noiDung: l.chiTiet }
  }
  return parseResult(await evalScript(lenh, cho))
}

/** Engine ExtendScript còn trả lời không (skill 6f: không trả lời = có hộp thoại modal đang chặn). */
export async function pingHost(): Promise<boolean> {
  return (await evalScript('ping()', CHO_NHE)) === 'pong'
}

// ── Sequence ────────────────────────────────────────────────────────────────

/** Một dòng của ô chọn sequence. */
export interface SeqMuc {
  id: string
  ten: string
  dangMo: boolean
}

/**
 * Mọi sequence trong project + cái nào đang mở — cho ô chọn sequence.
 * Định danh bằng ID (tên có thể trùng).
 * - [] = project đóng / không có sequence nào (Premiere TRẢ LỜI như vậy).
 * - null = HỎI HỎNG (hết giờ vì hộp thoại modal, host chưa nạp, không phản hồi).
 * ☠️ Hai thứ đó phải khác nhau (soát 19/09): bản đầu trả [] cho MỌI lỗi, vòng thăm
 * dò hiểu là "sequence bị xoá" rồi bỏ bàn dựng đang xem — và vì tab Premiere không
 * đổi nên không bao giờ quay về: panel kẹt ở "Chưa có sequence nào đang mở." chỉ vì
 * MỘT nhịp Premiere bận (mở Export Settings quá 8 giây, hoặc đang dựng sequence).
 */
export async function dsSequence(): Promise<SeqMuc[] | null> {
  const r = await goiNhe('sv_dsSequence', 'sv_dsSequence()')
  if (!r.ok) return r.ma === 'CHUA_MO_PROJECT' ? [] : null
  const ra: SeqMuc[] = []
  for (const dong of r.noiDung.split(/\r?\n/)) {
    if (!dong.startsWith('seq=')) continue
    const p = dong.slice(4).split('\t')
    if (p.length < 3 || !p[0]) continue
    ra.push({ id: p[0], dangMo: p[1] === '1', ten: p.slice(2).join('\t') })
  }
  return ra
}

// ── Vùng làm việc ───────────────────────────────────────────────────────────

/**
 * HÀM NHẸ cho vòng thăm dò ~1 giây: in/out/fps/khung + số clip đang chọn.
 * Adobe không bắn sự kiện khi người dùng bấm I/O hay chọn clip — hỏi theo nhịp
 * là cách duy nhất (skill 19a). So mấy số này, ĐỔI thật mới gọi `docVungLam`.
 *
 * - `vao`/`ra`: số THÔ. Chưa khoanh vùng Premiere trả -400000 (đo 27/08) → kiểm `< 0`.
 * - `soChon`: số clip đang chọn (clip hình; không có hình thì clip tiếng).
 *   -1 = bản Premiere này không có getSelection — không biết.
 * - `uocLuong`: chọn quá 50 mục — host chỉ đếm thô độ dài mảng (gồm cả clip
 *   tiếng đi kèm), `soChon` KHÔNG phải số clip. ☠️ Đừng in thẳng số đó (soát
 *   19/09: 25 clip hình + tiếng hiện "25", 26 clip hiện "52").
 * - null = host lỗi / hết giờ / sequence không còn.
 * CHƯA ĐO thời gian một lần gọi (có thêm getSelection so với hàm nhẹ ~1 ms của Autocut).
 */
export async function docVung(seqId: string): Promise<{
  seqId: string
  seqName: string
  fps: number
  vao: number
  ra: number
  soChon: number
  uocLuong: boolean
  w: number
  h: number
} | null> {
  const r = await goiNhe('sv_getRange', `sv_getRange(${jsx(seqId)})`)
  if (!r.ok) return null
  const kv = parseKV(r.noiDung)
  const fps = Number(kv.fps)
  const vao = Number(kv.in)
  const ra = Number(kv.out)
  const soChon = parseInt(kv.soChon ?? '', 10)
  return {
    seqId: kv.seqId || seqId,
    seqName: kv.seqName ?? '',
    fps: Number.isFinite(fps) && fps > 0 ? fps : 30,
    vao: Number.isFinite(vao) ? vao : -1,
    ra: Number.isFinite(ra) ? ra : -1,
    soChon: Number.isFinite(soChon) ? soChon : -1,
    uocLuong: kv.soChonUocLuong === '1',
    w: Number(kv.w) || 0,
    h: Number(kv.h) || 0,
  }
}

/**
 * HÀM NẶNG: danh sách clip của vùng làm việc (duyệt mọi track). CHỈ ĐỌC.
 * @param cheDo 'tudong' = có clip đang chọn thì theo clip đó, không thì theo In/Out.
 *              `vung.cheDo` là chế độ THẬT host đã dùng.
 *
 * Từ 19/09 (sau soát) host gửi CẢ clip hình lẫn clip tiếng (V|A ở đầu dòng) —
 * `moc.ts chonClipNghe` tự ghép cặp liên kết để không nghe / dựng hai lần. Bản đầu
 * có hình là bỏ track tiếng → B-roll cắt chèn trên V1 làm mất lời phỏng vấn chạy
 * liền ở A1, L-cut mất phần tiếng dài hơn hình.
 *
 * Kiểm chéo: số dòng clip đọc được phải bằng `soClip` host đếm; lệch hoặc có
 * dòng hỏng thì trả lỗi, không trả danh sách thiếu mà im.
 *
 * ☠️ `moHo` > 0 → TỪ CHỐI (soát 19/09): host gặp nhiều clip chồng đúng mốc với
 * clip đang chọn (multicam xếp chồng) mà isSelected() không phân xử được thì GIỮ
 * CẢ và đếm `moHo` "để panel báo, đừng đoán im" — bản đầu không đọc trường này,
 * nên panel nghe và dựng luôn cả cam người dùng KHÔNG chọn mà không nói gì.
 * `soKhongFile`: clip không có file gốc (title, sequence lồng — kể cả clip
 * multicam source) bị bỏ — trả kèm để giao diện nói ra (hợp đồng VungLam chưa có
 * trường này; không đổi kieu.ts, trả cạnh `vung`).
 */
export async function docVungLam(
  seqId: string,
  cheDo: 'tudong' | 'chon' | 'io',
): Promise<{ vung: VungLam | null; loi: HostLoi | null; soKhongFile: number }> {
  const r = await goiNang(`sv_getRangeClips(${jsx(seqId)}, ${jsx(cheDo)})`, CHO_DOC_VUNG)
  if (!r.ok) return { vung: null, loi: loiTu(r), soKhongFile: 0 }

  const kv = parseKV(r.noiDung)
  const moHo = parseInt(kv.moHo ?? '0', 10) || 0
  if (moHo > 0) return { vung: null, loi: taoLoi('CHON_MO_HO', String(moHo)), soKhongFile: 0 }
  const soKhongFile = parseInt(kv.soKhongFile ?? '0', 10) || 0
  const clips: ClipVung[] = []
  let dongHong = 0
  for (const line of r.noiDung.split(/\r?\n/)) {
    if (!line.startsWith('clip=')) continue
    const f = line.slice(5).split(',')
    if (f.length < 9) {
      dongHong++
      continue
    }
    const c: ClipVung = {
      kind: f[0] === 'A' ? 'A' : 'V',
      trackIdx: parseInt(f[1], 10),
      clipOrd: parseInt(f[2], 10),
      seqTu: parseFloat(f[3]),
      seqDen: parseFloat(f[4]),
      srcTu: parseFloat(f[5]),
      srcDen: parseFloat(f[6]),
      speed: parseFloat(f[7]),
      // Đường dẫn để CUỐI dòng vì có thể chứa dấu phẩy — ghép lại hết.
      path: f.slice(8).join(','),
    }
    const soHong = [c.trackIdx, c.clipOrd, c.seqTu, c.seqDen, c.srcTu, c.srcDen, c.speed].some(
      (n) => !Number.isFinite(n),
    )
    if (soHong || !c.path) {
      dongHong++
      continue
    }
    clips.push(c)
  }
  const soClipHost = parseInt(kv.soClip ?? '', 10)
  if (dongHong > 0 || (Number.isFinite(soClipHost) && soClipHost !== clips.length)) {
    return {
      vung: null,
      loi: taoLoi('KHONG_RO', '', `soClip=${kv.soClip ?? '?'} doc duoc=${clips.length} dong hong=${dongHong}`),
      soKhongFile: 0,
    }
  }

  const cheDoThat: CheDoVung = kv.cheDo === 'chon' ? 'chon' : 'io'
  const fps = Number(kv.fps)
  const vungTu = Number(kv.in)
  const vungDen = Number(kv.out)
  return {
    vung: {
      seqId: kv.seqId || seqId,
      seqName: kv.seqName ?? '',
      fps: Number.isFinite(fps) && fps > 0 ? fps : 30,
      cheDo: cheDoThat,
      vungTu: Number.isFinite(vungTu) ? vungTu : 0,
      vungDen: Number.isFinite(vungDen) ? vungDen : 0,
      clips,
      soTat: parseInt(kv.soTat ?? '0', 10) || 0,
      chongLan: parseInt(kv.chongLan ?? '0', 10) || 0,
    },
    loi: null,
    soKhongFile,
  }
}

// ── Đầu đọc ─────────────────────────────────────────────────────────────────

/**
 * Nhảy đầu đọc tới `giay` (giây TUYỆT ĐỐI trên sequence) — người dùng bấm một câu.
 * Host mở sequence đó (nếu đang khuất) rồi dời đầu đọc, ĐỌC LẠI vị trí thật.
 * `ok` = tới đúng chỗ trong một khung hình. `giayThat` luôn là số đọc lại (-1 nếu không đọc được).
 * ☠️ CHƯA ĐO: repo chưa ai gọi setPlayerPosition — lần cài đầu phải đo lệch + độ trễ mỗi cú bấm.
 */
export async function nhayToi(
  seqId: string,
  giay: number,
): Promise<{ ok: boolean; giayThat: number; loi: HostLoi | null }> {
  if (!Number.isFinite(giay) || giay < 0) return { ok: false, giayThat: -1, loi: taoLoi('GIAY_SAI') }
  const r = await goiNhe('sv_nhay', `sv_nhay(${jsx(seqId)}, ${jsx(soChuoi(giay))})`)
  if (!r.ok) return { ok: false, giayThat: -1, loi: loiTu(r) }
  const kv = parseKV(r.noiDung)
  const that = Number(kv.giay)
  const khung = Number(kv.khung)
  if (!Number.isFinite(that) || that < 0) return { ok: false, giayThat: -1, loi: taoLoi('KHONG_DOC_DUOC') }
  const nguong = Number.isFinite(khung) && khung > 0 ? khung : 1 / 24
  const lech = Math.abs(that - giay)
  if (lech > nguong + 1e-6) {
    return { ok: false, giayThat: that, loi: taoLoi('NHAY_LECH', lech.toFixed(2)) }
  }
  return { ok: true, giayThat: that, loi: null }
}

/** Vị trí đầu đọc (giây trên sequence) — để tô câu đang phát. -1 = không đọc được (đừng in thẳng ra màn hình). */
export async function viTriDauDoc(seqId: string): Promise<number> {
  const r = await goiNhe('sv_viTri', `sv_viTri(${jsx(seqId)})`)
  if (!r.ok) return -1
  const g = Number(parseKV(r.noiDung).giay)
  return Number.isFinite(g) && g >= 0 ? g : -1
}

// ── Marker ──────────────────────────────────────────────────────────────────

/**
 * Đặt marker cho các khối (tên host tự thêm tiền tố 'SV ' và chữ ký cuối ghi chú).
 * Host XOÁ marker CŨ của panel trên sequence đó trước khi đặt — marker người dùng
 * tự đặt không bị chạm. ☠️ Tức là nút "Đặt marker" cũng là nút XOÁ: giao diện phải
 * đếm lại (`demMarker`) và hỏi bằng số trước khi gọi hàm này khi đã có marker cũ.
 * `giay`/`den`: giây TUYỆT ĐỐI trên sequence; `den > giay` = marker có độ dài
 * (CHƯA ĐO — không đặt được thì host để marker điểm, đếm `soDiem`).
 * `lechDau`: mốc đầu marker đầu tiên đọc lại − mốc xin (giây); null = không đọc được.
 * Danh sách rỗng → DS_RONG, marker cũ còn nguyên (muốn xoá thì gọi `xoaMarker`).
 */
export async function datMarker(
  seqId: string,
  ds: { giay: number; den: number; ten: string; ghiChu: string }[],
): Promise<{ daXoa: number; daDat: number; soDiem: number; lechDau: number | null; khung: number; loi: HostLoi | null }> {
  if (!ds.length) return { daXoa: 0, daDat: 0, soDiem: 0, lechDau: null, khung: 0, loi: taoLoi('DS_RONG') }
  const chuoi = ds
    .map((m) => [soChuoi(m.giay), soChuoi(m.den), truong(m.ten), truong(m.ghiChu)].join(US))
    .join(RS)
  const r = await goiNang(`sv_datMarker(${jsx(seqId)}, ${jsx(chuoi)})`, CHO_MARKER)
  if (!r.ok) return { daXoa: 0, daDat: 0, soDiem: 0, lechDau: null, khung: 0, loi: loiTu(r) }
  const kv = parseKV(r.noiDung)
  const daXoa = parseInt(kv.daXoa ?? '0', 10) || 0
  const daDat = parseInt(kv.daDat ?? '0', 10) || 0
  const soDiem = parseInt(kv.soDiem ?? '0', 10) || 0
  const lech = kv.lechDau === undefined || kv.lechDau === '' ? NaN : Number(kv.lechDau)
  const khung = Number(kv.khung) > 0 ? Number(kv.khung) : 1 / 24
  // Số đo cho lần cài đầu (host ghi CHƯA ĐO: cách gán mk.end nào ăn, màu đọc lại
  // là gì) — xem qua cổng gỡ lỗi 8100, không lên màn hình.
  console.info('[sv] datMarker', { cachEnd: kv.cachEnd, mauDoc: kv.mauDoc, soDiem, lechDau: kv.lechDau, tongMarker: kv.tongMarker })
  const loi = daDat < ds.length ? taoLoi('DAT_THIEU', `${daDat}/${ds.length}`, kv.loiDau ?? '') : null
  return { daXoa, daDat, soDiem, lechDau: Number.isFinite(lech) ? lech : null, khung, loi }
}

/** Số marker CỦA PANEL trên sequence — để nút xoá / nút đặt nói hậu quả bằng số. -1 = không đếm được (đừng in thẳng). */
export async function demMarker(seqId: string): Promise<number> {
  const r = await goiNhe('sv_demMarker', `sv_demMarker(${jsx(seqId)})`)
  if (!r.ok) return -1
  const n = parseInt(parseKV(r.noiDung).soMarker ?? '', 10)
  return Number.isFinite(n) ? n : -1
}

/** Xoá marker của panel (tên 'SV ' + chữ ký). Marker người dùng tự đặt KHÔNG bị chạm. */
export async function xoaMarker(seqId: string): Promise<{ daXoa: number; loi: HostLoi | null }> {
  const r = await goiNang(`sv_xoaMarker(${jsx(seqId)})`, CHO_MARKER)
  if (!r.ok) return { daXoa: 0, loi: loiTu(r) }
  return { daXoa: parseInt(parseKV(r.noiDung).daXoa ?? '0', 10) || 0, loi: null }
}

// ── Dựng sequence mới ───────────────────────────────────────────────────────

/** Bản ghi đoạn: kind␟trackIdx␟clipOrd␟srcTu␟srcDen␟duongDan, ngăn bằng ␞. */
function maHoaDoan(doan: DoanNguon[]): string {
  return doan
    .map((d) =>
      [d.kind, String(d.trackIdx), String(d.clipOrd), soChuoi(d.srcTu), soChuoi(d.srcDen), truong(duong(d.path))].join(
        US,
      ),
    )
    .join(RS)
}

export interface KetQuaDung {
  ok: boolean
  id: string
  ten: string
  dai: number
  mongMuon: number
  loi: HostLoi | null
  /**
   * Host KHÔNG mở lại được sequence của người dùng sau khi dựng (`moLai=0`) —
   * Timeline đang đứng ở sequence vừa tạo. Không phải hỏng dữ liệu, nhưng phải
   * nói (bản đầu bỏ qua trường này, panel báo xong mà người dùng thấy mình đang ở
   * sequence khác — bài 5l).
   */
  moLaiHong: boolean
  /** Host lưu project trước khi dựng: '1' đã lưu · '0' không lưu được (project chưa từng lưu…) · '-' lần này không xin lưu. */
  daLuu: string
}

/**
 * Đọc kết quả dựng. Mọi con số là ĐO LẠI trên timeline thật (host đọc lại),
 * không phải số yêu cầu. `ok` chỉ true khi: không đoạn nào hỏng, in/out gốc đã
 * trả lại đủ, độ dài thật khớp độ dài cần có trong (số đoạn + 1) khung hình
 * (mỗi lần đặt Premiere bắt vị trí về lưới khung — skill 18e), không thiếu tiếng.
 * Hỏng mà sequence ĐÃ tạo thì `id` vẫn có — giao diện mở ra cho người dùng xem được.
 */
function docKetQuaDung(r: HostResult, soDoan: number): KetQuaDung {
  if (!r.ok) return { ok: false, id: '', ten: '', dai: 0, mongMuon: 0, loi: loiTu(r), moLaiHong: false, daLuu: '-' }
  const kv = parseKV(r.noiDung)
  // Số đo cho lần cài đầu — khe hở chỉ bị bắt gián tiếp qua độ dài, ghi ra để đo.
  console.info('[sv] dung', { khe: kv.khe, soClip: kv.soClip, soClipTieng: kv.soClipTieng, thieuTieng: kv.thieuTieng, luu: kv.luu, moLai: kv.moLai })
  const so = (k: string) => {
    const n = Number(kv[k])
    return Number.isFinite(n) ? n : 0
  }
  const dai = so('dai')
  const mongMuon = so('mongMuon')
  const khung = so('khung') > 0 ? so('khung') : 1 / 24
  let loi: HostLoi | null = null
  if (so('traInOutHong') > 0) loi = taoLoi('INOUT_CHUA_TRA', String(so('traInOutHong')))
  else if (so('soLoi') > 0) loi = taoLoi('DUNG_THIEU', String(so('soLoi')), kv.loiDau ?? '')
  else if (Math.abs(dai - mongMuon) > (soDoan + 1) * khung)
    loi = taoLoi('LECH_DO_DAI', `${dai.toFixed(2)} s / ${mongMuon.toFixed(2)} s`)
  else if (so('conThieuTieng') > 0) loi = taoLoi('THIEU_TIENG', String(so('conThieuTieng')))
  return {
    ok: loi === null,
    id: kv.id ?? '',
    ten: kv.ten ?? '',
    dai,
    mongMuon,
    loi,
    moLaiHong: kv.moLai === '0',
    daLuu: kv.luu === '1' || kv.luu === '0' ? kv.luu : '-',
  }
}

/**
 * Dựng MỘT sequence mới từ các đoạn (một khối, hoặc nhiều khối gộp) — đoạn đặt
 * nối tiếp nhau. Sequence nằm trong bin "AiO Short Viral"; tên trùng thì host
 * nối " (2)". Tạo xong host MỞ LẠI sequence nguồn theo ID.
 *
 * ⚠️ Một lần gọi chạy một lèo, KHÔNG dừng giữa chừng được (ExtendScript một luồng).
 * Gộp nhiều khối thì nên: `taoSequence` với khối đầu → `noiTiepSequence` từng khối
 * sau, kiểm cờ dừng giữa các lần — có tiến độ % và đường dừng.
 * ⚠️ Sequence mới dựng từ FILE GỐC ở tốc độ 100%: hiệu ứng, màu, tốc độ, keyframe
 * trên clip nguồn KHÔNG theo sang.
 * @param luu  true = host LƯU project của người dùng trước khi dựng (đai bảo hiểm
 *   khi Premiere sập). Chỉ bật ở lần gọi ĐẦU của một lượt — bản đầu lưu ở mọi lần
 *   gọi: 65 khối = 65 lần ghi đè file .prproj (soát 19/09).
 */
export async function taoSequence(seqId: string, ten: string, doan: DoanNguon[], luu = false): Promise<KetQuaDung> {
  if (!doan.length) return { ok: false, id: '', ten: '', dai: 0, mongMuon: 0, loi: taoLoi('DS_RONG'), moLaiHong: false, daLuu: '-' }
  const r = await goiNang(
    `sv_taoSequence(${jsx(seqId)}, ${jsx(truong(ten))}, ${jsx(maHoaDoan(doan))}, ${jsx(luu ? '1' : '0')})`,
    choDung(doan.length),
  )
  return docKetQuaDung(r, doan.length)
}

/**
 * Nối thêm đoạn vào CUỐI sequence `seqMoiId` do `taoSequence` vừa tạo — để gộp
 * nhiều khối theo lô, có đường dừng. `dai`/`mongMuon` là phần NỐI THÊM lần này.
 * Host từ chối nếu `seqMoiId` là chính sequence nguồn, hoặc sequence đích có clip
 * nằm sau chỗ nối (đè lên là xoá đồ của người dùng).
 * Mỗi lần gọi Timeline nhảy sang sequence đích rồi về lại sequence nguồn.
 */
export async function noiTiepSequence(
  seqId: string,
  seqMoiId: string,
  doan: DoanNguon[],
  luu = false,
): Promise<KetQuaDung> {
  if (!doan.length) return { ok: false, id: '', ten: '', dai: 0, mongMuon: 0, loi: taoLoi('DS_RONG'), moLaiHong: false, daLuu: '-' }
  const r = await goiNang(
    `sv_noiTiep(${jsx(seqId)}, ${jsx(seqMoiId)}, ${jsx(maHoaDoan(doan))}, ${jsx(luu ? '1' : '0')})`,
    choDung(doan.length),
  )
  return docKetQuaDung(r, doan.length)
}
