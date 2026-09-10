/**
 * caidat.ts — lưu lựa chọn của người dùng ra đĩa để lần sau mở panel còn nguyên.
 *
 * File: %APPDATA%\AiOStudio\videodownload.json — cùng thư mục với ngonngu.json
 * và kho FFmpeg dùng chung của cả bộ. Đọc/ghi qua Node của CEP; chạy ngoài
 * Premiere (trình duyệt) thì rơi về localStorage.
 */

import { getFs, getPath, bienMT } from '../lib/node'
import type { ChatLuong, CookieTrinhDuyet } from './ytdlp'

export interface CaiDat {
  thuMuc: string
  chatLuong: ChatLuong
  nhapVaoProject: boolean
  cookies: CookieTrinhDuyet
}

export const MAC_DINH: CaiDat = {
  thuMuc: '',
  // 1080p H.264 là mức editor hay dùng nhất; "tốt nhất" có thể ra 4K VP9 mà
  // Premiere không đọc — không lấy làm mặc định.
  chatLuong: '1080',
  nhapVaoProject: true,
  cookies: '',
}

const KHOA_LS = 'aio-videodownload'

function duongFile(): string {
  const path = getPath()
  const appData = bienMT('APPDATA')
  if (!path || !appData) return ''
  return path.join(appData, 'AiOStudio', 'videodownload.json')
}

export function docCaiDat(): CaiDat {
  const fs = getFs()
  const f = duongFile()
  try {
    if (fs && f && fs.existsSync(f)) {
      return { ...MAC_DINH, ...JSON.parse(fs.readFileSync(f, 'utf8')) }
    }
  } catch {}
  try {
    const raw = localStorage.getItem(KHOA_LS)
    if (raw) return { ...MAC_DINH, ...JSON.parse(raw) }
  } catch {}
  return { ...MAC_DINH }
}

export function ghiCaiDat(cd: CaiDat): void {
  const fs = getFs()
  const path = getPath()
  const f = duongFile()
  const noiDung = JSON.stringify(cd, null, 2)
  try {
    if (fs && path && f) {
      const tm = path.dirname(f)
      if (!fs.existsSync(tm)) fs.mkdirSync(tm, { recursive: true })
      fs.writeFileSync(f, noiDung, 'utf8')
    }
  } catch {}
  try {
    localStorage.setItem(KHOA_LS, noiDung)
  } catch {}
}

// ── Lịch sử đã tải ────────────────────────────────────────────────────────
// Đo 08/09: anh Tiến reload panel là mất danh sách "Đã tải" → không biết file
// vừa tải nằm đâu. Lưu 30 mục gần nhất ra đĩa, cùng thư mục với cài đặt.

const TOI_DA_LICH_SU = 30

function duongLichSu(): string {
  const path = getPath()
  const appData = bienMT('APPDATA')
  if (!path || !appData) return ''
  return path.join(appData, 'AiOStudio', 'videodownload-lichsu.json')
}

export function docLichSu<T>(): T[] {
  const fs = getFs()
  const f = duongLichSu()
  try {
    if (fs && f && fs.existsSync(f)) {
      const d = JSON.parse(fs.readFileSync(f, 'utf8'))
      return Array.isArray(d) ? d : []
    }
  } catch {}
  return []
}

export function ghiLichSu<T>(ds: T[]): void {
  const fs = getFs()
  const path = getPath()
  const f = duongLichSu()
  try {
    if (fs && path && f) {
      const tm = path.dirname(f)
      if (!fs.existsSync(tm)) fs.mkdirSync(tm, { recursive: true })
      fs.writeFileSync(f, JSON.stringify(ds.slice(0, TOI_DA_LICH_SU), null, 2), 'utf8')
    }
  } catch {}
}

/** Thư mục Downloads của Windows — đường lùi khi project chưa lưu. */
export function thuMucDownloads(): string {
  const path = getPath()
  const home = bienMT('USERPROFILE')
  if (!path || !home) return ''
  return path.join(home, 'Downloads')
}
