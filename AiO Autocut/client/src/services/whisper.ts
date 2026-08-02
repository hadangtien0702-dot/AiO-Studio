/**
 * whisper.ts — nhận dạng tiếng nói bằng whisper.cpp chạy trên GPU.
 *
 * Vì sao whisper.cpp chứ không phải faster-whisper/Python: **không cần Python**.
 * Dự án anh em AiO Sub nằm im từ 2026-05-06 đúng vì bắt người dùng tự cài
 * Python/whisper — không lặp lại vết đó.
 *
 * Đo thật trên máy anh Tiến (RTX 4060 Ti 16GB) ngày 2026-07-28:
 * mô hình large-v3 xử lý 60 giây tiếng trong 11,7 giây — nhanh gấp 5 lần thời
 * gian thực.
 *
 * Bộ máy để ở `%APPDATA%\AiO Studio\whisper\` chứ không nhét vào extension:
 * nhét vào thì gói cài phình thêm 3,7 GB và mỗi lần cài phải chép lại từng ấy.
 * Để ở AppData vẫn chạy tốt vì phần này đi qua **Node**, không qua ExtendScript
 * (ExtendScript của Premiere Beta không đọc được file mới tạo trong AppData —
 * xem PROGRESS.md 2026-07-28).
 */

import { getFs, getPath, nodeRequire } from '../lib/node'
import { execFileAsync, getFFmpegPath, soLuongCpu } from './ffmpeg'
import { parseDuration, parseVideoFps } from './silencelog'
import type { Cau } from './srt'

export type { Cau }

export interface BoMayWhisper {
  exe: string
  model: string
}

/**
 * Hai mô hình nghe hiểu, đo thật trên máy anh Tiến 2026-07-28 (RTX 4060 Ti 16GB):
 *
 * | | large-v3 | turbo |
 * |---|---|---|
 * | 245 giây tiếng | 34,5s | **10,5s** |
 * | GPU đỉnh | 88% | **67%** |
 * | Video 3 tiếng | ~33 phút | **~7,7 phút** |
 *
 * Chất lượng tiếng Việt **gần như ngang nhau** — cả hai cùng nghe nhầm nhóm
 * thuật ngữ tài chính ("chi trả", "lãi suất"), chỉ khác cách nhầm; đều phải nhờ
 * bảng sửa từ. Nên mặc định lấy TURBO: nhanh gấp 3,3 lần và là bản duy nhất giữ
 * GPU dưới trần 70% anh Tiến đặt.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ KIỂM TRA CHÉO HAI MÔ HÌNH — 2026-07-28, video 58 phút
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Đây là **thước đo độc lập đầu tiên** của dự án: cắt theo mô hình A, rồi đếm
 * xem bao nhiêu CÂU CỦA MÔ HÌNH B bị mất quá nửa lời. B không tham gia quyết
 * định cắt nên lỗi của A không tự che giấu được.
 *
 *      mức Vừa      | cắt theo turbo: 409 nhát, 4:03 | B chấm:  4/1277
 *                   | cắt theo v3   : 408 nhát, 3:47 | B chấm:  5/2033
 *      mức Cắt sạch | cắt theo turbo: 920 nhát, 7:34 | B chấm:  4/1277
 *                   | cắt theo v3   : 920 nhát, 7:19 | B chấm: 10/2033
 *
 * Kết luận: **mô hình gần như KHÔNG ảnh hưởng tới việc cắt** — cùng một mức thì
 * số nhát gần y hệt (409/408, 920/920). Thứ quyết định độ mạnh tay là **MỨC**,
 * không phải mô hình. Và turbo cắt được NHIỀU hơn mà AN TOÀN hơn hoặc ngang.
 *
 * ⚠️ Đã có lúc kết luận ngược (28/07 18:19: *"v3 nghe ít câu hơn nên cắt mạnh
 * tay hơn, 920 so với 407"*) — **sai vì so hai cấu hình khác nhau**: `turbo+Vừa`
 * với `v3+Cắt sạch`. Đổ khác biệt của MỨC lên đầu MÔ HÌNH. Kiểm chéo bắt được.
 *
 * ⚠️ Còn con số "tự chấm mình": cắt theo v3 ở mức Cắt sạch **tự chấm 0 câu mất**
 * trong khi turbo chấm **10 câu**. Đó là lý do suốt ngày 28/07 báo "0 câu bị cắt
 * mất" mà anh Tiến vẫn nghe ra chỗ mất.
 *
 * → **Giữ TURBO làm mặc định.** large-v3 chỉ đổi phụ đề (1.277 câu dài hơn so
 * với 2.033 câu ngắn), không đổi chất lượng cắt, mà chậm gấp 2,7 lần.
 */
export const MO_HINH = [
  {
    ma: 'turbo',
    ten: 'Nhanh',
    file: 'ggml-large-v3-turbo.bin',
    // ☠️ BAN THUONG MAI: mo ta nay len TOOLTIP cua nut. Khong neu thong so
    // noi bo (toc do gap may lan, muc GPU, ten mo hinh) — anh Tien 30/07:
    // *"khong de nguoi dung biet minh dung gi va lam gi"*.
    mo: 'Chép nhanh hơn · câu ngắn, nhiều khối',
  },
  {
    ma: 'v3',
    ten: 'Phụ đề câu dài',
    file: 'ggml-large-v3.bin',
    mo: 'Nghe kỹ hơn · câu phụ đề dài hơn',
  },
] as const

export type MaMoHinh = (typeof MO_HINH)[number]['ma']

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
 * Cố ý KHÔNG tự tải về ở đây: 3,1 GB là thứ phải hỏi trước, không phải thứ tự
 * ý ngốn băng thông của người ta.
 */
export function timBoMay(ma: MaMoHinh = 'turbo'): BoMayWhisper | null {
  const fs = getFs()
  const path = getPath()
  const goc = thuMucWhisper()
  if (!fs || !path || !goc) return null

  const chon = MO_HINH.find((m) => m.ma === ma) ?? MO_HINH[0]
  const exe = path.join(goc, 'bin', 'Release', 'whisper-cli.exe')
  try {
    if (!fs.existsSync(exe)) return null
    const model = path.join(goc, 'models', chon.file)
    if (fs.existsSync(model)) return { exe, model }
    // Thiếu đúng mô hình được chọn thì lùi sang cái còn lại, còn hơn không chạy.
    for (const m of MO_HINH) {
      const p = path.join(goc, 'models', m.file)
      if (fs.existsSync(p)) return { exe, model: p }
    }
  } catch {
    /* bỏ qua */
  }
  return null
}

/** Mô tả thứ còn thiếu, để báo cho người dùng bằng tiếng người. */
export function thieuGi(): string {
  const fs = getFs()
  const path = getPath()
  const goc = thuMucWhisper()
  if (!fs || !path) return 'Panel không dùng được Node.js.'
  if (!goc) return 'Không xác định được thư mục cài đặt của bộ nghe hiểu.'
  const exe = path.join(goc, 'bin', 'Release', 'whisper-cli.exe')
  const model = path.join(goc, 'models', 'ggml-large-v3.bin')
  const thieu: string[] = []
  try {
    // ☠️ BAN THUONG MAI: khong neu ten cong cu nen. Anh Tien 30/07:
    // *"ban thuong mai khong de nguoi dung biet minh dung gi va lam gi"*.
    // Khach biet panel boc mot cong cu ma nguon mo la tu chay duoc, khoi mua.
    if (!fs.existsSync(exe)) thieu.push('bộ nghe hiểu')
    if (!fs.existsSync(model)) thieu.push('dữ liệu nghe hiểu (khoảng 3 GB)')
  } catch {
    return 'Không đọc được thư mục ' + goc
  }
  if (!thieu.length) return ''
  return `Chưa có ${thieu.join(' và ')} trong:\n${goc}`
}

/**
 * Trích tiếng của một file media ra WAV 16 kHz mono — định dạng whisper.cpp cần.
 * File tạm nằm ở thư mục temp của hệ điều hành (Node đọc được, không cần
 * ExtendScript nên không dính chuyện AppData bị ảo hoá).
 */
export async function trichTieng(
  mediaPath: string,
  bao?: (giayDaXong: number) => void,
): Promise<{ wav: string; fps: number; duration: number }> {
  const req = nodeRequire()
  const path = getPath()
  if (!req || !path) throw new Error('Panel không dùng được Node.js')
  const os = req('os')
  const ffmpeg = getFFmpegPath()
  if (!ffmpeg) throw new Error('Thiếu thành phần xử lý media của panel')

  const ra = path.join(os.tmpdir(), `aio-autocut-${Date.now()}.wav`)
  // Tiện thể lấy luôn fps + thời lượng từ log của chính lệnh này, khỏi phải mở
  // file gốc thêm lần nữa. Video 3 tiếng giải mã lại một lần là mất cả phút.
  // ⚠️ KHÔNG dùng `-nostats` khi cần tiến độ: chính `-nostats` chặn dòng
  // `time=00:12:34.56` mà FFmpeg in ra liên tục. Bước này mất 45 giây trên file
  // 9,3 GB — không có tiến độ thì người dùng tưởng treo (anh Tiến 2026-07-28).
  const { stderr } = await execFileAsync(
    ffmpeg,
    [
      '-hide_banner', ...(bao ? [] : ['-nostats']), '-threads', String(soLuongCpu()),
      '-y', '-i', mediaPath, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', ra,
    ],
    {
      uuTienThap: false,
      ngheStderr: bao
        ? (mau) => {
            let m: RegExpExecArray | null = null
            let cuoi: RegExpExecArray | null = null
            const re = /time=(\d+):(\d+):(\d+)/g
            while ((m = re.exec(mau)) !== null) cuoi = m
            if (cuoi) {
              bao(parseInt(cuoi[1], 10) * 3600 + parseInt(cuoi[2], 10) * 60 + parseInt(cuoi[3], 10))
            }
          }
        : undefined,
    },
  )
  return { wav: ra, fps: parseVideoFps(stderr), duration: parseDuration(stderr) }
}

/**
 * Tạo BẢN LỌC của file WAV: chỉ giữ dải tần tiếng người (300–3400 Hz).
 *
 * ══════════════════════════════════════════════════════════════════════════
 * VÌ SAO PHẢI CÓ HAI BẢN TIẾNG — ĐO THẬT 2026-07-28
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Bản LỌC dùng để **đo năng lượng**. Tiếng ồn phòng (máy lạnh, ù nền, xe cộ)
 * nằm ngoài dải giọng nói, lọc đi là mất nhiễu chứ không mất tiếng:
 *
 *      video 58 phút (quay iPhone, 2 người):  tách 11,4 dB -> **15,0 dB**
 *                                             phút tệ nhất  8,3 -> **10,5 dB**
 *      clip Heygen (studio):                  46,9 -> 46,5 dB (không hại)
 *
 * Bản GỐC dùng cho **Whisper nghe**. Đã thử cho Whisper nghe bản lọc + nâng
 * (`dynaudnorm`) và nó **KÉM ĐI rõ rệt** — mô hình được huấn luyện trên tiếng
 * tự nhiên, cắt dải tần là lấy mất thông tin nó cần:
 *
 *      | | câu | từ | tin cậy TB | từ p<0,6 |
 *      | gốc      | **2.033** | **13.563** | **0,853** | 1.540 |
 *      | lọc+nâng |   1.576   |   12.320   |   0,804   | 2.449 |
 *
 * Nên: **lọc cho MÁY ĐO, giữ nguyên cho MÁY NGHE.** Trả '' nếu lọc không được —
 * bên gọi lùi về dùng bản gốc, kém chính xác hơn chứ không sập.
 */
export async function locDaiGiongNoi(wavPath: string): Promise<string> {
  const ffmpeg = getFFmpegPath()
  if (!ffmpeg) return ''
  const ra = wavPath.replace(/\.wav$/i, '-loc.wav')
  try {
    await execFileAsync(
      ffmpeg,
      [
        '-hide_banner', '-nostats', '-threads', String(soLuongCpu()),
        '-y', '-i', wavPath, '-af', 'highpass=f=300,lowpass=f=3400',
        '-c:a', 'pcm_s16le', ra,
      ],
      { uuTienThap: false },
    )
    return ra
  } catch {
    return ''
  }
}

/** Xoá file WAV tạm. Gọi sau khi đã nghe xong VÀ đã dò xong khoảng lặng. */
export function donWav(wavPath: string): void {
  const fs = getFs()
  try {
    if (fs) fs.unlinkSync(wavPath)
  } catch {
    /* dọn không được thì thôi */
  }
}

/** Một từ kèm điểm tin cậy của chính Whisper. Thời gian trên FILE GỐC. */
export interface TuTinCay {
  chu: string
  giay: number
  /** 0..1 — Whisper tự chấm nó tin bao nhiêu vào từ này. */
  p: number
}

export interface KetQuaNghe {
  cau: Cau[]
  tu: TuTinCay[]
}

/**
 * Chạy Whisper trên file WAV.
 *
 * Xuất JSON đầy đủ (`-ojf`) chứ không phải .srt, vì JSON có thêm **điểm tin cậy
 * từng token** — thứ dùng để chỉ ra chỗ máy đoán mò.
 *
 * Đo thật 2026-07-28 trên clip anh Tiến: 5 chỗ nghe sai đều xếp hạng 1, 2, 3, 5, 8
 * trong 330 từ kém tin cậy nhất; cùng những chữ đó ở chỗ nghe ĐÚNG thì điểm
 * 0,997–1,000. Nói cách khác **máy tự biết chỗ nào nó không chắc**, khỏi cần
 * mô hình thứ hai đi kiểm tra.
 */
export async function nghe(
  wavPath: string,
  boMay: BoMayWhisper,
  bao?: (phanTram: number) => void,
): Promise<KetQuaNghe> {
  const req = nodeRequire()
  const fs = getFs()
  const path = getPath()
  if (!req || !fs || !path) throw new Error('Panel không dùng được Node.js')

  // whisper-cli tự thêm đuôi .srt vào tên đưa cho `-of`.
  //
  // ⚠️ KHÔNG dùng `-p` (processors > 1). Đo thật: `-p 2` nhanh hơn 27% nhưng
  // **chẻ câu làm nhiều mảnh** — 15 câu thành 24 câu vụn. Mà ranh giới câu chính
  // là thứ quyết định cắt ở đâu: câu bị chẻ đôi thì chỗ nối giữa hai mảnh bị
  // hiểu nhầm là "khoảng giữa hai câu" và tool sẽ CẮT VÀO GIỮA CÂU NÓI.
  // Nhanh hơn mà hỏng đúng thứ mình vừa sửa thì không lấy.
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
  //
  // Và `-mc 0` KHÔNG làm hỏng việc cắt (đo cùng ngày, cùng file):
  //      nhát cắt 415 → 415 · rút 3:51 → 3:50 · chỗ "có tiếng không ra chữ" 17 → 3
  // Trên clip studio 82 giây: **giống hệt từng chữ** (16 câu, 330 từ).
  //
  // ⚠️ Giá phải trả: cắt ngữ cảnh thì thỉnh thoảng nó đoán mò từ dữ liệu huấn
  // luyện — đo được **20 câu** kiểu "Hãy subscribe cho kênh…". Đổi 26 phút rác
  // lấy 20 câu rác là đáng.
  //
  // `-pp` (print-progress) in ra `whisper_print_progress_callback: progress = N%`.
  // Đo thật 2026-07-28: nó **vẫn in kể cả khi giữ `-np`**, nên thêm được mà không
  // phải bỏ `-np` (bỏ `-np` là hứng thêm cả nghìn dòng phụ đề vào bộ đệm).
  //
  // Vì sao cần: bước này mất 3-8 phút mà nhãn đứng im, anh Tiến tưởng máy treo.
  const goc = wavPath.replace(/\.wav$/i, '')
  let cuoi = -1 // % lớn nhất đã báo; -1 = chưa có % nào (còn đang nạp mô hình)
  await execFileAsync(
    boMay.exe,
    ['-m', boMay.model, '-f', wavPath, '-l', 'vi', '-t', String(soLuongCpu()),
     '-mc', '0', '-np', '-pp', '-ojf', '-of', goc],
    {
      uuTienThap: false, // anh Tiến đang ngồi đợi — đừng nhường CPU cho ai
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

  const jsonPath = goc + '.json'
  let noiDung = ''
  try {
    noiDung = fs.readFileSync(jsonPath, 'utf8')
  } catch {
    throw new Error('Bộ nghe hiểu chạy xong nhưng không thấy file kết quả:\n' + jsonPath)
  }
  try {
    fs.unlinkSync(jsonPath)
  } catch {
    /* dọn không được thì thôi — WAV do bên gọi dọn, vì nó còn dùng cho việc khác */
  }
  return docJson(noiDung)
}

/* ══════════════════════════════════════════════════════════════════════════
   BỘ ĐỆM KẾT QUẢ NGHE — để Auto Cut làm bước đệm cho Auto Transcript
   ══════════════════════════════════════════════════════════════════════════

   Anh Tiến 2026-07-29: *"tính năng cắt tiếng thì không được tạo phụ đề. Nếu như
   em cần đọc hiểu phụ đề thì chạy ngầm và làm bước đệm cho phần tạo transcripts
   chứ không đưa nó vào tính năng auto cut silence"*.

   Auto Cut BẮT BUỘC phải nghe hiểu (luật cắt 1.0.0 là giao hai nguồn; bỏ Whisper
   là rơi về 0.9.0 — bản đã cắt mất 321 câu). Nhưng nghe xong thì nó chỉ dùng để
   QUYẾT ĐỊNH ĐIỂM CẮT rồi thôi, không đẻ ra phụ đề.

   Kết quả nghe đó tốn 3-8 phút, vứt đi thì phí. Nên ghi lại cạnh video: lúc
   người dùng bấm Làm phụ đề trên cùng file, khỏi phải nghe lại từ đầu.

   ⚠️ Phải khoá theo KÍCH THƯỚC + GIỜ SỬA của video, và theo MÔ HÌNH đã dùng.
   File đổi mà vẫn xài đệm cũ là ra phụ đề của video khác — hỏng âm thầm, kiểu
   lỗi tệ nhất. Mô hình khác cũng cho kết quả khác hẳn (turbo 762 câu so với
   large-v3 874 câu trên cùng file).
*/

const PHIEN_BAN_DEM = 1

function duongDanDem(mediaPath: string): string | null {
  const path = getPath()
  if (!path) return null
  const thuMuc = path.dirname(mediaPath)
  const ten = path.basename(mediaPath).replace(/\.[^.]+$/, '')
  return path.join(thuMuc, `${ten}.autocut-nghe.json`)
}

/** Vân tay của file gốc — đổi một trong hai là đệm hết hiệu lực. */
function vanTay(mediaPath: string): { co: number; sua: number } | null {
  try {
    const fs = getFs()
    if (!fs) return null
    const st = fs.statSync(mediaPath)
    return { co: st.size, sua: Math.round(st.mtimeMs) }
  } catch {
    return null
  }
}

/** Ghi kết quả nghe cạnh video. Hỏng thì im lặng bỏ qua — đệm không phải thứ sống còn. */
export function luuDem(mediaPath: string, maMoHinh: string, ket: KetQuaNghe): void {
  try {
    const fs = getFs()
    const p = duongDanDem(mediaPath)
    const vt = vanTay(mediaPath)
    if (!fs || !p || !vt) return
    fs.writeFileSync(
      p,
      JSON.stringify({ phienBan: PHIEN_BAN_DEM, moHinh: maMoHinh, ...vt, cau: ket.cau, tu: ket.tu }),
      'utf8',
    )
  } catch {
    /* không ghi được thì thôi, lần sau nghe lại */
  }
}

/** Đọc lại kết quả nghe nếu còn dùng được. Trả null nếu thiếu, cũ, hoặc khác mô hình. */
export function docDem(mediaPath: string, maMoHinh: string): KetQuaNghe | null {
  try {
    const fs = getFs()
    const p = duongDanDem(mediaPath)
    const vt = vanTay(mediaPath)
    if (!fs || !p || !vt || !fs.existsSync(p)) return null
    const j = JSON.parse(fs.readFileSync(p, 'utf8'))
    if (j?.phienBan !== PHIEN_BAN_DEM) return null
    if (j?.moHinh !== maMoHinh) return null
    if (j?.co !== vt.co || j?.sua !== vt.sua) return null
    if (!Array.isArray(j?.cau) || !j.cau.length) return null
    return { cau: j.cau as Cau[], tu: (j.tu ?? []) as TuTinCay[] }
  } catch {
    return null
  }
}

/**
 * Đọc JSON đầy đủ của whisper.cpp thành câu + từ kèm điểm tin cậy.
 *
 * Token của Whisper là mảnh sub-word ("Nh" + "ưng"), phải ghép lại mới ra từ.
 * Điểm của một từ = token **thấp nhất** trong nó — mắt xích yếu nhất quyết định.
 */
export function docJson(noiDung: string): KetQuaNghe {
  let j: any
  try {
    j = JSON.parse(noiDung)
  } catch {
    throw new Error('Không đọc được kết quả nghe hiểu (dữ liệu hỏng)')
  }
  const cau: Cau[] = []
  const tu: TuTinCay[] = []

  for (const seg of j?.transcription ?? []) {
    const tu_ = (seg?.offsets?.from ?? 0) / 1000
    const den = (seg?.offsets?.to ?? 0) / 1000
    const chu = String(seg?.text ?? '').trim()
    if (chu && den > tu_) cau.push({ tu: tu_, den, chu })

    let cur: TuTinCay | null = null
    for (const t of seg?.tokens ?? []) {
      const s = String(t?.text ?? '')
      if (!s || s.startsWith('[_')) continue // token điều khiển
      const p = typeof t?.p === 'number' ? t.p : 1
      if (s.startsWith(' ') || !cur) {
        if (cur) tu.push(cur)
        cur = { chu: s.trim(), giay: (t?.offsets?.from ?? 0) / 1000, p }
      } else {
        cur.chu += s
        cur.p = Math.min(cur.p, p)
      }
    }
    if (cur) tu.push(cur)
  }
  return { cau, tu }
}

/** Đọc nội dung một file SRT thành danh sách câu. */
export function docSrt(noiDung: string): Cau[] {
  const ra: Cau[] = []
  const khoi = noiDung.replace(/\r\n/g, '\n').split(/\n\s*\n/)
  for (const k of khoi) {
    const dong = k.split('\n').filter((d) => d.trim() !== '')
    if (dong.length < 2) continue
    const m = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/.exec(dong[1] ?? '')
    if (!m) continue
    const giay = (h: string, p: string, s: string, ms: string) =>
      parseInt(h, 10) * 3600 + parseInt(p, 10) * 60 + parseInt(s, 10) + parseInt(ms, 10) / 1000
    const chu = dong.slice(2).join(' ').trim()
    if (!chu) continue
    ra.push({
      tu: giay(m[1], m[2], m[3], m[4]),
      den: giay(m[5], m[6], m[7], m[8]),
      chu,
    })
  }
  return ra
}
