import { extensionPath } from '../lib/cep'
import { getFs, getPath, nodeRequire } from '../lib/node'

let cachedFFmpegPath: string | null = null
let cachedFFprobePath: string | null = null

/**
 * Tìm đường dẫn tuyệt đối tới ffmpeg.exe
 */
export function getFFmpegPath(): string {
  if (cachedFFmpegPath) return cachedFFmpegPath

  const fs = getFs()
  const path = getPath()
  if (!fs || !path) return ''

  const extDir = extensionPath()
  const candidates: string[] = []

  if (extDir) {
    candidates.push(path.join(extDir, 'bin', 'win64', 'ffmpeg.exe'))
  }

  // dev root & cwd candidates
  if (typeof process !== 'undefined' && process.cwd) {
    const cwd = process.cwd()
    candidates.push(path.join(cwd, 'bin', 'win64', 'ffmpeg.exe'))
    candidates.push(path.join(cwd, '..', 'bin', 'win64', 'ffmpeg.exe'))
  }

  // APPDATA candidate
  if (typeof process !== 'undefined' && process.env && process.env.APPDATA) {
    candidates.push(
      path.join(
        process.env.APPDATA,
        'Adobe',
        'CEP',
        'extensions',
        'com.aiostudio.assetmanager',
        'bin',
        'win64',
        'ffmpeg.exe'
      )
    )

    // ☠️ [13/08/2026] KHO FFmpeg DÙNG CHUNG cho cả bộ AiO Studio.
    // Bốn panel đóng gói ĐÚNG MỘT file ffmpeg.exe (SHA-256 `4CBB08190774`,
    // 109,5 MB). Ba bộ cài beta 274,7 MB, 99,7% là FFmpeg lặp lại -> ~92 MB.
    // Đặt ngoài `Adobe\CEP\extensions\` vì thư mục đó bị Premiere quét tìm
    // extension. ĐẶT CUỐI DANH SÁCH để bản cũ có `bin/` riêng không hồi quy.
    // Cài bằng: `AiO Studio/design-system/cai-bin-chung.ps1`
    candidates.push(
      path.join(process.env.APPDATA, 'AiOStudio', 'bin', 'win64', 'ffmpeg.exe')
    )
  }

  for (const cand of candidates) {
    try {
      if (fs.existsSync(cand)) {
        cachedFFmpegPath = cand
        return cand
      }
    } catch {}
  }

  return ''
}

/**
 * Tìm đường dẫn tuyệt đối tới ffprobe.exe
 */
export function getFFprobePath(): string {
  if (cachedFFprobePath) return cachedFFprobePath

  const fs = getFs()
  const path = getPath()
  if (!fs || !path) return ''

  const extDir = extensionPath()
  const candidates: string[] = []

  if (extDir) {
    candidates.push(path.join(extDir, 'bin', 'win64', 'ffprobe.exe'))
  }

  if (typeof process !== 'undefined' && process.cwd) {
    const cwd = process.cwd()
    candidates.push(path.join(cwd, 'bin', 'win64', 'ffprobe.exe'))
    candidates.push(path.join(cwd, '..', 'bin', 'win64', 'ffprobe.exe'))
  }

  if (typeof process !== 'undefined' && process.env && process.env.APPDATA) {
    candidates.push(
      path.join(
        process.env.APPDATA,
        'Adobe',
        'CEP',
        'extensions',
        'com.aiostudio.assetmanager',
        'bin',
        'win64',
        'ffprobe.exe'
      )
    )

    // ☠️ [13/08/2026] Kho DÙNG CHUNG — xem giải thích ở getFFmpegPath().
    // ⚠️ Panel NÀY thật sự dùng ffprobe (probe.ts đọc metadata dạng JSON), khác
    // Autocut — Autocut không gọi bao giờ nên đã bỏ ffprobe khỏi gói của nó.
    // Kho chung vì vậy PHẢI có đủ cả ffmpeg.exe lẫn ffprobe.exe.
    candidates.push(
      path.join(process.env.APPDATA, 'AiOStudio', 'bin', 'win64', 'ffprobe.exe')
    )
  }

  for (const cand of candidates) {
    try {
      if (fs.existsSync(cand)) {
        cachedFFprobePath = cand
        return cand
      }
    } catch {}
  }

  return ''
}

export interface ExecResult {
  stdout: string
  stderr: string
}

/**
 * [1.2.0-dev.3] Turbo: tạm thôi hạ ưu tiên tiến trình FFmpeg.
 *
 * Mặc định `false` — mọi đường chạy cũ giữ nguyên IDLE priority như trước.
 * Chỉ `jobQueue` bật lên khi người dùng chủ động bấm "Render hết một lần", và
 * TẮT LẠI ngay khi hàng đợi kết thúc (kể cả khi lỗi hay bị dừng giữa chừng).
 *
 * [1.3.1] `threadsPerJob` — TRẦN CPU cho mỗi tiến trình FFmpeg.
 *
 * Vì sao đến giờ mới cần: ở chế độ nền, `os.setPriority(pid, 19)` lo hết —
 * FFmpeg dùng bao nhiêu nhân cũng được, Premiere cần là hệ điều hành cắt ngay.
 * Nhưng TURBO cố tình bỏ IDLE để chạy ngang hàng Premiere, nên mất luôn cái
 * phanh đó. Từ đây phải chặn bằng `-threads`.
 *
 * Công thức chủ dự án chốt 28/07: *"render ít dùng ít, render nhiều dùng tối
 * đa"*, trần CPU khoảng 50%. Cách đạt: `jobQueue` co giãn SỐ WORKER theo khối
 * lượng việc, còn mỗi tiến trình bị ghim ở `-threads 2`:
 *      2 worker × 2 luồng =  4 / 32 luồng ≈ 12%   (vài trăm file lặt vặt)
 *      8 worker × 2 luồng = 16 / 32 luồng ≈ 50%   (chạy hết thư viện)
 */
let turboPriority = false
let turboThreads = 0
export function setFFmpegTurbo(on: boolean, threadsPerJob = 0): void {
  turboPriority = on === true
  turboThreads = on === true ? Math.max(0, Math.floor(threadsPerJob)) : 0
}

/**
 * Thực thi file binary (ffmpeg/ffprobe) bất đồng bộ, ở ƯU TIÊN THẤP NHẤT.
 *
 * [0.10.0] SỬA LỖI: bản cũ truyền `{ creationflags: 0x40 }` với niềm tin
 * "IDLE_PRIORITY_CLASS, không tranh CPU với Premiere" — nhưng Node
 * child_process KHÔNG có option tên đó, nó bị bỏ qua ÂM THẦM, và FFmpeg
 * thực tế chạy ở ưu tiên NORMAL ngang hàng Premiere suốt từ trước tới nay.
 *
 * Cách đúng (API chính thức của Node): spawn xong hạ ưu tiên tiến trình bằng
 * os.setPriority(pid, 19) — 19 = thấp nhất, Windows map sang IDLE_PRIORITY_CLASS.
 * Hệ quả hay: KHÔNG cần giới hạn -threads nữa — FFmpeg cứ dùng hết nhân RẢNH
 * (máy 32 luồng thì tận dụng được), còn Premiere/panel cần CPU là được nhường
 * ngay lập tức do ưu tiên cao hơn.
 */
export function execFileAsync(
  file: string,
  args: string[],
  options: Record<string, any> = {}
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const req = nodeRequire()
    if (!req) {
      reject(new Error('Node.js not available'))
      return
    }
    const cp = req('child_process')
    if (!cp || !cp.execFile) {
      reject(new Error('child_process.execFile not available'))
      return
    }

    /**
     * [1.3.1] Ghim trần CPU cho FFmpeg ở chế độ turbo.
     *
     * Chèn Ở ĐÂY, một chỗ duy nhất, thay vì rải `-threads` vào thumbnailer /
     * waveform / proxy — ba nơi đó rồi sẽ lệch nhau, mà đây là chính sách dùng
     * máy chứ không phải tham số riêng của từng loại job.
     *
     * `-threads` là tuỳ chọn toàn cục nên phải đứng TRƯỚC `-i`. Chỉ áp cho
     * ffmpeg; ffprobe chỉ đọc metadata, không đáng chặn.
     */
    const finalArgs =
      turboThreads > 0 && /ffmpeg\.exe$/i.test(file)
        ? ['-threads', String(turboThreads), ...args]
        : args

    const child = cp.execFile(
      file,
      finalArgs,
      { maxBuffer: 10 * 1024 * 1024, windowsHide: true, ...options },
      (err: any, stdout: string, stderr: string) => {
        if (err) {
          reject(err)
        } else {
          resolve({ stdout, stderr })
        }
      }
    )

    // Hạ ưu tiên NGAY sau khi spawn. Thất bại (tiến trình vừa thoát xong,
    // thiếu quyền...) thì thôi — job vẫn chạy, chỉ là không được "nhường".
    //
    // [1.2.0-dev.3] Trừ khi đang ở turbo: lúc đó để NORMAL cho ngang hàng
    // Premiere, vì người dùng đang đợi hàng đợi xong chứ không dựng phim.
    try {
      const os = req('os')
      if (!turboPriority && child?.pid && os?.setPriority) {
        os.setPriority(child.pid, 19) // 19 = PRIORITY_IDLE
      }
    } catch {
      /* bỏ qua */
    }
  })
}
