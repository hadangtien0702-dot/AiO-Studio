/**
 * ffmpeg.ts — gọi FFmpeg đã đóng gói sẵn trong `bin/win64/`.
 *
 * Vì sao bundle chứ không bắt người dùng cài: dự án anh em AiO Sub nằm im từ
 * 2026-05-06 đúng vì "máy chưa có ffmpeg/whisper". AiO Editing đã giải xong
 * bằng cách đóng gói kèm — Autocut chép lại y cách đó.
 */

import { dich } from '../ngonngu'
import { extensionPath } from '../lib/cep'
import { getFs, getPath, nodeRequire } from '../lib/node'
import { parseSilenceLog, parseDuration, parseVideoFps, type Silence } from './silencelog'

export type { Silence }

const EXT_ID = 'com.aiostudio.transcript'

/**
 * ☠️☠️ [13/08/2026] ĐỌC BIẾN MÔI TRƯỜNG LÚC CHẠY — ĐỪNG VIẾT CHỮ `process`
 * NỐI THẲNG VỚI `.env` TRONG FILE NÀY.
 * ══════════════════════════════════════════════════════════════════════════
 * Vite THAY chuỗi đó bằng một object RỖNG ngay lúc đóng gói. Đọc bản đã build
 * thấy nguyên hình:
 *
 *     var Ua = {};                                              // Vite sinh ra
 *     const n = typeof process < "u" && Ua ? Ua.APPDATA : null; // -> undefined
 *
 * Hậu quả THẬT ở chính file này: nhánh dò `%APPDATA%` luôn bị bỏ qua, nên kho
 * FFmpeg dùng chung `%APPDATA%\AiOStudio\bin\win64` **CHƯA BAO GIỜ được dò
 * tới**. Panel vẫn chạy — nhưng vì bản cài có `bin/` riêng nên ứng viên đầu
 * danh sách đã thắng, KHÔNG phải vì kho chung hoạt động.
 *
 * ☠️ Vì sao đo mãi không ra: gõ thẳng vào console thì ĐÚNG (console không đi
 * qua Vite), còn mã đã đóng gói thì đọc `{}.APPDATA`. **Đo trên console không
 * chứng minh được mã ĐÃ BUILD chạy đúng** — cùng họ bài học 5ah.
 *
 * → Cách đúng: truy cập lúc chạy, và truy cập ĐỘNG bằng `['env']` để bundler
 *   không nhận diện được mẫu cần thay.
 */
function bienMT(ten: string): string | null {
  // 1. `process` của Node do CEP gắn sẵn vào `window.cep_node`.
  try {
    const w = window as any
    const p = w?.cep_node?.process
    const e = p && p['env']
    if (e && e[ten]) return String(e[ten])
  } catch {
    /* bỏ qua — còn đường thứ hai */
  }

  // 2. Nạp thẳng module 'process' qua require của Node.
  try {
    const req = nodeRequire()
    const pr = req ? req('process') : null
    const e = pr && pr['env']
    if (e && e[ten]) return String(e[ten])
  } catch {
    /* bỏ qua — không có Node thì trả null, phía gọi tự bỏ ứng viên đó */
  }

  return null
}

let cachedFFmpeg: string | null = null

/** Đường dẫn tuyệt đối tới ffmpeg.exe ('' nếu không tìm thấy). */
export function getFFmpegPath(): string {
  if (cachedFFmpeg) return cachedFFmpeg

  const fs = getFs()
  const path = getPath()
  if (!fs || !path) return ''

  const candidates: string[] = []
  const extDir = extensionPath()
  if (extDir) candidates.push(path.join(extDir, 'bin', 'win64', 'ffmpeg.exe'))

  // Lúc chạy dev (npm run dev) thì extensionPath() rỗng — dò thêm quanh cwd.
  if (typeof process !== 'undefined' && process.cwd) {
    const cwd = process.cwd()
    candidates.push(path.join(cwd, 'bin', 'win64', 'ffmpeg.exe'))
    candidates.push(path.join(cwd, '..', 'bin', 'win64', 'ffmpeg.exe'))
  }
  // ☠️ Lấy %APPDATA% bằng bienMT() — xem ghi chú đầu file, KHÔNG đọc thẳng.
  const appData = bienMT('APPDATA')
  if (appData) {
    candidates.push(
      path.join(appData, 'Adobe', 'CEP', 'extensions', EXT_ID, 'bin', 'win64', 'ffmpeg.exe'),
    )

    // ☠️ [13/08/2026] KHO FFmpeg DÙNG CHUNG cho cả bộ AiO Studio.
    // Bốn panel đóng gói ĐÚNG MỘT file ffmpeg.exe (SHA-256 `4CBB08190774`).
    // Gộp về một chỗ: ba bộ cài beta 274,7 MB -> ~92 MB.
    // Đặt ngoài `Adobe\CEP\extensions\` vì thư mục đó bị Premiere quét tìm
    // extension. ĐẶT CUỐI DANH SÁCH để bản cũ có `bin/` riêng không hồi quy.
    // Cài bằng: `AiO Studio/design-system/cai-bin-chung.ps1`
    candidates.push(
      path.join(appData, 'AiOStudio', 'bin', 'win64', 'ffmpeg.exe'),
    )
  }

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        cachedFFmpeg = c
        return c
      }
    } catch {
      /* bỏ qua */
    }
  }
  return ''
}

export interface ExecResult {
  stdout: string
  stderr: string
}

/**
 * Chạy một file nhị phân bất đồng bộ, ở ƯU TIÊN THẤP NHẤT.
 *
 * `child_process` KHÔNG có option `creationflags` — truyền vào bị bỏ qua âm
 * thầm và tiến trình vẫn tranh CPU ngang hàng Premiere. Cách đúng là spawn xong
 * rồi hạ ưu tiên thật bằng `os.setPriority(pid, 19)` (19 = IDLE trên Windows).
 * Bài học này AiO Editing đã trả giá ở bản 0.10.0.
 */
/**
 * Trần CPU cho mọi tiến trình con.
 *
 * ☠️ 2026-08-04 — anh Tiến chốt luật CHUNG cho cả 7 panel: *"RAM, CPU và GPU
 * dùng toàn bộ ở mức tối thiểu 50% và tối đa 70%, cho toàn bộ tool chứ không
 * riêng gì mỗi tool"*. Trước đó chỗ này để 60%; nay lấy TRẦN 70%.
 * Nguồn chân lý: `design-system/tai-nguyen.js` (hàm `tranLuong`).
 * Sửa tỉ lệ thì sửa ở đó trước, rồi chạy `design-system/kiem-tai-nguyen.ps1`
 * để soi 7 panel còn khớp không.
 *
 * Bắt buộc phải ghim khi KHÔNG hạ ưu tiên IDLE: bỏ IDLE là bỏ luôn cái phanh của
 * hệ điều hành, không ghim thì FFmpeg bung hết 32 luồng và máy ì ngay lúc người
 * ta đang chờ. Ghim ở ĐÚNG MỘT CHỖ này — đó là chính sách dùng máy, không phải
 * tham số riêng của từng loại việc.
 */
const TRAN_TAI_NGUYEN = 0.70 // design-system/tai-nguyen.js — TRAN

export function soLuongCpu(): number {
  const req = nodeRequire()
  try {
    const n = req ? req('os').cpus().length : 8
    return Math.max(2, Math.floor(n * TRAN_TAI_NGUYEN))
  } catch {
    return 8
  }
}

export interface ExecOptions {
  /**
   * Hạ xuống ưu tiên thấp nhất để nhường CPU cho Premiere.
   *
   * Đúng cho việc chạy NỀN (AiO Editing render hàng đợi trong lúc người ta dựng).
   * SAI cho Autocut: người dùng bấm nút rồi **ngồi đợi**, Premiere lúc đó không
   * làm gì — nhường CPU cho một phần mềm đang rảnh là tự làm mình chậm.
   */
  uuTienThap?: boolean
  /**
   * Nghe từng mẩu `stderr` NGAY TRONG LÚC CHẠY, không đợi chạy xong.
   *
   * Vì sao cần: bước nghe hiểu mất 3 phút (turbo) tới 8 phút (large-v3) mà nhãn
   * trên panel đứng im suốt — anh Tiến nhìn Task Manager rồi hỏi *"hình như không
   * chạy đó em"* (2026-07-28). Nút đứng yên không có tiến độ thì người dùng không
   * phân biệt được **đang chạy** với **đã treo**.
   */
  ngheStderr?: (mau: string) => void
}

export function execFileAsync(
  file: string,
  args: string[],
  opt: ExecOptions = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const req = nodeRequire()
    if (!req) {
      reject(new Error(dich('Không dùng được Node.js trong panel')))
      return
    }
    const cp = req('child_process')
    if (!cp || !cp.execFile) {
      reject(new Error(dich('Không dùng được child_process.execFile')))
      return
    }

    const child = cp.execFile(
      file,
      args,
      { maxBuffer: 32 * 1024 * 1024, windowsHide: true },
      (err: any, stdout: string, stderr: string) => {
        // FFmpeg ghi thông tin ra stderr kể cả khi chạy đúng — luôn trả về cả hai.
        if (err && !stderr) reject(err)
        else resolve({ stdout: stdout || '', stderr: stderr || '' })
      },
    )

    if (opt.uuTienThap) {
      try {
        const os = req('os')
        if (child?.pid && os?.setPriority) os.setPriority(child.pid, 19)
      } catch {
        /* thất bại thì thôi — job vẫn chạy, chỉ là không được nhường CPU */
      }
    }

    // Nghe stderr sống. `execFile` vẫn gom đủ stderr cho callback ở trên — thêm
    // listener này KHÔNG cướp mất dữ liệu, chỉ là nghe ké.
    if (opt.ngheStderr) {
      try {
        child?.stderr?.on('data', (d: any) => {
          try {
            opt.ngheStderr!(String(d))
          } catch {
            /* bên nghe hỏng thì kệ, đừng để nó làm chết cả tiến trình */
          }
        })
      } catch {
        /* không gắn được thì mất tiến độ chứ không mất kết quả */
      }
    }
  })
}

export interface DetectOptions {
  /** Ngưỡng coi là im lặng, tính bằng dB (âm). Mặc định -30. */
  noiseDb: number
  /** Khoảng lặng ngắn hơn số giây này thì FFmpeg bỏ qua. Mặc định 0.5. */
  minSilence: number
}

/**
 * Dò khoảng lặng bằng bộ lọc `silencedetect` của FFmpeg.
 *
 * Đây là phép ĐO biên độ, không phải AI đoán — cùng một file cho cùng kết quả.
 *
 * Truyền vào **file WAV đã trích** (không phải video gốc) khi có thể: WAV là
 * PCM thô nên khỏi giải mã lại, và tránh mở file gốc lần thứ hai — video 3 tiếng
 * giải mã lại một lần là mất cả phút.
 */
export async function detectSilence(
  mediaPath: string,
  opt: DetectOptions,
): Promise<{ silences: Silence[]; duration: number; fps: number }> {
  const exe = getFFmpegPath()
  if (!exe) throw new Error(dich('Thiếu thành phần xử lý media của panel — cài lại bản mới nhất'))

  const { stderr } = await execFileAsync(
    exe,
    [
      '-hide_banner',
      '-nostats',
      '-threads',
      String(soLuongCpu()),
      '-i',
      mediaPath,
      '-vn',
      '-af',
      `silencedetect=noise=${opt.noiseDb}dB:d=${opt.minSilence}`,
      '-f',
      'null',
      '-',
    ],
    { uuTienThap: false }, // người dùng đang đợi, đừng nhường CPU cho Premiere đang rảnh
  )

  if (/Output file .*does not contain any stream|Invalid data found|No such file/i.test(stderr)) {
    throw new Error(
      dich('Không đọc được file này:\n') + stderr.split(/\r?\n/).slice(-6).join('\n'),
    )
  }

  const duration = parseDuration(stderr)
  return {
    silences: parseSilenceLog(stderr, duration > 0 ? duration : undefined),
    duration,
    fps: parseVideoFps(stderr),
  }
}

