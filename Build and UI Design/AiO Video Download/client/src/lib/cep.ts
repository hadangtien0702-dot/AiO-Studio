import { dich } from '../ngonngu'

/**
 * cep.ts — lớp bọc CSInterface (đã nạp global qua <script> trong index.html).
 *
 * ☠️ ExtendScript của Premiere là MỘT LUỒNG dùng chung cho MỌI panel. Một hộp
 * thoại modal (của Premiere hay của panel nào đó) làm mọi evalScript nằm chờ
 * — đo 21/09: hộp "Choose Folder" mở 30 phút, `1+1` hết giờ 8 s, trong khi
 * panel cũ vẫn đẩy thêm một lệnh hỏi project mỗi 2 giây. Nên ở đây:
 *  - đếm lệnh đang chờ (`hostDangCho()`), vòng thăm dò thấy còn lệnh treo thì
 *    BỎ LƯỢT, không chồng thêm;
 *  - `hostBan()` = có lệnh đã chờ quá 4 s → panel báo "Premiere đang bận".
 *    KHÔNG huỷ lệnh (evalScript không huỷ được): kết quả trả muộn vẫn được dùng.
 */

declare global {
  interface Window {
    __adobe_cep__?: unknown
    CSInterface?: new () => CSInterfaceLike
    SystemPath?: Record<string, string>
    cep?: {
      fs?: {
        showOpenDialogEx?: (multi: boolean, dir: boolean, title: string, initial?: string, types?: string[]) => { err: number; data: string[] }
        showOpenDialog?: (multi: boolean, dir: boolean, title: string, initial?: string, types?: string[]) => { err: number; data: string[] }
      }
    }
  }
}

interface CSInterfaceLike {
  isInHost(): boolean
  evalScript(script: string, cb: (result: string) => void): void
  getApplicationID(): string | null
  getSystemPath(pathType: string): string
}

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

// ── Hàng đợi lệnh host ────────────────────────────────────────────────────

const dangCho = new Map<number, number>() // mã lệnh → thời điểm gửi
let soLenh = 0

/** Số lệnh host chưa trả lời. */
export function hostDangCho(): number {
  return dangCho.size
}

/** Có lệnh đã chờ quá `ms` → Premiere đang kẹt (hộp thoại modal, lệnh dài của panel khác). */
export function hostBan(ms = 4000): boolean {
  const bay = Date.now()
  for (const t of dangCho.values()) if (bay - t > ms) return true
  return false
}

export function evalScript(script: string): Promise<string> {
  return new Promise((resolve) => {
    const c = cs()
    if (!c) {
      resolve('')
      return
    }
    const id = ++soLenh
    dangCho.set(id, Date.now())
    c.evalScript(script, (result: string) => {
      dangCho.delete(id)
      resolve(result)
    })
  })
}

// ── Kết quả ───────────────────────────────────────────────────────────────

export interface HostResult {
  ok: boolean
  /** Mã máy đọc (KHONG_THAY_FILE, DA_CO, MOI…) — KHÔNG hiện lên màn hình. */
  ma: string
  /** Phần sau dấu '|' đầu tiên. */
  chiTiet: string
  /** Cả chuỗi sau OK:/ERR: (giữ cho chỗ cũ dùng). */
  message: string
}

/** Phân tích "OK:MA|chi tiết" / "ERR:MA|chi tiết" từ ExtendScript. */
export function parseResult(raw: string): HostResult {
  if (!raw) return { ok: false, ma: 'KHONG_PHAN_HOI', chiTiet: '', message: dich('Không có phản hồi từ Premiere') }
  const ok = raw.indexOf('OK:') === 0
  const err = raw.indexOf('ERR:') === 0
  if (!ok && !err) return { ok: false, ma: raw.indexOf('EvalScript error') >= 0 ? 'EVALSCRIPT' : 'LA', chiTiet: raw, message: raw }
  const than = raw.slice(ok ? 3 : 4)
  const i = than.indexOf('|')
  return { ok, ma: i >= 0 ? than.slice(0, i) : than, chiTiet: i >= 0 ? than.slice(i + 1) : '', message: than }
}

/** Đường dẫn thư mục extension trên đĩa (để tìm bin/yt-dlp.exe). */
export function extensionPath(): string {
  const c = cs()
  if (!c || !window.SystemPath) return ''
  return c.getSystemPath(window.SystemPath.EXTENSION)
}

/**
 * Bọc chuỗi thành literal ExtendScript an toàn.
 * ☠️ JSON.stringify KHÔNG thoát U+2028/U+2029 — với ES3 đó là ký tự xuống dòng,
 * nằm trong chuỗi là lỗi cú pháp ("EvalScript error.").
 */
const LS = String.fromCharCode(0x2028)
const PS = String.fromCharCode(0x2029)
export function chuoiJsx(s: string): string {
  return JSON.stringify(s).split(LS).join('\\u2028').split(PS).join('\\u2029')
}

// ── Nạp lại host ──────────────────────────────────────────────────────────

/** Phải bằng vd_phienBan() ở CUỐI host/videodownload.jsx. */
const PHIEN_BAN_HOST = __VERSION__
let daNap = false

/**
 * Chạy `bieuThuc` trên host, NẠP LẠI file host trước nếu phiên này chưa nạp.
 *
 * ☠️ Premiere nạp `host/index.jsx` ĐÚNG MỘT LẦN lúc khởi động. Cài bản mới rồi
 * mở lại panel = giao diện mới, host cũ → hàm mới báo "EvalScript error.".
 * ☠️ `$.evalFile` phải ở TẦNG NGOÀI CÙNG của chuỗi lệnh (khối try thì được, bọc
 * trong function thì mọi hàm biến mất cùng scope — đo ở Autocut 28/07).
 * ☠️ Kiểm vd_phienBan() SAU khi nạp: lệch = nạp dở/host cũ → trả HOST_CU.
 * Gộp nạp + gọi vào MỘT lệnh để hàng đợi chỉ có một lệnh mỗi thao tác.
 */
export async function goiHost(bieuThuc: string): Promise<HostResult> {
  const ext = extensionPath()
  if (!daNap && ext) {
    const p = chuoiJsx(ext.replace(/\\/g, '/') + '/host/index.jsx')
    const raw = await evalScript(
      `var __vdNap='OK'; try { $.evalFile(${p}) } catch(e) { __vdNap='ERR:NAP|'+e } ` +
        `(__vdNap!=='OK') ? __vdNap : (typeof vd_phienBan!=='function' || vd_phienBan()!==${chuoiJsx(PHIEN_BAN_HOST)}) ? 'ERR:HOST_CU|' : (${bieuThuc})`,
    )
    const r = parseResult(raw)
    if (r.ma !== 'NAP' && r.ma !== 'HOST_CU' && r.ma !== 'EVALSCRIPT') daNap = true
    return r
  }
  const r = parseResult(await evalScript(bieuThuc))
  // Host bị nạp lại bởi thứ khác / Premiere vừa khởi động lại: nạp lần sau.
  if (r.ma === 'EVALSCRIPT') daNap = false
  return r
}

// ── Các lệnh ──────────────────────────────────────────────────────────────

export interface ThongTinHost {
  appVersion: string
  /** Đường dẫn file project đang mở; '' = chưa mở / chưa lưu. KHOÁ theo dõi dùng cái này, không dùng tên. */
  duong: string
  ten: string
}

/**
 * MỘT lệnh cho vòng thăm dò: thông tin project + dấu hiệu nhẹ của bin.
 * ☠️ Trước đây là HAI vòng 2 s riêng; vòng sau thấy lệnh của vòng trước đang chờ
 * thì bỏ lượt — cùng pha nên có thể bỏ MỌI lượt (soi 21/09). Gộp làm một.
 */
export async function hoiNhip(dsTheoDoi: string[]): Promise<{ host: ThongTinHost | null; dauHieu: string }> {
  // ☠️☠️ KHÔNG dùng getHostInfo: 8 panel AiO cùng định nghĩa hàm toàn cục đó trong
  // MỘT engine ExtendScript, panel nạp sau thắng (soi 21/09). Hàm riêng vd_*.
  // Hàm riêng chưa có (host panel này chưa nạp) → goiHost nạp rồi hỏi luôn.
  const bt = `vd_thongTinHost()+"\\n"+vd_dauHieu([${dsTheoDoi.map(chuoiJsx).join(',')}])`
  let raw = await evalScript(`typeof vd_thongTinHost==="function"&&typeof vd_dauHieu==="function"?(${bt}):"CHUA_NAP"`)
  if (raw === 'CHUA_NAP') {
    // Chuỗi của vd_thongTinHost không có tiền tố OK: → parseResult xếp vào 'LA'
    // (lạ) và giữ nguyên văn ở chiTiet. Lỗi nạp (HOST_CU/NAP) thì bỏ lượt này.
    const r = await goiHost(bt)
    raw = r.ma === 'LA' ? r.chiTiet : ''
  }
  if (!raw || raw.indexOf('EvalScript error') >= 0) return { host: null, dauHieu: '' }
  const i = raw.indexOf('\n')
  const dh = parseResult(i >= 0 ? raw.slice(i + 1) : '')
  return { host: tachThongTin(i >= 0 ? raw.slice(0, i) : raw), dauHieu: dh.ok ? dh.message : '' }
}

/** "appVersion|đường dẫn|tên" của vd_thongTinHost. Tên đặt CUỐI, tách tối đa 2 lần. */
function tachThongTin(raw: string): ThongTinHost | null {
  const a = raw.indexOf('|')
  const b = a >= 0 ? raw.indexOf('|', a + 1) : -1
  if (b < 0) return null
  return { appVersion: raw.slice(0, a), duong: raw.slice(a + 1, b), ten: raw.slice(b + 1) }
}

/** Thư mục của file project đang mở — gợi ý nơi lưu. */
export async function thuMucProject(): Promise<string> {
  const r = await goiHost('vd_thuMucProject()')
  return r.ok ? r.message : ''
}

/**
 * Hộp chọn thư mục CỦA PANEL (chạy trong tiến trình CEP, không chặn ExtendScript
 * của Premiere như Folder.selectDialog — đo 21/09). Asset Manager / Power Bins
 * dùng cùng API từ tháng 8. Trả '' nếu huỷ.
 */
export async function chonThuMuc(goiY: string, tieuDe: string): Promise<string> {
  const f = window.cep && window.cep.fs
  try {
    if (f && typeof f.showOpenDialogEx === 'function') {
      const r = f.showOpenDialogEx(false, true, tieuDe, goiY || '', [])
      return r && !r.err && r.data && r.data[0] ? r.data[0] : ''
    }
    if (f && typeof f.showOpenDialog === 'function') {
      const r = f.showOpenDialog(false, true, tieuDe, goiY || '', [])
      return r && !r.err && r.data && r.data[0] ? r.data[0] : ''
    }
  } catch {}
  const r = await goiHost(`vd_chonThuMuc(${chuoiJsx(goiY)}, ${chuoiJsx(tieuDe)})`)
  return r.ok ? r.message : ''
}

/**
 * Nhập file vào bin "AiO Video Download" của project `projectKyVong` (đường dẫn
 * project lúc người dùng bấm). Project đang mở đã đổi → host trả DOI_PROJECT.
 */
export function nhapVaoProject(duongDan: string, projectKyVong: string): Promise<HostResult> {
  return goiHost(`vd_nhap(${chuoiJsx(duongDan)}, ${chuoiJsx(projectKyVong)})`)
}

/**
 * Trạng thái sống trong project đang mở cho từng đường dẫn:
 * 0 = không có · 1 = có · 2 = có nhưng offline. null = không hỏi được.
 */
export async function trangThaiTrongProject(ds: string[]): Promise<{ project: string; ma: number[] } | null> {
  if (!ds.length) return { project: '', ma: [] }
  const r = await goiHost(`vd_trangThai([${ds.map(chuoiJsx).join(',')}])`)
  if (!r.ok) return null
  const i = r.message.lastIndexOf('|')
  const ma = r.message.slice(i + 1).split(',').map((x) => parseInt(x, 10) || 0)
  return { project: r.message.slice(0, i), ma }
}
