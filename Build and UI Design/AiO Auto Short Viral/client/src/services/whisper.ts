/**
 * whisper.ts — nhận dạng tiếng nói bằng whisper.cpp chạy trên GPU.
 *
 * Chép từ AiO Transcripts (bản 13/08) ngày 19/09/2026. Mọi chỗ khác bản gốc
 * được ghi `[Short Viral]` ngay tại chỗ, kèm lý do.
 *
 * Vì sao whisper.cpp chứ không phải faster-whisper/Python: **không cần Python**.
 * Dự án anh em AiO Sub nằm im từ 2026-05-06 đúng vì bắt người dùng tự cài
 * Python/whisper — không lặp lại vết đó.
 *
 * Đo thật trên máy anh Tiến (RTX 4060 Ti 16GB) ngày 2026-07-28:
 * mô hình large-v3 xử lý 60 giây tiếng trong 11,7 giây — nhanh gấp 5 lần thời
 * gian thực. Turbo trên tiếng Anh 30/07: video 55 phút nghe hiểu mất 77,2 giây.
 *
 * Bộ máy để ở `C:/AiO-Studio/whisper/` (hằng `NOI_DE` bên dưới) chứ không nhét
 * vào extension: nhét vào thì gói cài phình thêm vài GB và mỗi lần cài phải chép
 * lại từng ấy. Và KHÔNG để trong `%APPDATA%` — Premiere Beta ảo hoá AppData,
 * thư mục tạo sau khi Premiere khởi động thì Node của panel không thấy (đo
 * 28/07, xem ghi chú ở `NOI_DE`).
 * [Short Viral] Bản Transcripts ghi dòng này là `%APPDATA%\AiO Studio\whisper\`
 * — SAI với chính hằng `NOI_DE` của nó. Đã sửa ở đây; Transcripts vẫn còn sai.
 */

import { dich } from '../ngonngu'
import { getFs, getPath, nodeRequire } from '../lib/node'
import { execFileAsync, getFFmpegPath, soLuongCpu, type CoHuy } from './ffmpeg'
import { parseDuration, parseVideoFps } from './silencelog'
import type { Cau, KetQuaNghe, NguonNghe, TuTinCay } from './kieu'

export type { Cau, KetQuaNghe, TuTinCay }

/**
 * Hai mô hình nghe hiểu, đo thật trên máy anh Tiến 2026-07-28 (RTX 4060 Ti 16GB):
 *
 * | | large-v3 | turbo |
 * |---|---|---|
 * | 245 giây tiếng | 34,5s | **10,5s** |
 * | GPU đỉnh | 88% | **67%** |
 * | Video 3 tiếng | ~33 phút | **~7,7 phút** |
 * | File trên đĩa (đo 19/09) | 3.095.033.483 byte | **1.624.555.275 byte** |
 *
 * Chất lượng tiếng Việt **gần như ngang nhau** — cả hai cùng nghe nhầm nhóm
 * thuật ngữ tài chính, chỉ khác cách nhầm. Nên mặc định lấy TURBO: nhanh gấp
 * 3,3 lần và là bản duy nhất giữ GPU dưới trần 70% anh Tiến đặt. large-v3
 * (`v3`) **cấm làm mặc định** (AiO Studio/CLAUDE.md mục 4c).
 *
 * Kiểm chéo 28/07 (video 58 phút): hai mô hình cho số nhát cắt gần y hệt
 * (409/408, 920/920) — mô hình đổi cách CHIA CÂU (turbo 762 câu, v3 874 câu
 * trên cùng file khi có `-mc 0`), không đổi được nghe ra lời hay không.
 * ⚠️ Với panel này điều đó quan trọng: ranh giới khối hỏi–đáp bám theo câu/từ,
 * nên cùng một video nghe bằng hai mô hình có thể ra khối lệch nhau vài từ.
 * CHƯA ĐO trên phỏng vấn host–khách.
 */
export const MO_HINH = [
  {
    ma: 'turbo',
    // ☠️ BẢN THƯƠNG MẠI: `ten`/`mo` lên giao diện (qua dich()). Không nêu thông
    // số nội bộ (tốc độ gấp mấy lần, mức GPU, tên mô hình) — anh Tiến 30/07:
    // *"không để người dùng biết mình dùng gì và làm gì"*.
    ten: 'Nhanh',
    mo: 'Nghe nhanh · câu ngắn',
    file: 'ggml-large-v3-turbo.bin',
  },
  {
    ma: 'v3',
    ten: 'Nghe kỹ',
    mo: 'Nghe kỹ hơn · chậm hơn',
    file: 'ggml-large-v3.bin',
  },
] as const

export type MaMoHinh = (typeof MO_HINH)[number]['ma']

export function laMaMoHinh(x: unknown): x is MaMoHinh {
  return MO_HINH.some((m) => m.ma === x)
}

export interface BoMayWhisper {
  exe: string
  model: string
  /**
   * [Short Viral] Mã mô hình THẬT của file `model` — không phải mã đã xin.
   *
   * ☠️ Transcripts + Autocut: `timBoMay('v3')` mà máy chỉ có turbo thì nó lùi
   * sang turbo (đúng), nhưng bên gọi vẫn `luuDem(path, 'v3', …)` — đệm ghi nhãn
   * v3 cho kết quả của turbo. Lần sau xin v3 thì nhận đệm đó như thật. Nên mã
   * đi kèm bộ máy, bên gọi ghi đúng cái này.
   */
  ma: MaMoHinh
}

/**
 * Nơi để bộ máy Whisper.
 *
 * ☠️ **KHÔNG được để trong `%APPDATA%`.** Đo thật 2026-07-28: Premiere Beta chạy
 * với AppData bị ảo hoá, và **cả Node của CEP lẫn ExtendScript đều không thấy**
 * thư mục tạo trong AppData sau khi Premiere đã khởi động — `fs.existsSync` trả
 * false, `fs.readdirSync` báo ENOENT, dù Windows thấy file rành rành.
 * (Thư mục có sẵn từ trước thì vẫn thấy, nên bẫy này rất dễ tưởng là mình sai code.)
 *
 * Thư mục ngoài AppData thì bình thường — kể cả mới tạo, kể cả có dấu cách.
 * Autocut + Transcripts dùng ĐÚNG chỗ này → cài một lần, ba panel cùng dùng.
 */
const NOI_DE = ['C:/AiO-Studio/whisper']

/** Thư mục gốc của bộ máy Whisper ('' nếu không tìm thấy chỗ nào). */
function thuMucWhisper(): string {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path) return ''
  for (const d of NOI_DE) {
    try {
      if (fs.existsSync(d)) return d
    } catch {
      /* thử chỗ tiếp theo */
    }
  }
  return NOI_DE[0] // trả về chỗ mặc định để thông báo lỗi chỉ đúng đường dẫn
}

/**
 * Tìm whisper-cli.exe và mô hình. Trả về null nếu chưa cài.
 *
 * Cố ý KHÔNG tự tải về ở đây: vài GB là thứ phải hỏi trước, không phải thứ tự
 * ý ngốn băng thông của người ta.
 */
export function timBoMay(ma: MaMoHinh = 'turbo'): BoMayWhisper | null {
  const fs = getFs()
  const path = getPath()
  const goc = thuMucWhisper()
  if (!fs || !path || !goc) return null

  const exe = path.join(goc, 'bin', 'Release', 'whisper-cli.exe')
  try {
    if (!fs.existsSync(exe)) return null
    // Mô hình được xin trước, rồi mới tới cái còn lại — thiếu đúng cái được
    // chọn thì lùi sang cái kia, còn hơn không chạy. Mã trả về là mã của file
    // THẬT tìm thấy (xem `BoMayWhisper.ma`).
    const thuTu = [...MO_HINH].sort((a, b) => (a.ma === ma ? -1 : b.ma === ma ? 1 : 0))
    for (const m of thuTu) {
      const p = path.join(goc, 'models', m.file)
      if (fs.existsSync(p)) return { exe, model: p, ma: m.ma }
    }
  } catch {
    /* bỏ qua */
  }
  return null
}

/**
 * Mô tả thứ còn thiếu, để báo cho người dùng bằng tiếng người. '' = đủ.
 *
 * [Short Viral] Transcripts kiểm cứng file `ggml-large-v3.bin` (3 GB) — máy chỉ
 * có turbo (đúng bản mặc định) vẫn bị báo "thiếu dữ liệu 3 GB" dù chạy được.
 * Ở đây: chỉ báo thiếu khi KHÔNG có mô hình nào dùng được (khớp đúng điều kiện
 * `timBoMay` trả null), và nói cỡ của bản MẶC ĐỊNH turbo (~1,5 GB).
 */
export function thieuGi(): string {
  const fs = getFs()
  const path = getPath()
  const goc = thuMucWhisper()
  if (!fs || !path) return dich('Panel không dùng được Node.js.')
  if (!goc) return dich('Không xác định được thư mục cài đặt của bộ nghe hiểu.')
  const exe = path.join(goc, 'bin', 'Release', 'whisper-cli.exe')
  const thieu: string[] = []
  try {
    // ☠️ BẢN THƯƠNG MẠI: không nêu tên công cụ nền. Anh Tiến 30/07:
    // *"bản thương mại không để người dùng biết mình dùng gì và làm gì"*.
    // Khách biết panel bọc một công cụ mã nguồn mở là tự chạy được, khỏi mua.
    if (!fs.existsSync(exe)) thieu.push(dich('bộ nghe hiểu'))
    const coMoHinh = MO_HINH.some((m) => fs.existsSync(path.join(goc, 'models', m.file)))
    // Cỡ của bản MẶC ĐỊNH turbo: 1.624.555.275 byte (đo 19/09 trên máy anh).
    if (!coMoHinh) thieu.push(dich('dữ liệu nghe hiểu (khoảng 1,5 GB)'))
  } catch {
    return dich('Không đọc được thư mục ') + goc
  }
  if (!thieu.length) return ''
  // Khoá chứa cả câu có chỗ trống `{x}`; chữ nối `' và '` cũng phải dịch, không
  // thì ra câu nửa Anh nửa Việt ("the speech recognition engine và the model").
  // `.replace` nhận HÀM: chuỗi thay thế chứa `$&`/`$'` sẽ không bị hiểu là ký hiệu.
  return dich('Chưa có {x} trong:\n').replace('{x}', () => thieu.join(dich(' và '))) + goc
}

/** Kết quả trích tiếng. `coTieng = false` khi file KHÔNG có luồng tiếng nào (ảnh, video câm). */
export interface KetTrich {
  wav: string
  fps: number
  duration: number
  coTieng: boolean
}

/**
 * Trích tiếng của một file media ra WAV 16 kHz mono — định dạng whisper.cpp cần.
 * File tạm nằm ở thư mục temp của hệ điều hành (Node đọc được, không cần
 * ExtendScript nên không dính chuyện AppData bị ảo hoá).
 *
 * ☠️ Bộ nghe hiểu phải nghe bản GỐC (chỉ đổi mẫu về 16 kHz mono), KHÔNG lọc dải
 * tần. Đo 28/07: nghe bản lọc 300–3400 Hz + nâng tiếng thì KÉM rõ — 2.033 →
 * 1.576 câu, tin cậy TB 0,853 → 0,804. [Short Viral] Bỏ `locDaiGiongNoi` vì
 * panel này không đo năng lượng để cắt.
 *
 * @param tuyChon.bao (giây đã trích, tổng giây của file — -1 khi chưa đọc được)
 * @param tuyChon.huy cờ dừng — dừng giữa chừng thì tự xoá WAV dở rồi ném `DA_HUY`
 */
export async function trichTieng(
  mediaPath: string,
  tuyChon: { bao?: (giayDaXong: number, tongGiay: number) => void; huy?: CoHuy } = {},
): Promise<KetTrich> {
  const req = nodeRequire()
  const path = getPath()
  if (!req || !path) throw new Error(dich('Panel không dùng được Node.js'))
  const os = req('os')
  const ffmpeg = getFFmpegPath()
  if (!ffmpeg) throw new Error(dich('Thiếu thành phần xử lý media của panel — cài lại bản mới nhất.'))

  // Thêm số ngẫu nhiên: hai panel (hoặc hai lượt) bắt đầu cùng một mili-giây
  // không được giẫm lên file của nhau.
  const ra = path.join(
    os.tmpdir(),
    `aio-shortviral-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.wav`,
  )
  const bao = tuyChon.bao
  let tongGiay = -1
  // Phần đầu log gom lại để tìm dòng `Duration:` — một dòng có thể bị cắt đôi
  // giữa hai mẩu stderr, dò từng mẩu riêng thì hụt đúng lúc đó.
  let dauLog = ''
  let stderr = ''
  let code: number | null = 0
  try {
    // Tiện thể lấy luôn fps + thời lượng từ log của chính lệnh này, khỏi phải mở
    // file gốc thêm lần nữa. Video 3 tiếng giải mã lại một lần là mất cả phút.
    // ⚠️ KHÔNG dùng `-nostats` khi cần tiến độ: chính `-nostats` chặn dòng
    // `time=00:12:34.56` mà FFmpeg in ra liên tục. Bước này mất 45 giây trên file
    // 9,3 GB — không có tiến độ thì người dùng tưởng treo (anh Tiến 2026-07-28).
    const kq = await execFileAsync(
      ffmpeg,
      [
        '-hide_banner', ...(bao ? [] : ['-nostats']), '-threads', String(soLuongCpu()),
        '-y', '-i', mediaPath, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', ra,
      ],
      {
        uuTienThap: false, // người dùng đang đợi — đừng nhường CPU cho Premiere đang rảnh
        huy: tuyChon.huy,
        ngheStderr: bao
          ? (mau) => {
              // [Short Viral] Đọc luôn TỔNG thời lượng từ dòng `Duration:` (in
              // trước mọi dòng time=) để bên gọi đổi ra % thật.
              if (tongGiay < 0 && dauLog.length < 65536) {
                dauLog += mau
                // Chỉ tin khi đã thấy dấu phẩy đứng sau: mẩu bị cắt ở
                // "Duration: 00:54:5" sẽ bị đọc thành 54 phút 5 giây và ghim sai luôn.
                if (/Duration:\s*\d+:\d+:[\d.]+,/.test(dauLog)) {
                  const d = parseDuration(dauLog)
                  if (d > 0) tongGiay = d
                }
              }
              let m: RegExpExecArray | null = null
              let cuoi: RegExpExecArray | null = null
              const re = /time=(\d+):(\d+):(\d+)/g
              while ((m = re.exec(mau)) !== null) cuoi = m
              if (cuoi) {
                bao(
                  parseInt(cuoi[1], 10) * 3600 + parseInt(cuoi[2], 10) * 60 + parseInt(cuoi[3], 10),
                  tongGiay,
                )
              }
            }
          : undefined,
      },
    )
    stderr = kq.stderr
    code = kq.code
  } catch (e) {
    // Dừng / lỗi giữa chừng: WAV dở nằm trong temp — dọn luôn tại đây vì bên
    // gọi chưa nhận được đường dẫn nên không dọn hộ được.
    donWav(ra)
    throw e
  }

  // [Short Viral] Transcripts coi "có stderr" là chạy xong rồi đi nghe tiếp một
  // file WAV không tồn tại → lỗi khó hiểu ở bước sau. Ở đây soi thẳng file ra.
  //
  // File KHÔNG có luồng tiếng (ảnh tĩnh, video câm): FFmpeg báo "Output file
  // does not contain any stream" và KHÔNG tạo file — đo 19/09 trên video câm
  // 3 giây tự tạo bằng chính ffmpeg.exe của bộ. Đó không phải lỗi: trả
  // coTieng = false, bên gọi coi như "không nghe ra lời nào".
  const fs = getFs()
  let coDuLieu = false
  try {
    // 44 byte = đúng phần đầu của một file WAV rỗng.
    coDuLieu = !!fs && fs.existsSync(ra) && fs.statSync(ra).size > 44
  } catch {
    coDuLieu = false
  }
  if (!coDuLieu) {
    donWav(ra)
    if (/does not contain any stream|matches no streams/i.test(stderr)) {
      return { wav: '', fps: parseVideoFps(stderr), duration: parseDuration(stderr), coTieng: false }
    }
    const e = new Error(
      dich('Không đọc được tiếng của file này:\n') + String(mediaPath).split(/[\\/]/).pop(),
    ) as Error & { chiTiet?: string }
    // Log thô để gỡ lỗi — KHÔNG đưa lên màn hình (lộ tên công cụ nền).
    e.chiTiet = `code=${code}\n` + stderr.split(/\r?\n/).slice(-8).join('\n')
    throw e
  }
  return { wav: ra, fps: parseVideoFps(stderr), duration: parseDuration(stderr), coTieng: true }
}

/**
 * Tên file tạm do CHÍNH panel này đặt: `aio-shortviral-<Date.now 13 số>-<ngẫu nhiên>.wav`
 * (trichTieng) và `.json` cùng gốc (whisper-cli `-of`). Khớp NGUYÊN tên, không phải
 * khớp "có chứa" — xem `donTamCu`.
 */
const TEN_TAM = /^aio-shortviral-\d{13}-[a-z0-9]{1,8}\.(wav|json)$/

/**
 * Dọn file tạm CŨ của panel này trong thư mục temp — gọi lúc panel khởi động.
 *
 * Vì sao cần (soát 19/09): đóng / nạp lại panel GIỮA lúc đang nghe thì không còn
 * promise nào sống để chạy nhánh `finally` gọi `donWav` → WAV (~115 MB/giờ video)
 * và JSON nằm lại temp mãi.
 * ☠️ Xoá theo MẪU là thứ brain bài 5am-ter cấm — ở đây chấp nhận được vì ba chốt:
 * (1) mẫu khớp NGUYÊN tên với tiền tố riêng chỉ panel này sinh ra, (2) chỉ file
 * (không thư mục), (3) cũ hơn `tuoiMs` (mặc định 6 giờ — lượt nghe dài nhất đã đo:
 * 9 giờ 50 phút video ≈ 13 phút nghe), nên không đụng file của lượt đang chạy ở
 * một cửa sổ Premiere khác. Trả số file đã xoá.
 */
export function donTamCu(tuoiMs = 6 * 3600 * 1000): number {
  const req = nodeRequire()
  const fs = getFs()
  const path = getPath()
  if (!req || !fs || !path) return 0
  let n = 0
  try {
    const dir = req('os').tmpdir()
    for (const ten of fs.readdirSync(dir) as string[]) {
      if (!TEN_TAM.test(ten)) continue
      const p = path.join(dir, ten)
      try {
        const st = fs.statSync(p)
        if (!st.isFile() || Date.now() - st.mtimeMs < tuoiMs) continue
        fs.unlinkSync(p)
        n++
      } catch {
        /* file đang bị giữ / vừa bị xoá — bỏ qua */
      }
    }
  } catch {
    /* không đọc được temp thì thôi — không hại gì */
  }
  return n
}

/** Xoá file WAV tạm. */
export function donWav(wavPath: string): void {
  if (!wavPath) return
  const fs = getFs()
  try {
    if (fs && fs.existsSync(wavPath)) fs.unlinkSync(wavPath)
  } catch {
    /* dọn không được thì thôi */
  }
}

/**
 * Chạy Whisper trên file WAV.
 *
 * Xuất JSON đầy đủ (`-ojf`) chứ không phải .srt, vì JSON có thêm **điểm tin cậy
 * từng token** — thứ dùng để chỉ ra chỗ máy đoán mò.
 *
 * Đo thật 2026-07-28 trên clip anh Tiến: 5 chỗ nghe sai đều xếp hạng 1, 2, 3, 5, 8
 * trong 330 từ kém tin cậy nhất; cùng những chữ đó ở chỗ nghe ĐÚNG thì điểm
 * 0,997–1,000. Nói cách khác **máy tự biết chỗ nào nó không chắc**.
 *
 * @param tuyChon.bao % đã nghe (0..100). **-1 = còn đang nạp mô hình lên GPU**
 *   (30–60 giây với bản 3 GB) — bên gọi đừng để thanh đứng ở 0% lúc đó.
 * @param tuyChon.huy cờ dừng — giết bộ nghe hiểu, dọn JSON dở, ném `DA_HUY`.
 *   WAV KHÔNG dọn ở đây: bên gọi tạo ra thì bên gọi dọn.
 */
export async function nghe(
  wavPath: string,
  boMay: BoMayWhisper,
  tuyChon: { bao?: (phanTram: number) => void; huy?: CoHuy } = {},
): Promise<KetQuaNghe> {
  const req = nodeRequire()
  const fs = getFs()
  const path = getPath()
  if (!req || !fs || !path) throw new Error(dich('Panel không dùng được Node.js'))
  const bao = tuyChon.bao

  // whisper-cli tự thêm đuôi .json vào tên đưa cho `-of`.
  //
  // ⚠️ KHÔNG dùng `-p` (processors > 1). Đo thật: `-p 2` nhanh hơn 27% nhưng
  // **chẻ câu làm nhiều mảnh** — 15 câu thành 24 câu vụn. Panel này chia khối
  // hỏi–đáp theo câu/từ: câu bị chẻ thì câu hỏi bị cắt đôi.
  // ══════════════════════════════════════════════════════════════════════════
  // ☠️ `-mc 0` — THUỐC CHỮA WHISPER BỊA. ĐỪNG BỎ.
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Whisper mang **ngữ cảnh chữ** từ đoạn 30 giây này sang đoạn sau. Một khi nó
  // trượt thì nó lấy chính chữ nó vừa bịa làm ngữ cảnh, nên **trượt luôn tới hết
  // file**. Đo thật 2026-07-29 trên video 58 phút của anh Tiến:
  //
  //      | | câu | nằm trong chuỗi LẶP | chuỗi dài nhất |
  //      | turbo mặc định | 2.033 | **1.238 (60,9%) — 25:45** | **806 lần** cùng một câu |
  //      | turbo `-mc 0`  |   762 | **28 (3,7%) — 62 giây**   | 15 lần |
  //
  //   806 lần "Chú có quỷ đen không chú." kéo suốt 14 phút cuối video.
  //
  // Bằng chứng nguyên nhân: **cắt riêng 3 phút chỗ hỏng ra chạy lại thì nghe
  // ĐÚNG hoàn toàn** — âm thanh không có lỗi, lỗi nằm ở ngữ cảnh tự tha.
  // Tiếng Anh (30/07, 3 video 2 giờ 20): `-mc 0` cho 0% lặp — không hại.
  //
  // ⚠️ Giá phải trả: thỉnh thoảng nó đoán mò từ dữ liệu huấn luyện — đo được
  // **20 câu** kiểu "Hãy subscribe cho kênh…". Não chia khối gắn cờ `bia` cho
  // mấy câu đó; KHÔNG sửa bằng cách bỏ `-mc 0`.
  //
  // `-pp` (print-progress) in ra `whisper_print_progress_callback: progress = N%`.
  // Đo thật 2026-07-28: nó **vẫn in kể cả khi giữ `-np`**, nên thêm được mà không
  // phải bỏ `-np` (bỏ `-np` là hứng thêm cả nghìn dòng phụ đề vào bộ đệm).
  const goc = wavPath.replace(/\.wav$/i, '')
  const jsonPath = goc + '.json'
  let cuoi = -1 // % lớn nhất đã báo; -1 = chưa có % nào (còn đang nạp mô hình)
  try {
    await execFileAsync(
      boMay.exe,
      // ☠️ `-l auto` — anh Tiến chốt 30/07: để Whisper tự nhận thay vì bày thanh
      // chọn. Whisper trả mã ngôn ngữ nó nhận ra trong `result.language` → ghi
      // vào `ngonNgu`, lưu theo đệm.
      //
      // ⚠️ PHẢI NÓI RÕ GIỚI HẠN: `-mc 0` và mọi ngưỡng đo trên giọng Việt đang
      // dùng chung cho mọi thứ tiếng. Mỗi ngôn ngữ cần MỘT FILE THẬT để đo lại.
      // Chưa đo thì chưa được hứa.
      ['-m', boMay.model, '-f', wavPath, '-l', 'auto', '-t', String(soLuongCpu()),
       '-mc', '0', '-np', '-pp', '-ojf', '-of', goc],
      {
        uuTienThap: false, // người dùng đang ngồi đợi — đừng nhường CPU cho ai
        huy: tuyChon.huy,
        ngheStderr: bao
          ? (mau) => {
              // Một mẩu có thể chứa nhiều dòng, hoặc nửa dòng — lấy số CUỐI CÙNG.
              let m: RegExpExecArray | null = null
              let cuoiCung: RegExpExecArray | null = null
              const re = /progress\s*=\s*(\d+)%/g
              while ((m = re.exec(mau)) !== null) cuoiCung = m
              if (cuoiCung) {
                const p = parseInt(cuoiCung[1], 10)
                if (p > cuoi) {
                  cuoi = p
                  bao(p)
                }
                return
              }
              // Chưa có % nào: whisper còn đang NẠP MÔ HÌNH lên GPU — mất 30-60
              // giây với bản 3,1 GB. Không báo gì thì nhãn đứng im đúng lúc đó.
              if (cuoi < 0 && /ggml_|whisper_init|loading model|CUDA/i.test(mau)) {
                cuoi = 0
                bao(-1) // -1 = đang nạp mô hình, chưa nghe
              }
            }
          : undefined,
      },
    )
  } catch (e) {
    // Dừng / sập giữa chừng: JSON dở (nếu có) nằm trong temp — dọn luôn.
    try {
      if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath)
    } catch {
      /* dọn không được thì thôi */
    }
    throw e
  }

  let noiDung = ''
  try {
    noiDung = fs.readFileSync(jsonPath, 'utf8')
  } catch {
    // Không lộ đường dẫn temp / tên công cụ lên màn hình — câu người đọc được.
    throw new Error(dich('Bộ nghe hiểu chạy xong nhưng không có kết quả. Thử lại, hoặc khởi động lại máy nếu vẫn lỗi.'))
  }
  try {
    fs.unlinkSync(jsonPath)
  } catch {
    /* dọn không được thì thôi — WAV do bên gọi dọn */
  }
  return docJson(noiDung)
}

/* ══════════════════════════════════════════════════════════════════════════
   BỘ ĐỆM KẾT QUẢ NGHE — `<tên>.autocut-nghe.json` CẠNH VIDEO, DÙNG CHUNG CẢ BỘ
   ══════════════════════════════════════════════════════════════════════════

   Autocut ghi (v1), Transcripts ghi (v2), panel này ghi (v2). Nghe 1 giờ tốn vài
   phút GPU, đọc lại đệm tốn 0,4–2,4 giây (đo ở Transcripts). Khách mua cả bộ
   → chạy panel nào trước thì panel sau được hưởng.

   ☠️ ĐỊNH DẠNG GHI PHẢI Y HỆT TRANSCRIPTS (cùng tên trường, cùng PHIEN_BAN_DEM,
   cùng cách lấy vân tay) — để Transcripts đọc được đệm panel này ghi và ngược
   lại. Đổi một trường ở đây = Transcripts coi đệm là rác và nghe lại, im lặng.
   Đo 19/09: 11 file đệm trên ổ E: (6 v2 + 5 v1) đều có đúng 6/7 trường
   phienBan · moHinh · co · sua · [ngonNgu, chỉ v2] · cau · tu.

   ⚠️ Khoá theo KÍCH THƯỚC + GIỜ SỬA của video. File đổi mà vẫn xài đệm cũ là
   ra nội dung của video khác — hỏng âm thầm, kiểu lỗi tệ nhất.
*/

/**
 * ☠️ Phiên bản 2 (từ 30/07, Transcripts 2.3.0): chép bằng `-l auto` và có trường
 * `ngonNgu`. Phiên bản 1 = Autocut, luôn `-l vi`, không có `ngonNgu`.
 * KHÔNG được tăng/giảm số này ở riêng panel này — phải đổi cùng Transcripts.
 */
const PHIEN_BAN_DEM = 2

function duongDanDem(mediaPath: string): string | null {
  const path = getPath()
  if (!path) return null
  const thuMuc = path.dirname(mediaPath)
  const ten = path.basename(mediaPath).replace(/\.[^.]+$/, '')
  return path.join(thuMuc, `${ten}.autocut-nghe.json`)
}

export interface VanTay {
  co: number
  sua: number
}

/**
 * Vân tay của file gốc — đổi một trong hai là đệm hết hiệu lực.
 * `sua` = mtimeMs LÀM TRÒN — y hệt Transcripts/Autocut (lệch cách làm tròn là
 * đệm của panel kia không bao giờ khớp).
 */
export function vanTay(mediaPath: string): VanTay | null {
  try {
    const fs = getFs()
    if (!fs) return null
    const st = fs.statSync(mediaPath)
    return { co: st.size, sua: Math.round(st.mtimeMs) }
  } catch {
    return null
  }
}

/**
 * Ghi kết quả nghe cạnh video. Hỏng thì im lặng bỏ qua — đệm không phải thứ sống còn.
 *
 * @param maMoHinh mã mô hình THẬT đã nghe (`BoMayWhisper.ma`), không phải mã đã xin.
 * @param vanTayTruoc [Short Viral] vân tay chụp TRƯỚC khi trích tiếng. File bị
 *   sửa/ghi đè trong mấy phút đang nghe thì kết quả là của bản CŨ mà vân tay
 *   lúc ghi là của bản MỚI → đệm nói dối. Lệch nhau thì không ghi.
 */
export function luuDem(
  mediaPath: string,
  maMoHinh: MaMoHinh,
  ket: KetQuaNghe,
  vanTayTruoc?: VanTay | null,
): boolean {
  try {
    const fs = getFs()
    const p = duongDanDem(mediaPath)
    const vt = vanTay(mediaPath)
    if (!fs || !p || !vt) return false
    if (vanTayTruoc && (vanTayTruoc.co !== vt.co || vanTayTruoc.sua !== vt.sua)) return false
    fs.writeFileSync(
      p,
      // ☠️ Thứ tự + tên trường y hệt Transcripts `luuDem` — xem khung ở trên.
      JSON.stringify({
        phienBan: PHIEN_BAN_DEM,
        moHinh: maMoHinh,
        ...vt,
        // Ngôn ngữ PHẢI lưu theo: lần sau đọc đệm thì không còn JSON của
        // Whisper để đọc lại.
        ngonNgu: ket.ngonNgu ?? '',
        cau: ket.cau,
        tu: ket.tu,
      }),
      'utf8',
    )
    return true
  } catch {
    /* không ghi được (thư mục chỉ đọc, ổ mạng…) thì thôi, lần sau nghe lại */
    return false
  }
}

/** Kết quả đọc đệm: nội dung + nguồn + mô hình THẬT đã nghe. */
export interface KetDem {
  ket: KetQuaNghe
  nguon: Extract<NguonNghe, 'dem-v1' | 'dem-v2'>
  moHinh: MaMoHinh
}

/**
 * Đọc lại kết quả nghe nếu còn dùng được. Trả null nếu thiếu, hỏng, hoặc vân
 * tay lệch.
 *
 * [Short Viral] Khác Transcripts ở hai chỗ, đều CÓ CHỦ Ý:
 *  1. Nhận đệm v2 của MỌI mô hình (thử mô hình đang xin trước, rồi cái còn
 *     lại). Transcripts đòi đúng mô hình vì mô hình quyết độ dài dòng phụ đề;
 *     panel này chỉ cần biết ai nói gì ở đâu — vứt đệm turbo để nghe lại bằng
 *     v3 là tốn vài phút GPU cho khác biệt chưa đo. Mô hình thật trả kèm để
 *     giao diện nói đúng. Muốn nghe lại thì bên gọi truyền `epNgheLai`.
 *     (Mỗi video chỉ có MỘT file đệm, nên "thử lần lượt" = nhận mô hình ghi
 *     trong file nếu nó là mô hình hợp lệ.)
 *  2. Nhận cả đệm v1 của Autocut (luôn `-l vi`, không có `ngonNgu` → coi là
 *     'vi'), gắn nguồn 'dem-v1'. ☠️ Video không phải tiếng Việt thì nội dung
 *     v1 có thể là rác (đo: Conspiracy 93/363 câu Việt trên video tiếng Anh)
 *     → giao diện phải hiện cờ + nút "Nghe lại" (hợp đồng `NoiDung.coDemV1`).
 * Cả hai đều phải khớp vân tay `co` + `sua`. Lệch = coi như không có đệm.
 */
export function docDem(mediaPath: string, maXin: MaMoHinh = 'turbo'): KetDem | null {
  try {
    const fs = getFs()
    const p = duongDanDem(mediaPath)
    const vt = vanTay(mediaPath)
    if (!fs || !p || !vt || !fs.existsSync(p)) return null
    const j = JSON.parse(fs.readFileSync(p, 'utf8'))
    if (j?.co !== vt.co || j?.sua !== vt.sua) return null

    const thuTu: MaMoHinh[] = [maXin, ...MO_HINH.map((m) => m.ma).filter((m) => m !== maXin)]
    const moHinh = thuTu.find((m) => j?.moHinh === m)
    if (!moHinh) return null

    const cau = locCau(j?.cau)
    if (!cau.length) return null
    const tu = locTu(j?.tu)

    if (j?.phienBan === PHIEN_BAN_DEM) {
      return {
        ket: { cau, tu, ngonNgu: typeof j.ngonNgu === 'string' ? j.ngonNgu : '' },
        nguon: 'dem-v2',
        moHinh,
      }
    }
    if (j?.phienBan === 1) {
      // Autocut 1.x khoá cứng `-l vi` (AiO Autocut/client/src/services/whisper.ts).
      return { ket: { cau, tu, ngonNgu: 'vi' }, nguon: 'dem-v1', moHinh }
    }
    // Phiên bản lạ (cao hơn 2 do panel đời sau ghi): không đoán định dạng.
    return null
  } catch {
    return null
  }
}

/** Giữ câu đúng hình (số hữu hạn, có chữ) — đệm là file nằm ngoài, ai cũng sửa được. */
function locCau(x: unknown): Cau[] {
  if (!Array.isArray(x)) return []
  const ra: Cau[] = []
  for (const c of x) {
    if (c && Number.isFinite(c.tu) && Number.isFinite(c.den) && typeof c.chu === 'string') {
      ra.push({ tu: c.tu, den: c.den, chu: c.chu })
    }
  }
  return ra
}

function locTu(x: unknown): TuTinCay[] {
  if (!Array.isArray(x)) return []
  const ra: TuTinCay[] = []
  for (const t of x) {
    if (t && Number.isFinite(t.giay) && typeof t.chu === 'string') {
      ra.push({ chu: t.chu, giay: t.giay, p: Number.isFinite(t.p) ? t.p : 1 })
    }
  }
  return ra
}

/**
 * Đọc JSON đầy đủ của whisper.cpp thành câu + từ kèm điểm tin cậy.
 *
 * Token của Whisper là mảnh sub-word ("Nh" + "ưng"), phải ghép lại mới ra từ.
 * Điểm của một từ = token **thấp nhất** trong nó — mắt xích yếu nhất quyết định.
 * Mốc từ = mốc ĐẦU token đầu tiên (không có mốc cuối — hợp đồng `TuTinCay`).
 *
 * ☠️ [Short Viral] SỐ TỪ PHẢI BẰNG SỐ TOKEN CỦA CÂU — `moc.ts` gán từ vào câu
 * THEO CHỈ SỐ và ném "bản nghe bị lệch" khi hai số khác nhau. Bản chép từ
 * Transcripts/Autocut bỏ CÂU có mốc cuối ≤ mốc đầu (hoặc chữ rỗng) nhưng vẫn đẩy
 * TỪ của câu đó vào `tu[]`, và một token chỉ có dấu cách thành một "từ" rỗng. Đo
 * 19/09 bằng chính hàm này (scratchpad doanrong.mjs): thêm một đoạn from = to =
 * 5000 ms " Dạ." → "câu có 3 từ nhưng có 4 mốc từ"; token " " đứng riêng → "2 từ
 * nhưng 3 mốc". Whisper tất định: nghe lại bằng cùng mô hình ra lệch y như cũ,
 * và đệm hỏng đã ghi xuống đĩa thì kẹt mãi. Nên ở đây: câu bị bỏ thì bỏ luôn từ
 * của nó, từ rỗng thì không đẩy. Tên + thứ tự trường không đổi — Transcripts vẫn
 * đọc được. (Tần suất thật: 0/9 đệm trên ổ E:/G:, ~55.000 từ — hiếm, gặp là kẹt.)
 */
export function docJson(noiDung: string): KetQuaNghe {
  let j: any
  try {
    j = JSON.parse(noiDung)
  } catch {
    throw new Error(dich('Không đọc được kết quả nghe hiểu (dữ liệu hỏng)'))
  }
  const cau: Cau[] = []
  const tu: TuTinCay[] = []
  // Whisper trả về ngôn ngữ nó nhận ra ở `result.language`.
  const ngonNgu = String(j?.result?.language ?? j?.params?.language ?? '').toLowerCase()

  for (const seg of j?.transcription ?? []) {
    const tu_ = (seg?.offsets?.from ?? 0) / 1000
    const den = (seg?.offsets?.to ?? 0) / 1000
    const chu = String(seg?.text ?? '').trim()
    // Câu bị bỏ → bỏ luôn TỪ của nó (xem ☠️ ở đầu hàm).
    if (!chu || !(den > tu_)) continue
    cau.push({ tu: tu_, den, chu })

    let cur: TuTinCay | null = null
    for (const t of seg?.tokens ?? []) {
      const s = String(t?.text ?? '')
      if (!s || s.startsWith('[_')) continue // token điều khiển
      const p = typeof t?.p === 'number' ? t.p : 1
      if (s.startsWith(' ') || !cur) {
        if (cur) tu.push(cur)
        const tr = s.trim()
        // Token toàn dấu cách: đóng từ trước, KHÔNG mở một từ rỗng — token sau
        // (không có dấu cách đầu) tự mở từ mới vì `cur` đang null.
        cur = tr ? { chu: tr, giay: (t?.offsets?.from ?? 0) / 1000, p } : null
      } else {
        cur.chu += s
        cur.p = Math.min(cur.p, p)
      }
    }
    if (cur) tu.push(cur)
  }
  return { cau, tu, ngonNgu }
}
