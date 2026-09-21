/**
 * ffmpeg.ts — gọi FFmpeg đã đóng gói sẵn trong `bin/win64/`, và là CHỖ DUY
 * NHẤT trong panel chạy tiến trình con (FFmpeg lẫn bộ nghe hiểu đều đi qua
 * `execFileAsync` ở đây).
 *
 * Vì sao bundle chứ không bắt người dùng cài: dự án anh em AiO Sub nằm im từ
 * 2026-05-06 đúng vì "máy chưa có ffmpeg/whisper". AiO Editing đã giải xong
 * bằng cách đóng gói kèm — Autocut, Transcripts rồi tới panel này chép lại.
 *
 * Chép từ AiO Transcripts (bản 13/08) ngày 19/09/2026. Khác bản gốc ở ba chỗ:
 *   1. `EXT_ID` = com.aiostudio.shortviral.
 *   2. Có NÚT DỪNG (`CoHuy`): bấm là giết cả cây tiến trình ngay, không đợi nó
 *      chạy xong. Luật 13/08: việc ăn tài nguyên phải luôn có đường dừng.
 *   3. Bỏ `detectSilence` — panel này đọc nội dung, không cắt khoảng lặng.
 *      (`silencelog.ts` vẫn chép nguyên vì cần `parseDuration`/`parseVideoFps`.)
 */

import { dich } from '../ngonngu'
import { extensionPath } from '../lib/cep'
import { nodeRequire, getFs, getPath } from '../lib/node'

const EXT_ID = 'com.aiostudio.shortviral'

/**
 * ☠️☠️ [13/08/2026] ĐỌC BIẾN MÔI TRƯỜNG LÚC CHẠY — ĐỪNG VIẾT CHỮ `process`
 * NỐI THẲNG VỚI `.env` TRONG FILE NÀY.
 * ══════════════════════════════════════════════════════════════════════════
 * Vite THAY chuỗi đó bằng một object RỖNG ngay lúc đóng gói. Đọc bản đã build
 * của Transcripts thấy nguyên hình:
 *
 *     var Ua = {};                                              // Vite sinh ra
 *     const n = typeof process < "u" && Ua ? Ua.APPDATA : null; // -> undefined
 *
 * Hậu quả THẬT (Transcripts): nhánh dò `%APPDATA%` luôn bị bỏ qua, nên kho
 * FFmpeg dùng chung `%APPDATA%\AiOStudio\bin\win64` **CHƯA BAO GIỜ được dò
 * tới**. Panel vẫn chạy — nhưng vì bản cài có `bin/` riêng nên ứng viên đầu
 * danh sách đã thắng, KHÔNG phải vì kho chung hoạt động.
 *
 * ☠️ Vì sao đo mãi không ra: gõ thẳng vào console thì ĐÚNG (console không đi
 * qua Vite), còn mã đã đóng gói thì đọc `{}.APPDATA`. **Đo trên console không
 * chứng minh được mã ĐÃ BUILD chạy đúng** — bài 5ak brain tổng.
 *
 * → Cách đúng: truy cập lúc chạy, và truy cập ĐỘNG bằng `['env']` để bundler
 *   không nhận diện được mẫu cần thay. Sau khi build: grep bản build tìm `={}`
 *   đứng cạnh tên biến môi trường — phải ra 0.
 *
 * (`lib/node.ts` cũng có một `bienMT` cùng cách làm. Giữ bản riêng ở đây để
 * file này không phụ thuộc vào việc file kia còn giữ đúng cách đọc động.)
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
    // Các panel đóng gói ĐÚNG MỘT file ffmpeg.exe (SHA-256 `4CBB08190774`).
    // Gộp về một chỗ: ba bộ cài beta 274,7 MB -> ~92 MB.
    // Đặt ngoài `Adobe\CEP\extensions\` vì thư mục đó bị Premiere quét tìm
    // extension. ĐẶT CUỐI DANH SÁCH để bản cài có `bin/` riêng không hồi quy.
    // Cài bằng: `AiO Studio/design-system/cai-bin-chung.ps1`
    candidates.push(path.join(appData, 'AiOStudio', 'bin', 'win64', 'ffmpeg.exe'))
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

/* ══════════════════════════════════════════════════════════════════════════
   NÚT DỪNG — mới ở panel này (19/09/2026)
   ══════════════════════════════════════════════════════════════════════════

   Đọc một video 1 giờ mất vài phút GPU + CPU. Luật 13/08 của anh Tiến: việc ăn
   tài nguyên phải LUÔN có đường dừng. Transcripts chưa có — bấm là phải đợi.

   Giao diện giữ một `CoHuy`, bấm Dừng thì gọi `huy()`. Mọi tiến trình con đang
   chạy dưới cờ đó bị giết NGAY (taskkill /T /F — giết cả cây, `kill()` chỉ giết
   tiến trình cha; cách này đã chạy thật 08/09 ở panel tải video của bộ).

   Hai kiểu cờ đều nhận:
     - tạo bằng `taoCoHuy()`  → `huy()` báo thẳng cho tiến trình, dừng tức thì.
     - object tự chế `{ daHuy, huy }` → không móc được vào `huy()` của người ta
       nên thăm dò `daHuy` mỗi 200 ms. Chậm hơn tối đa 0,2 giây, không hơn.
*/

/** Cờ dừng. Bên giao diện giữ; bấm Dừng thì gọi `huy()`. */
export interface CoHuy {
  daHuy: boolean
  huy: () => void
}

/** Mã lỗi khi người dùng bấm Dừng — bên gọi so `e.ma === MA_DA_HUY` để im lặng thay vì báo lỗi đỏ. */
export const MA_DA_HUY = 'DA_HUY'

const _ngheHuy = new WeakMap<CoHuy, Set<() => void>>()

/** Tạo cờ dừng mà `huy()` giết tiến trình NGAY, không phải chờ vòng thăm dò. */
export function taoCoHuy(): CoHuy {
  const nghe = new Set<() => void>()
  const co: CoHuy = {
    daHuy: false,
    huy() {
      if (co.daHuy) return
      co.daHuy = true
      for (const fn of Array.from(nghe)) {
        try {
          fn()
        } catch {
          /* một bên nghe hỏng không được chặn bên còn lại */
        }
      }
    },
  }
  _ngheHuy.set(co, nghe)
  return co
}

/** Đăng ký việc phải làm khi bị dừng. Trả hàm gỡ đăng ký (gọi khi tiến trình đã tự xong). */
export function khiHuy(co: CoHuy, fn: () => void): () => void {
  const nghe = _ngheHuy.get(co)
  if (nghe) {
    nghe.add(fn)
    return () => {
      nghe.delete(fn)
    }
  }
  // Cờ tự chế: thăm dò.
  const id = setInterval(() => {
    if (co.daHuy) {
      clearInterval(id)
      fn()
    }
  }, 200)
  return () => clearInterval(id)
}

/** Lỗi "người dùng đã bấm Dừng" — có `ma = 'DA_HUY'`. */
export function loiDaHuy(): Error & { ma: string } {
  const e = new Error(dich('Đã dừng.')) as Error & { ma: string }
  e.ma = MA_DA_HUY
  return e
}

export function laLoiHuy(e: unknown): boolean {
  return !!e && (e as { ma?: unknown }).ma === MA_DA_HUY
}

/**
 * Giết cả cây tiến trình.
 *
 * ☠️ Trên Windows `child.kill()` chỉ giết tiến trình CHA — tiến trình con nó đẻ
 * ra (yt-dlp đẻ ffmpeg — đo 08/09 ở panel tải video của bộ) vẫn chạy tiếp, giữ file và
 * ăn CPU. `taskkill /T /F` giết cả cây.
 * ☠️ `taskkill` không có trên macOS: spawn lỗi là sự kiện `error` BẤT ĐỒNG BỘ
 * (không ném ra chỗ gọi) — không gắn listener thì Node coi là lỗi không ai bắt.
 * Nên: chỉ gọi taskkill trên win32, và vẫn gắn listener lùi về `kill()`.
 */
function gietCay(child: any): void {
  const req = nodeRequire()
  try {
    const os = req ? req('os') : null
    const cp = req ? req('child_process') : null
    if (cp && child?.pid && os?.platform?.() === 'win32') {
      const tk = cp.spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true })
      tk?.on?.('error', () => {
        try {
          child.kill()
        } catch {
          /* hết cách */
        }
      })
      return
    }
  } catch {
    /* rơi xuống kill() */
  }
  try {
    child?.kill?.('SIGKILL')
  } catch {
    /* hết cách */
  }
}

export interface ExecResult {
  stdout: string
  stderr: string
  /** Mã thoát của tiến trình (0 = xong êm). null nếu bị giết bằng tín hiệu / không đọc được. */
  code: number | null
}

/**
 * Trần CPU cho mọi tiến trình con.
 *
 * ☠️ 2026-08-04 — anh Tiến chốt luật CHUNG cho cả bộ: *"RAM, CPU và GPU dùng
 * toàn bộ ở mức tối thiểu 50% và tối đa 70%, cho toàn bộ tool chứ không riêng
 * gì mỗi tool"*. Lấy TRẦN 70%.
 * Nguồn chân lý: `design-system/tai-nguyen.js` (hàm `tranLuong`).
 * Sửa tỉ lệ thì sửa ở đó trước, rồi chạy `design-system/kiem-tai-nguyen.ps1`
 * để soi các panel còn khớp không.
 *
 * Bắt buộc phải ghim khi KHÔNG hạ ưu tiên IDLE: bỏ IDLE là bỏ luôn cái phanh của
 * hệ điều hành, không ghim thì FFmpeg bung hết 32 luồng và máy ì ngay lúc người
 * ta đang chờ. Ghim ở ĐÚNG MỘT CHỖ này — đó là chính sách dùng máy, không phải
 * tham số riêng của từng loại việc.
 */
// Viết đủ "0.70" (không "0.7"): kiem-tai-nguyen.ps1 soi đúng chuỗi này ở mọi panel.
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
   * SAI khi người dùng bấm nút rồi **ngồi đợi** — Premiere lúc đó không làm gì,
   * nhường CPU cho một phần mềm đang rảnh là tự làm mình chậm.
   *
   * `child_process` KHÔNG có option `creationflags` — truyền vào bị bỏ qua âm
   * thầm. Cách đúng là spawn xong rồi `os.setPriority(pid, 19)` (19 = IDLE trên
   * Windows). Bài học AiO Editing đã trả giá ở bản 0.10.0.
   */
  uuTienThap?: boolean
  /**
   * Nghe từng mẩu `stderr` NGAY TRONG LÚC CHẠY, không đợi chạy xong.
   *
   * Vì sao cần: bước nghe hiểu mất vài phút mà nhãn trên panel đứng im suốt —
   * anh Tiến nhìn Task Manager rồi hỏi *"hình như không chạy đó em"*
   * (2026-07-28). Không có tiến độ thì không phân biệt được **đang chạy** với
   * **đã treo**.
   */
  ngheStderr?: (mau: string) => void
  /** Cờ dừng — bấm là giết tiến trình và promise bị từ chối với lỗi `DA_HUY`. */
  huy?: CoHuy
}

/**
 * Tiến trình con không chạy được / chết không để lại stderr → câu cho người dùng.
 *
 * ☠️ Vì sao không `reject(err)` thẳng (soát 19/09): lỗi Node thô đi nguyên lên màn
 * hình qua `thanhLoi` — "spawn C:/AiO-Studio/whisper/bin/Release/whisper-cli.exe
 * ENOENT" (diệt virus chặn / file bị xoá giữa chừng) hoặc "Command failed: <cả dòng
 * lệnh, lộ tên mô hình>" (máy sạch thiếu VC++ runtime: tiến trình chết không in
 * gì). Trái luật "không mã lỗi thô" và luật 30/07 "không để người dùng biết mình
 * dùng gì". Mã thoát + tên file chạy (ASCII) để trong `chiTiet` — chỉ hiện ở
 * tooltip, đủ để lần sau chẩn đoán (ENOENT / EACCES / 3221225781 = thiếu DLL).
 */
function loiKhongChayDuoc(file: string, err: any): Error & { ma: string; chiTiet: string } {
  const e = new Error(dich('Không chạy được bộ xử lý media. Cài lại panel hoặc khởi động lại máy.')) as Error & {
    ma: string
    chiTiet: string
  }
  e.ma = 'KHONG_CHAY_DUOC'
  const ten = String(file || '').split(/[\\/]/).pop() || '?'
  const ma = err && err.code !== undefined && err.code !== null ? String(err.code) : '?'
  const tinHieu = err && err.signal ? ' signal=' + String(err.signal) : ''
  e.chiTiet = `${ten} code=${ma}${tinHieu}`
  return e
}

/** Chạy một file nhị phân bất đồng bộ. Xem `ExecOptions` về ưu tiên, tiến độ, dừng. */
export function execFileAsync(
  file: string,
  args: string[],
  opt: ExecOptions = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    // Bấm Dừng TRƯỚC khi tới lượt bước này thì khỏi đẻ tiến trình.
    if (opt.huy?.daHuy) {
      reject(loiDaHuy())
      return
    }
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

    let daXong = false
    let goHuy: (() => void) | null = null

    const child = cp.execFile(
      file,
      args,
      { maxBuffer: 32 * 1024 * 1024, windowsHide: true },
      (err: any, stdout: string, stderr: string) => {
        daXong = true
        if (goHuy) goHuy()
        // ☠️ HỎI CỜ DỪNG TRƯỚC. Bị giết giữa chừng thì stderr VẪN có chữ (FFmpeg
        // đã in phần đầu log, bộ nghe hiểu đã in log nạp mô hình). Theo luật cũ
        // bên dưới "có stderr là coi như chạy xong" thì một cú bấm Dừng sẽ bị
        // hiểu thành THÀNH CÔNG, rồi bước sau đọc tiếp file WAV dở dang.
        if (opt.huy?.daHuy) {
          reject(loiDaHuy())
          return
        }
        // FFmpeg ghi thông tin ra stderr kể cả khi chạy đúng — luôn trả về cả hai,
        // kèm mã thoát để bên gọi tự phán (đừng suy "thành công" từ stderr).
        if (err && !stderr) reject(loiKhongChayDuoc(file, err))
        else
          resolve({
            stdout: stdout || '',
            stderr: stderr || '',
            code: !err ? 0 : typeof err.code === 'number' ? err.code : null,
          })
      },
    )

    if (opt.huy) {
      goHuy = khiHuy(opt.huy, () => {
        if (!daXong) gietCay(child)
      })
    }

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
