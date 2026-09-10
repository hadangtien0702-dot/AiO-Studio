import { dich } from '../ngonngu'

/**
 * cep.ts — lớp bọc CSInterface (đã nạp global qua <script> trong index.html).
 * Chép cách làm của Transcripts/Autocut — đã chạy thật trong Premiere.
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

export function evalScript(script: string): Promise<string> {
  return new Promise((resolve) => {
    const c = cs()
    if (!c) {
      resolve('')
      return
    }
    c.evalScript(script, (result: string) => resolve(result))
  })
}

export interface HostResult {
  ok: boolean
  message: string
}

/** Phân tích chuỗi "OK:..." / "ERR:..." từ ExtendScript. */
export function parseResult(raw: string): HostResult {
  if (!raw) return { ok: false, message: dich('Không có phản hồi từ Premiere') }
  if (raw.indexOf('OK:') === 0) return { ok: true, message: raw.slice(3) }
  if (raw.indexOf('ERR:') === 0) return { ok: false, message: raw.slice(4) }
  return { ok: false, message: raw }
}

/** Đường dẫn thư mục extension trên đĩa (để tìm bin/yt-dlp.exe). */
export function extensionPath(): string {
  const c = cs()
  if (!c || !window.SystemPath) return ''
  return c.getSystemPath(window.SystemPath.EXTENSION)
}

/**
 * NẠP LẠI file ExtendScript từ đĩa. Gọi trước mọi lệnh host.
 *
 * ☠️ Premiere nạp `host/index.jsx` ĐÚNG MỘT LẦN lúc extension khởi động. Cài
 * bản mới rồi reload panel = giao diện mới, host cũ, hàm mới báo
 * "EvalScript error." — `$.evalFile` đọc thẳng đĩa nên luôn lấy bản mới.
 * ☠️ KHÔNG bọc `$.evalFile` trong hàm — nó chạy trong scope chỗ gọi, bọc lại
 * là mọi hàm biến mất cùng scope đó (đo ở Autocut 28/07).
 */
export async function napLaiHost(): Promise<boolean> {
  const ext = extensionPath()
  if (!ext) return false
  const p = ext.replace(/\\/g, '/') + '/host/index.jsx'
  const raw = await evalScript(
    `var __vdNap='OK'; try { $.evalFile("${p}") } catch(e) { __vdNap='ERR:'+e.toString() } __vdNap`,
  )
  return raw.indexOf('OK') === 0
}

/** Bọc chuỗi thành literal ExtendScript an toàn. */
function chuoiJsx(s: string): string {
  return JSON.stringify(s)
}

export async function hostInfo(): Promise<{ appVersion: string; project: string }> {
  const raw = await evalScript('getHostInfo()')
  if (!raw || raw.indexOf('EvalScript error') >= 0) return { appVersion: '', project: '' }
  const i = raw.indexOf('|')
  return { appVersion: raw.slice(0, i), project: raw.slice(i + 1) }
}

/** Thư mục của file project đang mở — gợi ý nơi lưu. */
export async function thuMucProject(): Promise<string> {
  await napLaiHost()
  const r = parseResult(await evalScript('vd_thuMucProject()'))
  return r.ok ? r.message : ''
}

/** Hộp chọn thư mục của hệ điều hành. Trả '' nếu huỷ. */
export async function chonThuMuc(goiY: string): Promise<string> {
  await napLaiHost()
  const r = parseResult(await evalScript(`vd_chonThuMuc(${chuoiJsx(goiY)})`))
  return r.ok ? r.message : ''
}

/** Nhập file vào bin "AiO Video Download". */
export async function nhapVaoProject(duongDan: string): Promise<HostResult> {
  await napLaiHost()
  return parseResult(await evalScript(`vd_nhap(${chuoiJsx(duongDan)})`))
}

/** Đếm clip đang có trong bin — đọc nhẹ, gọi theo nhịp. */
export async function demTrongBin(): Promise<number> {
  const raw = await evalScript('typeof vd_demTrongBin==="function"?vd_demTrongBin():""')
  const r = parseResult(raw)
  return r.ok ? parseInt(r.message, 10) || 0 : -1
}
