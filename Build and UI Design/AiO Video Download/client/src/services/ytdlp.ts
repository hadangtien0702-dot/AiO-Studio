/**
 * ytdlp.ts — LÕI của panel: gọi `yt-dlp.exe` đóng gói trong `bin/win64/`.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * VÌ SAO LÀ yt-dlp (đo 08/09/2026, xem PROGRESS.md)
 * ══════════════════════════════════════════════════════════════════════════
 * - Giấy phép Unlicense (public domain) → bán được, không phải mở mã nguồn.
 * - Hỗ trợ ~1.800 trang. Đo thật 08/09: YouTube dài + Shorts + Facebook công
 *   khai tải được. Vimeo đòi đăng nhập (cookie trình duyệt). TikTok chặn ngẫu
 *   nhiên → tự thử lại.
 *
 * ☠️ YOUTUBE CẦN MỘT RUNTIME JAVASCRIPT NGOÀI — luôn truyền
 * `--js-runtimes quickjs:<đường dẫn>` (qjs.exe 2,1 MB). Thiếu thì YouTube mất
 * định dạng mà chỉ WARNING — nên thiếu qjs/ffmpeg thì CHẶN, không lặng lẽ bỏ cờ.
 *
 * ☠️ `--print` NGẦM BẬT `--simulate` VÀ `--quiet` — phải kèm `--no-simulate`;
 * và vì quiet nên dòng hậu xử lý ("[Merger]"…) KHÔNG ra stdout. Đo 21/09: dòng
 * `--progress-template postprocess:` ra **stderr** → đọc stderr theo từng dòng.
 *
 * ☠️ Tải 1080p/720p = HAI luồng lần lượt (hình rồi tiếng). Đo 21/09: tiến độ
 * chạy 0→100% cho luồng 135, rồi lại 0→100% cho luồng 140 → trước đây thanh
 * "nhảy về 0". Giờ cộng dồn theo `info.format_id` + kích thước lấy từ dòng
 * `video:` in trước khi tải.
 */

import { getChildProcess, getFs, getPath, bienMT, nodeRequire } from '../lib/node'
import { extensionPath } from '../lib/cep'

export const EXT_ID = 'com.aiostudio.videodownload'

export type ChatLuong = 'tot-nhat' | '1080' | '720' | '480' | 'mp3'
export type CookieTrinhDuyet = '' | 'edge' | 'chrome' | 'firefox'

export interface TuyChon {
  chatLuong: ChatLuong
  thuMuc: string
  cookies: CookieTrinhDuyet
  /** id video (từ docThongTin) — để dọn đúng file dở dang khi Dừng. */
  id?: string
}

export interface ThongTinVideo {
  id: string
  tieuDe: string
  thoiLuong: number
  anhBia: string
  kenh: string
  trang: string
  /** Các chiều cao hình có sẵn, giảm dần, đã lọc trùng. */
  chieuCao: number[]
}

export interface TienDo {
  /** Phần trăm CỘNG DỒN mọi luồng — chỉ đi lên. */
  phanTram: number
  tocDo: string
  conLai: string
  daTai: number
  tongCong: number
}

export type GiaiDoan = 'lay-thong-tin' | 'dang-tai' | 'dang-xu-ly' | 'thu-lai'

/**
 * ☠️ TIKTOK CHẶN NGẪU NHIÊN — đo 08/09/2026: cùng lệnh 6 lần → 5 qua / 1 bị
 * 403; `--impersonate chrome` không đỡ. Anti-bot xác suất → THỬ LẠI 3 lần
 * (còn lỗi ≈ 0,5%). Chỉ thử lại lỗi "bị chặn"/"mất mạng".
 */
export const SO_LAN_THU = 3
const NGHI_GIUA_LAN_MS = 1500

function nenThuLai(e: LoiTai): boolean {
  return e.ma === 'bi-chan' || e.ma === 'mat-mang'
}

export interface KetQuaTai {
  duongDan: string
  vcodec: string
  acodec: string
  rong: number
  cao: number
  thoiLuong: number
}

export interface LoiTai {
  ma:
    | 'khong-phai-link'
    | 'khong-ho-tro'
    | 'khong-xem-duoc'
    | 'can-dang-nhap'
    | 'bi-chan'
    | 'mat-mang'
    | 'thieu-engine'
    | 'khong-chay-duoc'
    | 'cookie'
    | 'khong-ghi-duoc'
    | 'la-playlist'
    | 'huy'
    | 'khac'
  chiTiet: string
}

// ── Tìm binary ────────────────────────────────────────────────────────────

function ungVien(tenFile: string): string[] {
  const path = getPath()
  if (!path) return []
  const ds: string[] = []
  const ext = extensionPath()
  if (ext) ds.push(path.join(ext, 'bin', 'win64', tenFile))
  const appData = bienMT('APPDATA')
  if (appData) {
    ds.push(path.join(appData, 'Adobe', 'CEP', 'extensions', EXT_ID, 'bin', 'win64', tenFile))
    // Kho dùng chung cả bộ — đặt CUỐI để bản có bin/ riêng không hồi quy.
    ds.push(path.join(appData, 'AiOStudio', 'bin', 'win64', tenFile))
  }
  return ds
}

function timBinary(tenFile: string): string {
  const fs = getFs()
  if (!fs) return ''
  for (const p of ungVien(tenFile)) {
    try {
      if (fs.existsSync(p)) return p
    } catch {}
  }
  return ''
}

// ── Bản engine CẬP NHẬT ───────────────────────────────────────────────────
// Nút "Cập nhật engine" KHÔNG ghi đè yt-dlp.exe trong thư mục extension đã ký
// (cài bản panel sau sẽ chép đè bản cũ lên → lùi phiên bản im lặng). Nó chép
// ra %APPDATA%\AiOStudio\videodownload\engine\ rồi `-U` ở đó; ghi phiên bản
// vào engine.json. Dùng bản sao khi nó MỚI HƠN bản đóng gói (so chuỗi ngày
// YYYY.MM.DD của yt-dlp — so chữ là đủ).

function thuMucBanSao(): string {
  const path = getPath()
  const appData = bienMT('APPDATA')
  return path && appData ? path.join(appData, 'AiOStudio', 'videodownload', 'engine') : ''
}

let _phienBanGoi = ''

function banSaoMoiHon(): string {
  const fs = getFs()
  const path = getPath()
  const tm = thuMucBanSao()
  if (!fs || !path || !tm) return ''
  try {
    const exe = path.join(tm, 'yt-dlp.exe')
    const js = path.join(tm, 'engine.json')
    if (!fs.existsSync(exe) || !fs.existsSync(js)) return ''
    const v = String(JSON.parse(fs.readFileSync(js, 'utf8')).phienBan || '')
    return v && (!_phienBanGoi || v > _phienBanGoi) ? exe : ''
  } catch {
    return ''
  }
}

export function duongYtDlp(): string {
  return banSaoMoiHon() || timBinary('yt-dlp.exe')
}
export function duongQjs(): string {
  return timBinary('qjs.exe')
}
export function duongFfmpeg(): string {
  return timBinary('ffmpeg.exe')
}

/** Ba thứ phải có để chạy; thiếu cái nào thì trả tên cái đó. Gọi lại trước MỖI lần đọc/tải (vài existsSync). */
export function kiemEngine(): { du: boolean; thieu: string[] } {
  const thieu: string[] = []
  if (!duongYtDlp()) thieu.push('yt-dlp.exe')
  if (!duongQjs()) thieu.push('qjs.exe')
  if (!duongFfmpeg()) thieu.push('ffmpeg.exe')
  return { du: thieu.length === 0, thieu }
}

/** Tham số chung cho mọi lần gọi yt-dlp. */
function thamSoChung(cookies: CookieTrinhDuyet): string[] {
  const path = getPath()
  // ☠️ `--encoding utf-8` BẮT BUỘC (đo 08/09): không có thì `--print` in đường
  // dẫn MẤT DẤU tiếng Việt → panel tìm sai file. PYTHONUTF8 không đỡ.
  const args = ['--encoding', 'utf-8', '--no-playlist', '--no-warnings', '--no-colors', '--windows-filenames', '--no-mtime']
  args.push('--js-runtimes', 'quickjs:' + duongQjs())
  args.push('--ffmpeg-location', path.dirname(duongFfmpeg()))
  if (cookies) args.push('--cookies-from-browser', cookies)
  return args
}

// ── Đọc thông tin ─────────────────────────────────────────────────────────

/**
 * Rút link từ chuỗi dán vào. Khách hay gửi "Lấy đoạn này nhé https://youtu.be/…"
 * — chép cả dòng thì vẫn ra link; "www.youtube.com/…" thì thêm https://.
 */
export function rutLink(s: string): string {
  const t = (s || '').trim()
  const m = /https?:\/\/[^\s<>"']+/i.exec(t)
  if (m) return m[0].replace(/[),.;!?]+$/, '')
  const w = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/[^\s<>"']*$/i.exec(t)
  if (w) return 'https://' + w[0]
  return ''
}

export function laLink(s: string): boolean {
  return /^https?:\/\/\S+$/i.test((s || '').trim())
}

/**
 * Chạy yt-dlp -J để lấy tiêu đề / thời lượng / ảnh bìa / chiều cao có sẵn.
 * Không tải gì. Mất 1–4 giây tuỳ trang.
 */
export function docThongTin(url: string, cookies: CookieTrinhDuyet): { huy: () => void; xong: Promise<ThongTinVideo> } {
  let hienTai: { huy: () => void } | null = null
  let daHuy = false
  const xong = (async () => {
    let loiCuoi: LoiTai = { ma: 'khac', chiTiet: '' }
    for (let lan = 1; lan <= SO_LAN_THU; lan++) {
      if (daHuy) throw <LoiTai>{ ma: 'huy', chiTiet: '' }
      const p = docThongTinMotLan(url, cookies)
      hienTai = p
      try {
        return await p.xong
      } catch (e) {
        loiCuoi = e as LoiTai
        // ☠️ Bị huỷ (dán link khác) thì tiến trình bị giết → thoát mã lỗi với
        // stderr rỗng → trước đây thành lỗi 'khac' đè lên link MỚI (hộp đỏ
        // "Tải không thành công" nằm lì dù link mới đã đọc xong).
        if (daHuy) throw <LoiTai>{ ma: 'huy', chiTiet: '' }
        if (!nenThuLai(loiCuoi) || lan === SO_LAN_THU) throw loiCuoi
        await new Promise((r) => setTimeout(r, NGHI_GIUA_LAN_MS))
      }
    }
    throw loiCuoi
  })()
  return {
    huy: () => {
      daHuy = true
      if (hienTai) hienTai.huy()
    },
    xong,
  }
}

function docThongTinMotLan(url: string, cookies: CookieTrinhDuyet): { huy: () => void; xong: Promise<ThongTinVideo> } {
  const cp = getChildProcess()
  const exe = duongYtDlp()
  let proc: any = null
  const xong = new Promise<ThongTinVideo>((resolve, reject) => {
    const eng = kiemEngine()
    if (!cp || !eng.du) {
      reject(<LoiTai>{ ma: 'thieu-engine', chiTiet: eng.thieu.join(', ') || 'yt-dlp.exe' })
      return
    }
    // ☠️ --flat-playlist: link kênh/playlist KHÔNG đi đọc từng video (đo 21/09:
    // link kênh 194 video trả về trong 3,5 s thay vì hàng phút), và panel chặn
    // được trước khi người dùng bấm tải cả trăm video.
    // `-I :2`: link kênh LỚN vẫn bị duyệt hết trang dù --flat-playlist — soi 21/09
    // đo @NASA/videos 5.555 mục mất 64–75 s chỉ để báo "đây là danh sách"; có -I :2
    // còn 1,6 s. Video đơn không ảnh hưởng (-I chỉ áp cho playlist).
    const args = [...thamSoChung(cookies), '--flat-playlist', '-I', ':2', '-J', url.trim()]
    let out = ''
    let err = ''
    proc = cp.spawn(exe, args, { windowsHide: true })
    proc.stdout.on('data', (d: any) => (out += d.toString()))
    proc.stderr.on('data', (d: any) => (err += d.toString()))
    proc.on('error', (e: any) => reject(loiSpawn(e)))
    proc.on('close', (code: number) => {
      if (code !== 0 || !out.trim()) {
        reject(dichLoi(err))
        return
      }
      try {
        const d = JSON.parse(out)
        if (d._type === 'playlist' || Array.isArray(d.entries)) {
          // entries bị cắt còn 2 (-I :2) → chỉ tin playlist_count; không có thì câu "nhiều video".
          const n = Number(d.playlist_count || 0)
          reject(<LoiTai>{ ma: 'la-playlist', chiTiet: n > 2 ? String(n) : '' })
          return
        }
        // Mức theo CẠNH NGẮN (khớp `-S res:N`): video dọc 1080×1920 là "1080p".
        const caos = new Set<number>()
        for (const f of d.formats || []) {
          if (!f.vcodec || f.vcodec === 'none' || !f.height) continue
          caos.add(f.width ? Math.min(Number(f.width), Number(f.height)) : Number(f.height))
        }
        resolve({
          id: String(d.id || ''),
          tieuDe: String(d.title || d.id || ''),
          thoiLuong: Number(d.duration || 0),
          anhBia: String(d.thumbnail || ''),
          kenh: String(d.uploader || d.channel || ''),
          trang: String(d.extractor_key || d.extractor || ''),
          chieuCao: Array.from(caos).sort((a, b) => b - a),
        })
      } catch (e) {
        reject(<LoiTai>{ ma: 'khac', chiTiet: String(e) })
      }
    })
  })
  return { huy: () => proc && proc.exitCode === null && giet(proc), xong }
}

// ── Tải ───────────────────────────────────────────────────────────────────

/**
 * Chuỗi chọn định dạng.
 *
 * ☠️ ƯU TIÊN H.264 (`avc1`) TRƯỚC — Premiere KHÔNG đọc VP9/webm, AV1 chỉ bản
 * mới. YouTube từ 1440p trở lên hầu như chỉ có VP9/AV1, nên "tốt nhất" vẫn
 * thử avc1 trước rồi mới rơi xuống codec khác; panel báo codec ra.
 */
function chuoiDinhDang(cl: ChatLuong): string[] {
  if (cl === 'mp3') return ['-f', 'ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '0']
  // TikTok đặt tên codec là 'h264' chứ không phải 'avc1' — thêm nhánh cho nó.
  const f =
    'bv*[vcodec^=avc1]+ba[ext=m4a]/' +
    'bv*[vcodec^=h264]+ba/' +
    'bv*[ext=mp4]+ba[ext=m4a]/' +
    'b[vcodec^=avc1]/b[vcodec^=h264]/' +
    'bv*+ba/b'
  // ☠️ Mức chất lượng theo CẠNH NGẮN (`-S res:N`), KHÔNG lọc [height<=N]. Đo 21/09
  // trên Shorts Y11uiFq2aSY: [height<=1080] loại mất bản 1080×1920 (height=1920)
  // → tải ra 480×854 trong khi nút ghi "1080p"; `-S res:1080` ra đúng 1080×1920.
  // Video ngang (C5o3tgr-AgI) hai cách ra y hệt nhau (1920×1080, 1280×720).
  const sx = cl === 'tot-nhat' ? [] : ['-S', 'res:' + cl]
  return ['-f', f, ...sx, '--merge-output-format', 'mp4']
}

/**
 * Tên file ra. ☠️ Đo 21/09: tải lại CÙNG link ở mức khác → cùng tên đích →
 * yt-dlp "already downloaded", trả lại FILE CŨ (470p) nhưng in thông số của mức
 * MỚI (352p) → nhãn trên panel sai. Nên đưa độ phân giải vào tên: mỗi mức một
 * file. Dùng `resolution` (1080x1920) chứ không `height` — video dọc 1080 mà
 * ghi "1920p" là sai. MP3 không có hình → mẫu riêng.
 */
function mauTen(cl: ChatLuong): string {
  // `%(resolution& {}|)s`: nguồn không có kích thước thì bỏ hẳn đuôi (soi 21/09:
  // trước đó ra "… NA.mp4").
  return cl === 'mp3' ? '%(title).80s [%(id)s].%(ext)s' : '%(title).80s [%(id)s]%(resolution& {}|)s.%(ext)s'
}

const DAU_KICH_THUOC = 'AIOKT|'
const DAU_TIEN_DO = 'AIOTD|'
const DAU_XU_LY = 'AIOXL|'
const DAU_XONG = 'AIOXONG|'

export interface TienTrinhTai {
  huy: () => void
  xong: Promise<KetQuaTai>
}

/**
 * Tải một link. `onTienDo` gọi theo từng dòng tiến độ (~2 lần/giây),
 * `onGiaiDoan` khi đổi giai đoạn. Promise resolve khi file đã nằm đúng chỗ.
 */
export function taiVideo(
  url: string,
  tc: TuyChon,
  onTienDo: (t: TienDo) => void,
  onGiaiDoan: (g: GiaiDoan, lan?: number) => void,
): TienTrinhTai {
  let hienTai: TienTrinhTai | null = null
  let daHuy = false
  // Sàn tiến độ dùng chung MỌI lần thử: lần thử sau yt-dlp có thể in 0% trước khi
  // nhận ra phần đã tải — thanh không được tụt lùi (đúng lỗi "nhảy" vừa sửa).
  let san = 0
  const tienDoMotChieu = (t: TienDo) => {
    san = Math.max(san, t.phanTram)
    onTienDo({ ...t, phanTram: san })
  }
  // Chụp danh sách file MỘT LẦN cho cả chuỗi thử lại (soi 21/09: chụp lại mỗi lần
  // thì .part của lần 1 bị coi là "có từ trước" → Dừng ở lần 2 để lại rác).
  // Dừng giữa chừng chỉ xoá phần CHÊNH LỆCH mang [id] (bài 5am-bis).
  const fs = getFs()
  let truoc = new Set<string>()
  try {
    if (fs && fs.existsSync(tc.thuMuc)) truoc = new Set(fs.readdirSync(tc.thuMuc) as string[])
  } catch {}
  let dangNghi = false
  const xong = (async () => {
    let loiCuoi: LoiTai = { ma: 'khac', chiTiet: '' }
    for (let lan = 1; lan <= SO_LAN_THU; lan++) {
      if (daHuy) throw <LoiTai>{ ma: 'huy', chiTiet: '' }
      const p = taiVideoMotLan(url, tc, truoc, tienDoMotChieu, onGiaiDoan)
      hienTai = p
      try {
        return await p.xong
      } catch (e) {
        loiCuoi = e as LoiTai
        if (daHuy) throw <LoiTai>{ ma: 'huy', chiTiet: '' }
        if (loiCuoi.ma === 'huy' || !nenThuLai(loiCuoi) || lan === SO_LAN_THU) throw loiCuoi
        onGiaiDoan('thu-lai', lan + 1)
        dangNghi = true
        await new Promise((r) => setTimeout(r, NGHI_GIUA_LAN_MS))
        dangNghi = false
      }
    }
    throw loiCuoi
  })()
  return {
    huy: () => {
      daHuy = true
      // Đang nghỉ giữa hai lần thử: không còn tiến trình để giết (PID cũ có thể đã
      // bị Windows cấp cho chương trình KHÁC) → dọn file dở ngay.
      if (dangNghi) donFileMoi(tc.thuMuc, tc.id || '', truoc)
      else if (hienTai) hienTai.huy()
    },
    xong,
  }
}

function taiVideoMotLan(
  url: string,
  tc: TuyChon,
  truoc: Set<string>,
  onTienDo: (t: TienDo) => void,
  onGiaiDoan: (g: GiaiDoan) => void,
): TienTrinhTai {
  const cp = getChildProcess()
  const fs = getFs()
  const path = getPath()
  const exe = duongYtDlp()
  let proc: any = null
  let daHuy = false
  let daDong = false

  const xong = new Promise<KetQuaTai>((resolve, reject) => {
    const eng = kiemEngine()
    if (!cp || !fs || !path || !eng.du) {
      reject(<LoiTai>{ ma: 'thieu-engine', chiTiet: eng.thieu.join(', ') || 'yt-dlp.exe' })
      return
    }

    const args = [
      ...thamSoChung(tc.cookies),
      ...chuoiDinhDang(tc.chatLuong),
      '-N', '4',
      // Chốt thứ hai (thứ nhất là docThongTin chặn playlist): có lọt thì cũng chỉ 1 file.
      '-I', '1',
      // Không ghi đè file đã hậu xử lý (MP3 cũ còn tốt không bị cắt cụt khi Dừng).
      '--no-post-overwrites',
      // ☠️ Đo 21/09: ExtendScript File VÀ importFiles của Premiere đều GIẢI MÃ %XX
      // trong đường dẫn → tên có '%' ("100%", "50% OFF") không nhập được, và
      // importFiles bật hộp modal "File Import Failure" chặn mọi panel. Đổi '%'
      // thành '％' (toàn khổ) ngay trong tên — cùng cách --windows-filenames đổi ':'.
      '--replace-in-metadata', 'title', '%', '％',
      '--newline', '--progress', '--no-simulate',
      '--print',
      `video:${DAU_KICH_THUOC}%(requested_formats.0.format_id)s=%(requested_formats.0.filesize,requested_formats.0.filesize_approx)s|%(requested_formats.1.format_id)s=%(requested_formats.1.filesize,requested_formats.1.filesize_approx)s|%(format_id)s=%(filesize,filesize_approx)s`,
      '--progress-template',
      // `a,b` = lấy a, không có thì lấy b (cú pháp yt-dlp).
      `download:${DAU_TIEN_DO}%(info.format_id)s|%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress.downloaded_bytes)s|%(progress.total_bytes,progress.total_bytes_estimate)s`,
      '--progress-template',
      `postprocess:${DAU_XU_LY}%(progress.postprocessor)s|%(progress.status)s`,
      '--print',
      `after_move:${DAU_XONG}%(filepath)s|%(vcodec)s|%(acodec)s|%(width)s|%(height)s|%(duration)s`,
      '-P', tc.thuMuc,
      '-o', mauTen(tc.chatLuong),
      url.trim(),
    ]
    let err = ''
    let ketQua: KetQuaTai | null = null
    let giaiDoan: GiaiDoan = 'lay-thong-tin'
    onGiaiDoan(giaiDoan)

    // Cộng dồn tiến độ nhiều luồng.
    const kichThuoc = new Map<string, number>() // format_id → byte (ước lượng trước khi tải)
    let tongDuKien = 0
    const daXong = new Map<string, number>() // format_id đã tải xong → byte thật
    let fidDang = ''
    let caoNhat = 0

    const doiGiaiDoan = (g: GiaiDoan) => {
      if (g !== giaiDoan) {
        giaiDoan = g
        onGiaiDoan(g)
      }
    }
    // yt-dlp in "NA"/"Unknown" khi chưa ước lượng được — coi như trống.
    const sach = (s: string) => (/^(NA|Unknown|N\/A)$/i.test((s || '').trim()) ? '' : (s || '').trim())

    const xuLyDong = (dong: string) => {
      const s = dong.trim()
      if (!s) return
      let i = s.indexOf(DAU_KICH_THUOC)
      if (i >= 0) {
        // "137=889451883|140=104910621|137+140=994362504" — lấy từng luồng; không
        // có luồng tách (định dạng đơn) thì lấy mục cuối.
        const cap = s.slice(i + DAU_KICH_THUOC.length).split('|').map((x) => x.split('='))
        const tach = cap.slice(0, 2).filter((c) => c[0] && c[0] !== 'NA' && parseInt(c[1], 10) > 0)
        const dung = tach.length ? tach : cap.slice(2).filter((c) => c[0] && parseInt(c[1], 10) > 0)
        kichThuoc.clear()
        for (const c of dung) kichThuoc.set(c[0], parseInt(c[1], 10))
        tongDuKien = Array.from(kichThuoc.values()).reduce((a, b) => a + b, 0)
        return
      }
      i = s.indexOf(DAU_TIEN_DO)
      if (i >= 0) {
        const p = s.slice(i + DAU_TIEN_DO.length).split('|')
        doiGiaiDoan('dang-tai')
        const fid = p[0] || ''
        const daTai = parseInt(p[4], 10) || 0
        const tongLuong = parseInt(p[5], 10) || 0
        if (fid && fid !== fidDang) {
          // Sang luồng mới: luồng trước coi như xong với số byte thật của nó.
          if (fidDang && !daXong.has(fidDang)) daXong.set(fidDang, kichThuoc.get(fidDang) || 0)
          fidDang = fid
        }
        if (fid && tongLuong > 0) kichThuoc.set(fid, Math.max(kichThuoc.get(fid) || 0, tongLuong))
        const xongByte = Array.from(daXong.values()).reduce((a, b) => a + b, 0)
        const tong = Math.max(tongDuKien, xongByte + tongLuong, Array.from(kichThuoc.values()).reduce((a, b) => a + b, 0))
        const daTaiTong = xongByte + daTai
        let pt = tong > 0 ? (daTaiTong / tong) * 100 : parseFloat(p[1]) || 0
        pt = Math.min(100, Math.max(caoNhat, pt))
        caoNhat = pt
        onTienDo({ phanTram: pt, tocDo: sach(p[2]), conLai: sach(p[3]), daTai: daTaiTong, tongCong: tong })
        return
      }
      i = s.indexOf(DAU_XU_LY)
      if (i >= 0) {
        // Ghép hình+tiếng / tách MP3 / dời file. Không lộ tên bước lên màn hình.
        doiGiaiDoan('dang-xu-ly')
        return
      }
      i = s.indexOf(DAU_XONG)
      if (i >= 0) {
        const p = s.slice(i + DAU_XONG.length).split('|')
        ketQua = {
          duongDan: p[0],
          vcodec: p[1] || '',
          acodec: p[2] || '',
          rong: parseInt(p[3], 10) || 0,
          cao: parseInt(p[4], 10) || 0,
          thoiLuong: parseFloat(p[5]) || 0,
        }
      }
    }

    proc = cp.spawn(exe, args, { windowsHide: true })
    // StringDecoder: một ký tự UTF-8 nhiều byte có thể bị cắt giữa hai gói.
    const SD = nodeRequire()!('string_decoder').StringDecoder
    const docTheoDong = (ghiErr: boolean) => {
      const giaiMa = new SD('utf8')
      let duoi = ''
      return {
        nap: (d: any) => {
          const s = giaiMa.write(d)
          if (ghiErr) err += s
          duoi += s
          const dongs = duoi.split(/\r?\n/)
          duoi = dongs.pop() || ''
          dongs.forEach(xuLyDong)
        },
        het: () => {
          if (duoi) xuLyDong(duoi)
          duoi = ''
        },
      }
    }
    const dOut = docTheoDong(false)
    const dErr = docTheoDong(true)
    proc.stdout.on('data', dOut.nap)
    proc.stderr.on('data', dErr.nap)
    proc.on('error', (e: any) => reject(loiSpawn(e)))
    proc.on('close', async (code: number) => {
      daDong = true
      dOut.het()
      dErr.het()
      if (daHuy) {
        // Chờ cây tiến trình (ffmpeg con) chết HẲN rồi mới dọn — không thì file
        // còn bị giữ, xoá lỗi EBUSY im lặng.
        await choGiet
        donFileMoi(tc.thuMuc, tc.id || '', truoc)
        reject(<LoiTai>{ ma: 'huy', chiTiet: '' })
        return
      }
      if (code === 0 && ketQua) {
        resolve(ketQua)
        return
      }
      reject(code === 0 ? <LoiTai>{ ma: 'khac', chiTiet: 'NO_PATH' } : dichLoi(err))
    })
  })

  let choGiet: Promise<void> = Promise.resolve()
  return {
    huy: () => {
      daHuy = true
      // Đã đóng rồi thì KHÔNG taskkill: PID có thể đã thuộc chương trình khác.
      if (proc && !daDong && proc.exitCode === null) choGiet = giet(proc)
    },
    xong,
  }
}

/**
 * Sau khi Dừng: xoá đúng những file MỚI xuất hiện trong lượt tải này và mang
 * [id] của video (.part, .ytdl, .fNNN.mp4, .temp.mp4, file gốc của MP3…).
 * File có từ trước (kể cả bản đã tải trọn lần trước) không đụng. Trả số file đã xoá.
 */
export function donFileMoi(thuMuc: string, id: string, truoc: Set<string>): number {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path || !thuMuc || !id) return 0
  let n = 0
  try {
    for (const ten of fs.readdirSync(thuMuc) as string[]) {
      if (truoc.has(ten)) continue
      if (ten.indexOf('[' + id + ']') < 0) continue
      try {
        fs.unlinkSync(path.join(thuMuc, ten))
        n++
      } catch {}
    }
  } catch {}
  return n
}

/**
 * Dừng yt-dlp (và ffmpeg con của nó). Resolve khi cây tiến trình đã chết.
 *
 * ☠️ yt-dlp.exe là bản PyInstaller: tiến trình CHA (bootloader) giải nén Python ra
 * %TEMP%\_MEIxxxx rồi chạy tiến trình CON làm việc thật. taskkill /T vào CHA →
 * cha chết không kịp xoá _MEI: **22,7 MB / 139 file rác mỗi lần Dừng** (soi 21/09,
 * đo 3/3 lần). Giết CON trước (cây con gồm ffmpeg) → cha tự dọn _MEI rồi thoát
 * (đo 0/3 sót, 'close' tới sau ~1,3 s). Cha còn sống sau 4 s → giết cả cây.
 * `proc.kill()` trần thì chỉ giết cha, để lại ffmpeg chạy ngầm (bài 08/09).
 */
function giet(proc: any): Promise<void> {
  const cp = getChildProcess()
  return new Promise((resolve) => {
    if (!cp || !proc || !proc.pid) {
      try {
        proc && proc.kill()
      } catch {}
      resolve()
      return
    }
    const cha = String(proc.pid)
    const caCay = () => {
      try {
        const k = cp.spawn('taskkill', ['/pid', cha, '/T', '/F'], { windowsHide: true })
        k.on('close', () => resolve())
        k.on('error', () => resolve())
      } catch {
        resolve()
      }
    }
    const ps =
      `$c = @(Get-CimInstance Win32_Process -Filter "ParentProcessId=${cha}" | Where-Object { $_.Name -ieq 'yt-dlp.exe' })\n` +
      `foreach ($x in $c) { taskkill /pid $x.ProcessId /T /F | Out-Null }\n` +
      `'CON=' + $c.Count`
    let out = ''
    try {
      const Buf = nodeRequire()!('buffer').Buffer
      const b64 = Buf.from(ps, 'utf16le').toString('base64')
      const k = cp.spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', b64], { windowsHide: true })
      k.stdout.on('data', (d: any) => (out += d.toString()))
      k.on('error', caCay)
      k.on('close', () => {
        if (!/CON=[1-9]/.test(out)) {
          caCay()
          return
        }
        const t0 = Date.now()
        const cho = () => {
          if (proc.exitCode !== null) resolve()
          else if (Date.now() - t0 > 4000) caCay()
          else setTimeout(cho, 150)
        }
        cho()
      })
    } catch {
      caCay()
    }
  })
}

// ── Dịch lỗi ──────────────────────────────────────────────────────────────

/** Lỗi khi CHẠY exe (không phải thiếu file): diệt virus / Smart App Control chặn. */
function loiSpawn(e: any): LoiTai {
  const s = String((e && e.code) || e)
  if (/ENOENT/.test(s)) return { ma: 'thieu-engine', chiTiet: 'yt-dlp.exe' }
  return { ma: 'khong-chay-duoc', chiTiet: s }
}

/**
 * Đổi stderr của yt-dlp thành mã lỗi panel hiểu được. Danh sách mẫu lấy từ
 * lỗi ĐÃ GẶP THẬT + câu chuẩn của yt-dlp. Không khớp thì 'khac' kèm dòng ERROR
 * gốc (chỉ để trong tooltip, không in thô lên màn hình).
 */
export function dichLoi(stderr: string): LoiTai {
  const dongs = stderr.split(/\r?\n/).filter((l) => l.indexOf(DAU_XU_LY) < 0 && l.indexOf(DAU_TIEN_DO) < 0)
  const dongLoi = (dongs.find((l) => l.startsWith('ERROR:')) || dongs.filter((l) => l.trim()).pop() || '').replace(/^ERROR:\s*/, '')
  // ☠️ Bỏ tiền tố "[extractor] <id>:" trước khi so (soi 21/09): id số của TikTok /
  // Facebook như 7404031234567890123 chứa sẵn "403"/"404" → video đã xoá bị xếp
  // "bị chặn" (thử lại 3 lần vô ích), rớt mạng bị xếp "không xem được" (không thử lại).
  // Mã HTTP so có ranh giới từ.
  const s = dongLoi.replace(/^\[[^\]]+\]\s*[^:\s]+:\s*/, '').toLowerCase()
  if (!s) return { ma: 'khac', chiTiet: '' }
  if (s.includes('is not a valid url') || s.includes('unsupported url')) {
    return { ma: s.includes('unsupported') ? 'khong-ho-tro' : 'khong-phai-link', chiTiet: dongLoi }
  }
  // Trước 'can-dang-nhap': câu cookie cũng chứa chữ "cookie".
  if (s.includes('cookie database') || s.includes('dpapi') || s.includes('could not copy') || s.includes('failed to decrypt') || (s.includes('could not find') && s.includes('cookie'))) {
    return { ma: 'cookie', chiTiet: dongLoi }
  }
  if (s.includes('sign in') || s.includes('logged-in') || s.includes('login') || s.includes('cookies') || s.includes('private video')) {
    return { ma: 'can-dang-nhap', chiTiet: dongLoi }
  }
  if (s.includes('unable to create directory') || s.includes('permission denied') || s.includes('no space left') || s.includes('cannot find the path') || s.includes('errno 13') || s.includes('errno 28')) {
    return { ma: 'khong-ghi-duoc', chiTiet: dongLoi }
  }
  if (/\b(403|429)\b/.test(s) || s.includes('blocked') || s.includes('captcha')) {
    return { ma: 'bi-chan', chiTiet: dongLoi }
  }
  if (s.includes('getaddrinfo') || s.includes('urlopen error') || s.includes('timed out') || s.includes('connection')) {
    return { ma: 'mat-mang', chiTiet: dongLoi }
  }
  if (s.includes('unavailable') || s.includes('video not available') || s.includes('removed') || s.includes('not exist') || /\b404\b/.test(s)) {
    return { ma: 'khong-xem-duoc', chiTiet: dongLoi }
  }
  return { ma: 'khac', chiTiet: dongLoi }
}

// ── Cập nhật engine ───────────────────────────────────────────────────────

function chayLay(exe: string, args: string[]): Promise<{ code: number; out: string }> {
  const cp = getChildProcess()
  return new Promise((resolve) => {
    if (!cp || !exe) {
      resolve({ code: -1, out: '' })
      return
    }
    let out = ''
    const p = cp.spawn(exe, args, { windowsHide: true })
    p.stdout.on('data', (d: any) => (out += d.toString()))
    p.stderr.on('data', (d: any) => (out += d.toString()))
    p.on('error', (e: any) => resolve({ code: -1, out: String(e) }))
    p.on('close', (code: number) => resolve({ code, out: out.trim() }))
  })
}

/**
 * `yt-dlp -U` trên BẢN SAO ở %APPDATA% (xem thuMucBanSao). YouTube đổi cách
 * giấu link vài tuần một lần; đây là đường cứu khi gặp lỗi lạ.
 * Trả { ok, phienBan, moi } — moi = có lên bản mới hay đã mới nhất rồi.
 */
export async function capNhatEngine(): Promise<{ ok: boolean; phienBan: string; moi: boolean; chiTiet: string }> {
  const fs = getFs()
  const path = getPath()
  const tm = thuMucBanSao()
  const goc = timBinary('yt-dlp.exe')
  if (!fs || !path || !tm || !goc) return { ok: false, phienBan: '', moi: false, chiTiet: 'yt-dlp.exe' }
  const exe = path.join(tm, 'yt-dlp.exe')
  try {
    if (!fs.existsSync(tm)) fs.mkdirSync(tm, { recursive: true })
    if (!fs.existsSync(exe)) fs.copyFileSync(goc, exe)
  } catch (e) {
    return { ok: false, phienBan: '', moi: false, chiTiet: String(e) }
  }
  const truoc = (await chayLay(exe, ['--version'])).out
  const r = await chayLay(exe, ['-U'])
  const sau = (await chayLay(exe, ['--version'])).out
  const ok = r.code === 0 && /^\d{4}\.\d{2}\.\d{2}/.test(sau)
  if (ok) {
    try {
      fs.writeFileSync(path.join(tm, 'engine.json'), JSON.stringify({ phienBan: sau, luc: new Date().toISOString() }), 'utf8')
    } catch {}
  }
  return { ok, phienBan: sau, moi: ok && sau !== truoc, chiTiet: r.out.split(/\r?\n/).pop() || '' }
}

/** Phiên bản engine ĐANG DÙNG. Lần đầu gọi cũng ghi nhớ phiên bản bản đóng gói (để so bản sao). */
export async function phienBanEngine(): Promise<string> {
  const goc = timBinary('yt-dlp.exe')
  if (goc && !_phienBanGoi) _phienBanGoi = (await chayLay(goc, ['--version'])).out
  const dung = duongYtDlp()
  if (dung === goc) return _phienBanGoi
  return (await chayLay(dung, ['--version'])).out
}

// ── Ảnh bìa cho danh sách "Đã tải" ───────────────────────────────────────
// Anh Tiến 08/09: *"các video download về có thumbnail giống như lúc đang đọc
// link"*. Lấy từ CHÍNH file đã tải (không lấy URL mạng) để xem được khi mất
// mạng: ffmpeg tách một khung ở giây 1, rộng 192px, ~0,3 s/ảnh.
// Lưu ở %APPDATA%\AiOStudio\vd-thumbs\<id>.jpg.

function thuMucThumb(): string {
  const path = getPath()
  const appData = bienMT('APPDATA')
  return path && appData ? path.join(appData, 'AiOStudio', 'vd-thumbs') : ''
}

/** Đường dẫn ảnh bìa nếu đã có, '' nếu chưa. */
export function duongThumb(id: string): string {
  const fs = getFs()
  const path = getPath()
  const tm = thuMucThumb()
  if (!fs || !path || !tm || !id) return ''
  const f = path.join(tm, id + '.jpg')
  try {
    return fs.existsSync(f) ? f : ''
  } catch {
    return ''
  }
}

/** Tách ảnh bìa từ file video/tiếng. MP3 thì không có hình → trả ''. */
export function taoThumb(id: string, duongDanVideo: string): Promise<string> {
  const cp = getChildProcess()
  const fs = getFs()
  const path = getPath()
  const ff = duongFfmpeg()
  const tm = thuMucThumb()
  return new Promise((resolve) => {
    if (!cp || !fs || !path || !ff || !tm || !id) {
      resolve('')
      return
    }
    const ra = path.join(tm, id + '.jpg')
    try {
      if (fs.existsSync(ra)) {
        resolve(ra)
        return
      }
      if (!fs.existsSync(duongDanVideo)) {
        resolve('')
        return
      }
      if (!fs.existsSync(tm)) fs.mkdirSync(tm, { recursive: true })
    } catch {}
    // -ss trước -i = nhảy nhanh; clip ngắn hơn 1 s thì rơi về khung đầu nhờ
    // lệnh thứ hai. Một luồng, chạy nền — không đụng trần tài nguyên.
    const chay = (ss: string[]) =>
      new Promise<boolean>((r) => {
        const p = cp.spawn(ff, ['-y', '-v', 'error', ...ss, '-i', duongDanVideo, '-frames:v', '1', '-vf', 'scale=192:-2', '-q:v', '4', ra], { windowsHide: true })
        p.on('error', () => r(false))
        p.on('close', (code: number) => r(code === 0 && fs.existsSync(ra)))
      })
    chay(['-ss', '1'])
      .then((ok) => ok || chay([]))
      .then((ok) => resolve(ok ? ra : ''))
  })
}

/** Đường dẫn Windows → URL file:/// để <img> trong CEP nạp được. */
export function fileUrl(p: string): string {
  if (!p) return ''
  return 'file:///' + p.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')
}

// ── Mở thư mục ────────────────────────────────────────────────────────────

export type KetQuaMo = 'chon-file' | 'mo-thu-muc' | 'mat'

/**
 * Mở Explorer: file còn → mở thư mục và TÔ SẴN file; file mất mà thư mục còn →
 * mở thư mục; cả hai mất → không mở gì, trả 'mat' để panel báo.
 *
 * ☠️☠️ ĐO 21/09 — GỐC THẬT của "bấm Mở thư mục không được": bản 0.1.0 gọi
 * explorer.exe với `windowsHide: true` → Explorer TẠO CỬA SỔ ẨN. Máy anh Tiến
 * có 9 cửa sổ Explorer vô hình (9 tiến trình, ~185 MB mỗi cái, tổng 1.666 MB)
 * từ 9 lần bấm 13:11–13:16. Cờ đó chỉ có nghĩa với tiến trình console — KHÔNG
 * BAO GIỜ đặt cho explorer.exe.
 * ☠️ Đoạn PowerShell "kéo cửa sổ lên trước" của 0.1.0 cũng chưa từng chạy:
 * JSON.stringify nhân đôi dấu "\", PowerShell không giải mã lại → so
 * `file:///e://2026//...` với `file:///E:/2026/...` → 0/9 lần khớp. Nên số đo
 * 08/09 "foreground = File Explorer" KHÔNG đến từ đoạn đó.
 *
 * Kéo lên trước: PowerShell nhận đường dẫn qua BIẾN MÔI TRƯỜNG (không nhúng
 * vào chuỗi), chỉ xét cửa sổ ĐANG HIỆN, so bằng đường dẫn hệ thống
 * (Document.Folder.Self.Path), gắn luồng nhập vào cửa sổ đang tiêu điểm
 * (AttachThreadInput) rồi SetForegroundWindow. In kết quả ra stdout.
 */
export function moThuMuc(duongDan: string, laThuMuc = false): Promise<{ kq: KetQuaMo; len: string }> {
  const cp = getChildProcess()
  const fs = getFs()
  const path = getPath()
  if (!cp || !fs || !path || !duongDan) return Promise.resolve({ kq: 'mat', len: '' })
  let conFile = false
  let thuMuc = laThuMuc ? duongDan : path.dirname(duongDan)
  try {
    conFile = !laThuMuc && fs.existsSync(duongDan)
    if (!fs.existsSync(thuMuc)) {
      if (!laThuMuc) return Promise.resolve({ kq: 'mat', len: '' })
      // "Lưu vào" khi thư mục chưa được tạo (chưa tải lần nào): mở thư mục cha
      // gần nhất còn tồn tại, KHÔNG tạo thư mục chỉ vì một cú bấm.
      let t = thuMuc
      while (t && !fs.existsSync(t) && path.dirname(t) !== t) t = path.dirname(t)
      if (!t || !fs.existsSync(t)) return Promise.resolve({ kq: 'mat', len: '' })
      thuMuc = t
    }
  } catch {
    return Promise.resolve({ kq: 'mat', len: '' })
  }
  try {
    if (conFile) cp.spawn('explorer.exe', ['/select,', duongDan])
    else cp.spawn('explorer.exe', [thuMuc])
  } catch {}
  const kq: KetQuaMo = conFile ? 'chon-file' : 'mo-thu-muc'
  return new Promise((resolve) => {
    let out = ''
    try {
      const Buf = nodeRequire()!('buffer').Buffer
      const b64 = Buf.from(PS_KEO_LEN, 'utf16le').toString('base64')
      // ☠️ Không viết process.env: Vite thay nó bằng {} lúc build (bài 5ak).
      const env = Object.assign({}, nodeRequire()!('process')['env'], { AIO_VD_DIR: thuMuc })
      const p = cp.spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', b64], { windowsHide: true, env })
      p.stdout.on('data', (d: any) => (out += d.toString()))
      p.on('error', () => resolve({ kq, len: 'LOI_PS' }))
      p.on('close', () => resolve({ kq, len: out.trim() }))
    } catch {
      resolve({ kq, len: 'LOI_PS' })
    }
  })
}

/** Kịch bản PowerShell kéo cửa sổ Explorer của $env:AIO_VD_DIR lên trước. In: LEN | DA_TRUOC | BI_CHAN | KHONG_THAY. */
const PS_KEO_LEN = `
$ErrorActionPreference='SilentlyContinue'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class VdLen {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, IntPtr p);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool f);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  public static bool Len(IntPtr h) {
    uint me = GetCurrentThreadId();
    uint fg = GetWindowThreadProcessId(GetForegroundWindow(), IntPtr.Zero);
    bool a = fg != 0 && fg != me && AttachThreadInput(me, fg, true);
    if (IsIconic(h)) ShowWindow(h, 9);
    BringWindowToTop(h);
    SetForegroundWindow(h);
    if (a) AttachThreadInput(me, fg, false);
    return GetForegroundWindow() == h;
  }
}
'@
$muon = [IO.Path]::GetFullPath($env:AIO_VD_DIR).TrimEnd('\\').ToLower()
$w = $null
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Milliseconds 100
  $ds = @((New-Object -ComObject Shell.Application).Windows() | Where-Object {
    $p = $null; try { $p = $_.Document.Folder.Self.Path } catch {}
    $p -and $p.TrimEnd('\\').ToLower() -eq $muon -and [VdLen]::IsWindowVisible([IntPtr]$_.HWND)
  })
  if ($ds.Count) { $w = $ds[$ds.Count - 1]; break }
}
if (-not $w) { 'KHONG_THAY'; exit }
$h = [IntPtr]$w.HWND
if ([VdLen]::GetForegroundWindow() -eq $h) { 'DA_TRUOC'; exit }
for ($k = 0; $k -lt 3; $k++) {
  if ([VdLen]::Len($h)) { 'LEN'; exit }
  Start-Sleep -Milliseconds 120
}
'BI_CHAN'
`

// ── Tiện ích ──────────────────────────────────────────────────────────────

export function dinhDangThoiLuong(giay: number): string {
  if (!giay || giay <= 0) return ''
  const h = Math.floor(giay / 3600)
  const m = Math.floor((giay % 3600) / 60)
  const s = Math.floor(giay % 60)
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return (h ? h + ':' : '') + mm + ':' + String(s).padStart(2, '0')
}

export function dinhDangMB(bytes: number, phay = '.'): string {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  const s = mb >= 1000 ? (mb / 1024).toFixed(2) + ' GB' : mb.toFixed(1) + ' MB'
  return s.replace('.', phay)
}
