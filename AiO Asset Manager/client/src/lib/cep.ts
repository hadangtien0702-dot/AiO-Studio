/**
 * cep.ts — lớp bọc TypeScript cho CSInterface (đã nạp global qua <script>).
 * Giúp gọi ExtendScript kiểu Promise/async, và đọc thông tin host an toàn.
 */
import { dich } from '../ngonngu'

declare global {
  interface Window {
    __adobe_cep__?: unknown
    CSInterface?: new () => CSInterfaceLike
    SystemPath?: Record<string, string>
  }
}

/** Chữ ký tối thiểu của CSInterface mà panel dùng. */
interface CSInterfaceLike {
  isInHost(): boolean
  evalScript(script: string, cb: (result: string) => void): void
  getHostEnvironment(): HostEnvironment | null
  getApplicationID(): string | null
  getSystemPath(pathType: string): string
  getOSInformation(): string
  getExtensionID(): string | null
}

export interface HostEnvironment {
  appName: string
  appVersion: string
  appLocale: string
  appId: string
  isAppOnline: boolean
}

export interface HostInfo {
  appName: string
  appVersion: string
  project: string
}

let _cs: CSInterfaceLike | null = null

/** Lấy (hoặc tạo) instance CSInterface. null nếu không chạy trong host. */
export function cs(): CSInterfaceLike | null {
  if (_cs) return _cs
  if (typeof window === 'undefined' || !window.CSInterface) return null
  _cs = new window.CSInterface()
  return _cs
}

/** Có đang chạy bên trong Premiere/AE (có bridge native) không. */
export function isInHost(): boolean {
  const c = cs()
  return !!c && c.isInHost()
}

/** Chạy ExtendScript, trả kết quả dạng Promise<string>. */
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

/** Ping thử cầu nối ExtendScript. */
export async function ping(): Promise<string> {
  return evalScript('ping()')
}

/** Đọc thông tin host (parse chuỗi "name|version|project" từ getHostInfo()). */
export async function getHostInfo(): Promise<HostInfo> {
  const raw = await evalScript('getHostInfo()')
  const [appName = 'unknown', appVersion = 'unknown', project = '(no project)'] =
    raw.split('|')
  return { appName, appVersion, project }
}

/** Thông tin môi trường host (từ CSInterface, không qua ExtendScript). */
export function hostEnvironment(): HostEnvironment | null {
  const c = cs()
  return c ? c.getHostEnvironment() : null
}

/** Map appId (PPRO, AEFT...) sang tên thân thiện. */
const APP_NAMES: Record<string, string> = {
  PPRO: 'Adobe Premiere Pro',
  AEFT: 'Adobe After Effects',
  PHXS: 'Adobe Photoshop',
  PHSP: 'Adobe Photoshop',
  ILST: 'Adobe Illustrator',
  IDSN: 'Adobe InDesign',
  AUDT: 'Adobe Audition',
}

/**
 * Tên app thân thiện, lấy từ CEP (Premiere không có app.name trong ExtendScript).
 */
export function hostAppName(): string {
  const c = cs()
  const id = c ? c.getApplicationID() : null
  if (!id) return 'unknown'
  return APP_NAMES[id] ?? id
}

/** Đường dẫn thư mục extension (gốc panel) trên đĩa. */
export function extensionPath(): string {
  const c = cs()
  if (!c || !window.SystemPath) return ''
  return c.getSystemPath(window.SystemPath.EXTENSION)
}

/** Escape chuỗi để nhúng an toàn vào lệnh ExtendScript. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/** Kết quả một thao tác với host. */
export interface HostResult {
  ok: boolean
  message: string
}

/** Phân tích chuỗi "OK:..." / "ERR:..." từ ExtendScript. */
function parseResult(raw: string): HostResult {
  if (!raw) return { ok: false, message: dich('Không có phản hồi từ Premiere') }
  if (raw.indexOf('OK:') === 0) return { ok: true, message: raw.slice(3) }
  if (raw.indexOf('ERR:') === 0) return { ok: false, message: raw.slice(4) }
  return { ok: false, message: raw }
}

/**
 * Chèn file (video/audio/ảnh) vào sequence đang mở, tại playhead.
 *
 * [1.0.2] Gửi kèm LOẠI asset: file chỉ có âm thanh phải xuống track âm thanh,
 * không nhét lên track video như bản cũ.
 */
export async function importToTimeline(
  filePath: string,
  kind: string = 'video',
  /** Thời lượng (giây) — host cần để biết chỗ đặt có đè lên clip nào không. */
  durationSec = 0,
): Promise<HostResult> {
  const raw = await evalScript(
    `ppro_importToTimeline('${esc(filePath)}', '${esc(kind)}', ${durationSec || 0})`,
  )
  return parseResult(raw)
}

/** Chèn Motion Graphics Template (.mogrt) vào sequence tại playhead. */
export async function importMogrt(filePath: string): Promise<HostResult> {
  const raw = await evalScript(`ppro_importMogrt('${esc(filePath)}')`)
  return parseResult(raw)
}

/** Chỉ import vào Project panel (không chèn timeline). */
export async function importToProject(filePath: string): Promise<HostResult> {
  const raw = await evalScript(`ppro_importToProject('${esc(filePath)}')`)
  return parseResult(raw)
}

/**
 * Vị trí playhead của sequence đang mở (chuỗi ticks), '' nếu không có.
 * Dùng để biết Premiere có đang phát/tua không — xem `services/hostBusy.ts`.
 */
export async function playerPosition(): Promise<string> {
  const raw = await evalScript('ppro_playerPosition()')
  return raw && raw.indexOf('ERR') !== 0 ? raw.trim() : ''
}

/** Đường dẫn thư mục userData (nơi ghi dữ liệu riêng của panel). */
export function userDataPath(): string {
  const c = cs()
  if (!c || !window.SystemPath) return ''
  return c.getSystemPath(window.SystemPath.USER_DATA)
}

/** Mở hộp thoại chọn thư mục (CEP). Trả về đường dẫn hoặc '' nếu huỷ. */
export function pickFolder(title = dich('Chọn thư mục asset')): string {
  const w = window as any
  if (w.cep && w.cep.fs && typeof w.cep.fs.showOpenDialog === 'function') {
    // showOpenDialog(allowMulti, chooseDir, title, initialPath, fileTypes)
    const res = w.cep.fs.showOpenDialog(false, true, title, '', [])
    if (res && res.data && res.data.length) return res.data[0]
  }
  return ''
}
