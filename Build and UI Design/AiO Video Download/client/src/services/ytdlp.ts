/**
 * ytdlp.ts — LÕI của panel: gọi `yt-dlp.exe` đóng gói trong `bin/win64/`.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * VÌ SAO LÀ yt-dlp (đo 08/09/2026, xem PROGRESS.md)
 * ══════════════════════════════════════════════════════════════════════════
 * - Giấy phép Unlicense (public domain) → bán được, không phải mở mã nguồn.
 * - Hỗ trợ ~1.800 trang. Đo thật 08/09: YouTube dài (635s, 53 định dạng) +
 *   YouTube Shorts + Facebook công khai tải được. Vimeo đòi đăng nhập
 *   (dùng cookie trình duyệt). TikTok trả 403 — CHƯA giải.
 * - Tải 720p 82 MB mất 13 giây trên máy công ty.
 *
 * ☠️ YOUTUBE CẦN MỘT RUNTIME JAVASCRIPT NGOÀI — kể từ 2025 YouTube giấu link
 * sau một đoạn JS phải chạy thật. yt-dlp mặc định tìm `deno` (không có trên
 * máy khách). Đo 08/09: `quickjs` (qjs.exe, **2,1 MB**) cho ra ĐÚNG 53 định
 * dạng như Node. Nên bộ cài kèm `bin/win64/qjs.exe` và LUÔN truyền
 * `--js-runtimes quickjs:<đường dẫn>`. Thiếu nó thì YouTube mất định dạng
 * mà không báo lỗi rõ ràng (chỉ WARNING).
 *
 * ☠️ `--print` NGẦM BẬT `--simulate` — phải kèm `--no-simulate`, không thì
 * yt-dlp in ra mà không tải gì cả (đọc kỹ tài liệu trước khi tin "nó chạy").
 *
 * ☠️ FFmpeg: chỉ dùng để GHÉP hình + tiếng (copy stream, không encode) và để
 * tách MP3. Không đụng luật tài nguyên 50–70% vì việc này ăn đĩa/mạng, không
 * ăn CPU — trừ MP3 (encode, một luồng, vài giây).
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
  phanTram: number
  tocDo: string
  conLai: string
  daTai: number
  tongCong: number
}

export type GiaiDoan = 'lay-thong-tin' | 'dang-tai' | 'dang-xu-ly' | 'thu-lai'

/**
 * ☠️ TIKTOK CHẶN NGẪU NHIÊN — đo 08/09/2026 trên link anh Tiến dán:
 * cùng một lệnh `-J`, 6 lần chạy liên tiếp → 5 qua / 1 bị `HTTP Error 403`;
 * `--impersonate chrome` (curl_cffi có sẵn trong exe) KHÔNG đỡ: 4/6.
 * → Không phải lỗi tham số, là anti-bot xác suất. Cách đúng: THỬ LẠI.
 * 3 lần thì xác suất còn lỗi ≈ (1/6)^3 ≈ 0,5%. Chỉ thử lại với lỗi kiểu
 * "bị chặn" / "mất mạng" — lỗi "cần đăng nhập" hay "không hỗ trợ" thử lại
 * bao nhiêu cũng vậy.
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
  ma: 'khong-phai-link' | 'khong-ho-tro' | 'khong-xem-duoc' | 'can-dang-nhap' | 'bi-chan' | 'mat-mang' | 'thieu-engine' | 'huy' | 'khac'
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

export function duongYtDlp(): string {
  return timBinary('yt-dlp.exe')
}
export function duongQjs(): string {
  return timBinary('qjs.exe')
}
export function duongFfmpeg(): string {
  return timBinary('ffmpeg.exe')
}

/** Ba thứ phải có để chạy; thiếu cái nào thì trả tên cái đó. */
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
  // ☠️ `--encoding utf-8` BẮT BUỘC. Đo 08/09 (anh Tiến dán link tiêu đề tiếng
  // Việt + emoji): không có nó, `--print after_move:%(filepath)s` in ra
  // "Nhng bc nh c chp v�o" — MẤT DẤU — trong khi file trên đĩa tên đúng
  // "Những bức ảnh được chụp vào…". Panel tìm file theo tên sai → báo
  // KHONG_THAY_FILE dù đã tải xong. PYTHONIOENCODING/PYTHONUTF8 KHÔNG đỡ
  // (exe PyInstaller tự chọn codepage); chỉ cờ này của chính yt-dlp mới ăn.
  const args = ['--encoding', 'utf-8', '--no-playlist', '--no-warnings', '--no-colors', '--windows-filenames', '--no-mtime']
  const qjs = duongQjs()
  if (qjs) args.push('--js-runtimes', 'quickjs:' + qjs)
  const ff = duongFfmpeg()
  if (ff && path) args.push('--ffmpeg-location', path.dirname(ff))
  if (cookies) args.push('--cookies-from-browser', cookies)
  return args
}

// ── Đọc thông tin ─────────────────────────────────────────────────────────

export function laLink(s: string): boolean {
  return /^https?:\/\/\S+$/i.test(s.trim())
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
        if (daHuy || !nenThuLai(loiCuoi)) throw loiCuoi
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
    if (!cp || !exe) {
      reject(<LoiTai>{ ma: 'thieu-engine', chiTiet: 'yt-dlp.exe' })
      return
    }
    const args = [...thamSoChung(cookies), '-J', url.trim()]
    let out = ''
    let err = ''
    proc = cp.spawn(exe, args, { windowsHide: true })
    proc.stdout.on('data', (d: any) => (out += d.toString()))
    proc.stderr.on('data', (d: any) => (err += d.toString()))
    proc.on('error', (e: any) => reject(<LoiTai>{ ma: 'thieu-engine', chiTiet: String(e) }))
    proc.on('close', (code: number) => {
      if (code !== 0 || !out.trim()) {
        reject(dichLoi(err))
        return
      }
      try {
        const d = JSON.parse(out)
        const caos = new Set<number>()
        for (const f of d.formats || []) {
          if (f.vcodec && f.vcodec !== 'none' && f.height) caos.add(Number(f.height))
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
  return { huy: () => proc && giet(proc), xong }
}

// ── Tải ───────────────────────────────────────────────────────────────────

/**
 * Chuỗi chọn định dạng.
 *
 * ☠️ ƯU TIÊN H.264 (`avc1`) TRƯỚC — Premiere KHÔNG đọc VP9/webm, AV1 chỉ bản
 * mới. YouTube từ 1440p trở lên hầu như chỉ có VP9/AV1, nên "tốt nhất" vẫn
 * thử avc1 trước rồi mới rơi xuống codec khác; panel báo codec ra để người
 * dùng biết vì sao Premiere không nhập được (không đoán thay họ).
 */
function chuoiDinhDang(cl: ChatLuong): string[] {
  if (cl === 'mp3') return ['-f', 'ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '0']
  const h = cl === 'tot-nhat' ? '' : `[height<=${cl}]`
  const f =
    `bv*[vcodec^=avc1]${h}+ba[ext=m4a]/` +
    `bv*[ext=mp4]${h}+ba[ext=m4a]/` +
    `bv*${h}+ba/` +
    `b${h}/b`
  return ['-f', f, '--merge-output-format', 'mp4']
}

const DAU_TIEN_DO = 'AIOTD|'
const DAU_XONG = 'AIOXONG|'

export interface TienTrinhTai {
  huy: () => void
  xong: Promise<KetQuaTai>
}

/**
 * Tải một link. `onTienDo` gọi theo từng dòng tiến độ của yt-dlp (~2 lần/giây),
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
  const xong = (async () => {
    let loiCuoi: LoiTai = { ma: 'khac', chiTiet: '' }
    for (let lan = 1; lan <= SO_LAN_THU; lan++) {
      if (daHuy) throw <LoiTai>{ ma: 'huy', chiTiet: '' }
      const p = taiVideoMotLan(url, tc, onTienDo, onGiaiDoan)
      hienTai = p
      try {
        return await p.xong
      } catch (e) {
        loiCuoi = e as LoiTai
        if (daHuy || loiCuoi.ma === 'huy' || !nenThuLai(loiCuoi) || lan === SO_LAN_THU) throw loiCuoi
        onGiaiDoan('thu-lai', lan + 1)
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

function taiVideoMotLan(
  url: string,
  tc: TuyChon,
  onTienDo: (t: TienDo) => void,
  onGiaiDoan: (g: GiaiDoan) => void,
): TienTrinhTai {
  const cp = getChildProcess()
  const path = getPath()
  const exe = duongYtDlp()
  let proc: any = null
  let daHuy = false

  const xong = new Promise<KetQuaTai>((resolve, reject) => {
    if (!cp || !exe || !path) {
      reject(<LoiTai>{ ma: 'thieu-engine', chiTiet: 'yt-dlp.exe' })
      return
    }
    const args = [
      ...thamSoChung(tc.cookies),
      ...chuoiDinhDang(tc.chatLuong),
      '-N', '4',
      '--newline', '--progress', '--no-simulate',
      '--progress-template',
      // `a,b` = lấy a, không có thì lấy b (cú pháp yt-dlp). total_bytes chỉ có khi
      // máy chủ báo Content-Length; không thì dùng ước lượng.
      `download:${DAU_TIEN_DO}%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress.downloaded_bytes)s|%(progress.total_bytes,progress.total_bytes_estimate)s`,
      '--print',
      `after_move:${DAU_XONG}%(filepath)s|%(vcodec)s|%(acodec)s|%(width)s|%(height)s|%(duration)s`,
      '-P', tc.thuMuc,
      '-o', '%(title).80s [%(id)s].%(ext)s',
      url.trim(),
    ]
    let err = ''
    let ketQua: KetQuaTai | null = null
    let giaiDoan: GiaiDoan = 'lay-thong-tin'
    let duoi = ''
    onGiaiDoan(giaiDoan)

    const doiGiaiDoan = (g: GiaiDoan) => {
      if (g !== giaiDoan) {
        giaiDoan = g
        onGiaiDoan(g)
      }
    }

    const xuLyDong = (dong: string) => {
      const s = dong.trim()
      if (!s) return
      if (s.indexOf(DAU_TIEN_DO) >= 0) {
        const p = s.slice(s.indexOf(DAU_TIEN_DO) + DAU_TIEN_DO.length).split('|')
        doiGiaiDoan('dang-tai')
        // yt-dlp in "NA"/"Unknown" khi chưa ước lượng được — coi như trống.
        const sach = (s: string) => (/^(NA|Unknown|N\/A)$/i.test((s || '').trim()) ? '' : (s || '').trim())
        onTienDo({
          phanTram: parseFloat(p[0]) || 0,
          tocDo: sach(p[1]),
          conLai: sach(p[2]),
          daTai: parseInt(p[3], 10) || 0,
          tongCong: parseInt(p[4], 10) || 0,
        })
        return
      }
      if (s.indexOf(DAU_XONG) >= 0) {
        const p = s.slice(s.indexOf(DAU_XONG) + DAU_XONG.length).split('|')
        ketQua = {
          duongDan: p[0],
          vcodec: p[1] || '',
          acodec: p[2] || '',
          rong: parseInt(p[3], 10) || 0,
          cao: parseInt(p[4], 10) || 0,
          thoiLuong: parseFloat(p[5]) || 0,
        }
        return
      }
      // Dòng "[Merger]", "[ExtractAudio]", "[VideoRemuxer]"… = đang xử lý sau tải.
      if (/^\[(Merger|ExtractAudio|VideoRemuxer|VideoConvertor|Metadata|MoveFiles)\]/.test(s)) {
        doiGiaiDoan('dang-xu-ly')
      }
    }

    proc = cp.spawn(exe, args, { windowsHide: true })
    // StringDecoder: một ký tự UTF-8 nhiều byte có thể bị cắt giữa hai gói
    // `data` — toString() từng gói sẽ ra ký tự lỗi ở chỗ nối.
    const SD = nodeRequire()!('string_decoder').StringDecoder
    const giaiMa = new SD('utf8')
    proc.stdout.on('data', (d: any) => {
      duoi += giaiMa.write(d)
      const dongs = duoi.split(/\r?\n/)
      duoi = dongs.pop() || ''
      dongs.forEach(xuLyDong)
    })
    proc.stderr.on('data', (d: any) => (err += d.toString()))
    proc.on('error', (e: any) => reject(<LoiTai>{ ma: 'thieu-engine', chiTiet: String(e) }))
    proc.on('close', (code: number) => {
      if (duoi) xuLyDong(duoi)
      if (daHuy) {
        // Dừng giữa chừng để lại `.part` / `.ytdl` / `.f398.mp4` dở dang trong
        // thư mục người dùng — dọn đúng file mang [id] của link này, không đụng
        // file khác (bài 5am-ter: dọn theo mẫu rộng là xoá đồ người ta).
        donFileDo(tc.thuMuc, tc.id || '')
        reject(<LoiTai>{ ma: 'huy', chiTiet: '' })
        return
      }
      if (code === 0 && ketQua) {
        resolve(ketQua)
        return
      }
      reject(code === 0 ? <LoiTai>{ ma: 'khac', chiTiet: 'yt-dlp không báo đường dẫn file' } : dichLoi(err))
    })
  })

  return {
    huy: () => {
      daHuy = true
      if (proc) giet(proc)
    },
    xong,
  }
}

/** Xoá file dở dang của đúng video `id` sau khi Dừng. Trả số file đã xoá. */
export function donFileDo(thuMuc: string, id: string): number {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path || !thuMuc || !id) return 0
  let n = 0
  try {
    for (const ten of fs.readdirSync(thuMuc) as string[]) {
      if (ten.indexOf('[' + id + ']') < 0) continue
      if (!/\.(part|ytdl|part-Frag\d+)$|\.f\d+\.\w+$/i.test(ten)) continue
      try {
        fs.unlinkSync(path.join(thuMuc, ten))
        n++
      } catch {}
    }
  } catch {}
  return n
}

/** Giết cả cây tiến trình (yt-dlp sinh ffmpeg con) — `proc.kill()` chỉ giết cha. */
function giet(proc: any) {
  const cp = getChildProcess()
  try {
    if (cp && proc.pid) cp.spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true })
    else proc.kill()
  } catch {}
}

// ── Dịch lỗi ──────────────────────────────────────────────────────────────

/**
 * Đổi stderr của yt-dlp thành mã lỗi panel hiểu được. Danh sách mẫu lấy từ
 * các lỗi ĐÃ GẶP THẬT 08/09 (Vimeo "only works when logged-in", TikTok
 * "HTTP Error 403") + mấy câu chuẩn của yt-dlp. Không khớp thì trả nguyên
 * dòng ERROR đầu tiên — thà hiện câu lạ còn hơn giấu.
 */
export function dichLoi(stderr: string): LoiTai {
  const dongLoi = (stderr.split(/\r?\n/).find((l) => l.startsWith('ERROR:')) || stderr.trim().split(/\r?\n/).pop() || '').replace(/^ERROR:\s*/, '')
  const s = dongLoi.toLowerCase()
  if (!s) return { ma: 'khac', chiTiet: '' }
  if (s.includes('is not a valid url') || s.includes('unsupported url')) {
    return { ma: s.includes('unsupported') ? 'khong-ho-tro' : 'khong-phai-link', chiTiet: dongLoi }
  }
  if (s.includes('sign in') || s.includes('logged-in') || s.includes('login') || s.includes('cookies') || s.includes('private video')) {
    return { ma: 'can-dang-nhap', chiTiet: dongLoi }
  }
  if (s.includes('403') || s.includes('429') || s.includes('blocked') || s.includes('captcha')) {
    return { ma: 'bi-chan', chiTiet: dongLoi }
  }
  if (s.includes('unavailable') || s.includes('removed') || s.includes('not exist') || s.includes('404')) {
    return { ma: 'khong-xem-duoc', chiTiet: dongLoi }
  }
  if (s.includes('getaddrinfo') || s.includes('urlopen error') || s.includes('timed out') || s.includes('connection')) {
    return { ma: 'mat-mang', chiTiet: dongLoi }
  }
  return { ma: 'khac', chiTiet: dongLoi }
}

// ── Cập nhật engine ───────────────────────────────────────────────────────

/**
 * `yt-dlp -U` — tự thay file exe của chính nó. YouTube đổi cách giấu link vài
 * tuần một lần; bản cũ quá là tải hỏng. Đây là đường cứu khi người dùng gặp
 * lỗi lạ, không cần đợi bản cài mới của cả bộ.
 */
export function capNhatEngine(): Promise<{ ok: boolean; thongBao: string }> {
  const cp = getChildProcess()
  const exe = duongYtDlp()
  return new Promise((resolve) => {
    if (!cp || !exe) {
      resolve({ ok: false, thongBao: 'yt-dlp.exe' })
      return
    }
    let out = ''
    const p = cp.spawn(exe, ['-U'], { windowsHide: true })
    p.stdout.on('data', (d: any) => (out += d.toString()))
    p.stderr.on('data', (d: any) => (out += d.toString()))
    p.on('error', (e: any) => resolve({ ok: false, thongBao: String(e) }))
    p.on('close', (code: number) => resolve({ ok: code === 0, thongBao: out.trim().split(/\r?\n/).pop() || '' }))
  })
}

export function phienBanEngine(): Promise<string> {
  const cp = getChildProcess()
  const exe = duongYtDlp()
  return new Promise((resolve) => {
    if (!cp || !exe) {
      resolve('')
      return
    }
    let out = ''
    const p = cp.spawn(exe, ['--version'], { windowsHide: true })
    p.stdout.on('data', (d: any) => (out += d.toString()))
    p.on('error', () => resolve(''))
    p.on('close', () => resolve(out.trim()))
  })
}

// ── Ảnh bìa cho danh sách "Đã tải" ───────────────────────────────────────
// Anh Tiến 08/09: *"khi các video download về có thumbnail giống như lúc đang
// đọc link"*. Lấy từ CHÍNH file đã tải (không lấy URL mạng) để xem được khi
// mất mạng và không phụ thuộc trang gốc: ffmpeg tách một khung ở giây 1,
// rộng 192px, ~0,3 s/ảnh. Lưu ở %APPDATA%\AiOStudio\vd-thumbs\<id>.jpg.

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

// ── Tiện ích ──────────────────────────────────────────────────────────────

/**
 * Mở Explorer tại file (tô sẵn) hoặc tại thư mục.
 *
 * ☠️ Đo 08/09 (anh Tiến bấm 8 lần "không thấy gì"): `explorer /select,` MỞ
 * ĐƯỢC — 8 cửa sổ đúng thư mục — nhưng đều nằm SAU LƯNG Premiere vì tiến
 * trình con không được quyền kéo cửa sổ lên trước. Nên sau khi mở phải tự
 * tìm cửa sổ Explorer đúng thư mục và SetForegroundWindow nó.
 * ☠️ Truyền `/select,"path"` thành MỘT tham số (windowsVerbatimArguments) thì
 * Explorer mở nhầm Desktop — giữ dạng hai tham số ['/select,', path].
 */
export function moThuMuc(duongDan: string, laThuMuc = false) {
  const cp = getChildProcess()
  const path = getPath()
  if (!cp || !path) return
  const thuMuc = laThuMuc ? duongDan : path.dirname(duongDan)
  try {
    if (laThuMuc) cp.spawn('explorer.exe', [duongDan], { windowsHide: true })
    else cp.spawn('explorer.exe', ['/select,', duongDan], { windowsHide: true })
  } catch {}
  // Kéo cửa sổ vừa mở lên trước Premiere. Chạy PowerShell riêng, không chặn panel.
  const ps = `
$ErrorActionPreference='SilentlyContinue'
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class FgVd{[DllImport("user32.dll")]public static extern bool SetForegroundWindow(IntPtr h);[DllImport("user32.dll")]public static extern bool ShowWindow(IntPtr h,int n);[DllImport("user32.dll")]public static extern void keybd_event(byte k,byte s,uint f,UIntPtr e);[DllImport("user32.dll")]public static extern bool BringWindowToTop(IntPtr h);}'
$muon=[uri]::new(${JSON.stringify(thuMuc)}).AbsoluteUri.TrimEnd('/').ToLower()
for($i=0;$i -lt 20;$i++){
  Start-Sleep -Milliseconds 150
  $ws=(New-Object -ComObject Shell.Application).Windows()
  $w=@($ws | Where-Object { $_.LocationURL -and $_.LocationURL.TrimEnd('/').ToLower() -eq $muon }) | Select-Object -Last 1
  if($w){
    $h=[IntPtr]$w.HWND
    # Windows chi cho tien trinh DANG co tieu diem doi foreground. Nhan Alt ao
    # (keybd_event 0x12) la meo da biet de duoc cap quyen do — do 08/09: khong co
    # thi SetForegroundWindow tra ve false khi Chrome dang o truoc.
    [FgVd]::keybd_event(0x12,0,0,[UIntPtr]::Zero); [FgVd]::keybd_event(0x12,0,2,[UIntPtr]::Zero)
    [FgVd]::ShowWindow($h,9) | Out-Null; [FgVd]::BringWindowToTop($h) | Out-Null; [FgVd]::SetForegroundWindow($h) | Out-Null
    break
  }
}`
  try {
    // Buffer lấy qua require — `Buffer` trần không chắc có trong renderer CEP.
    const Buf = nodeRequire()!('buffer').Buffer
    const b64 = Buf.from(ps, 'utf16le').toString('base64')
    cp.spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', b64], { windowsHide: true, detached: true, stdio: 'ignore' }).unref()
  } catch {}
}

export function dinhDangThoiLuong(giay: number): string {
  if (!giay || giay <= 0) return ''
  const h = Math.floor(giay / 3600)
  const m = Math.floor((giay % 3600) / 60)
  const s = Math.floor(giay % 60)
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return (h ? h + ':' : '') + mm + ':' + String(s).padStart(2, '0')
}

export function dinhDangMB(bytes: number): string {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1000 ? (mb / 1024).toFixed(2) + ' GB' : mb.toFixed(1) + ' MB'
}
