/**
 * nghe.ts — CỬA DUY NHẤT để lấy "bản nghe" (câu + từ + ngôn ngữ) của các file
 * gốc trong vùng. Giao diện chỉ gọi ba hàm ở đây: `kiemBoMay()`, `layBanNghe()`
 * và `donTamCu()` (dọn file tạm cũ lúc khởi động — thêm 19/09 sau soát). Mọi thứ
 * về FFmpeg, bộ nghe hiểu, đệm nằm sau cửa này.
 *
 * Luồng cho TỪNG file, lần lượt — học từ `lamPhuDe` của Transcripts:
 *
 *     đọc ĐỆM trước ──có──▶ dùng luôn (0,4–2,4 giây, đo ở Transcripts)
 *          │ không
 *          ▼
 *     trích tiếng (WAV 16 kHz mono, temp) ─▶ nghe hiểu ─▶ xoá WAV ─▶ ghi đệm
 *
 * ☠️ Đọc đệm TRƯỚC khi trích tiếng: có đệm thì khỏi trích WAV, mà đó là bước tốn
 * đĩa nhất (45 giây trên file 9,3 GB). Transcripts 2.0.0 trích xong mới hỏi đệm
 * — làm thừa đúng bước đắt nhất.
 *
 * ☠️ LẦN LƯỢT, KHÔNG SONG SONG: tối đa MỘT tiến trình nghe hiểu cùng lúc (AiO
 * Studio/CLAUDE.md mục 4c — không chạy 2 whisper song song; một con turbo đã
 * đỉnh 67% GPU, hai con là vượt trần 70%).
 */

import { dich } from '../ngonngu'
import { getFs, nodeAvailable } from '../lib/node'
import { getFFmpegPath, loiDaHuy, type CoHuy } from './ffmpeg'
import {
  docDem,
  donWav,
  laMaMoHinh,
  luuDem,
  nghe,
  thieuGi,
  timBoMay,
  trichTieng,
  vanTay,
  type BoMayWhisper,
  type MaMoHinh,
} from './whisper'
import type { BanNghe } from './kieu'

export { donTamCu } from './whisper'

export interface TienDoNghe {
  /** 0..100 cho CẢ lượt (mọi file), chỉ tăng không giảm. */
  phanTram: number
  /** File đang làm, đếm từ 1. */
  fileThu: number
  tongFile: number
}

export interface TuyChonNghe {
  /** Mô hình xin dùng khi phải nghe mới. Mặc định turbo (cấm v3 làm mặc định — mục 4c). */
  moHinh?: MaMoHinh
  /** true = bỏ qua đệm, nghe lại từ đầu (nút "Nghe lại" khi đệm v1 nghi là rác). */
  epNgheLai?: boolean
  /**
   * Báo tiến độ. ☠️ Luật 13/08: lúc chạy KHÔNG lộ quy trình — giao diện chỉ hiện
   * "Đang xử lý… N%" + đồng hồ, nên ở đây cố ý KHÔNG báo tên bước (tách tiếng /
   * nạp mô hình / nghe hiểu). Chỉ có một con số.
   */
  bao?: (t: TienDoNghe) => void
  /** Cờ dừng (`taoCoHuy()` ở ffmpeg.ts — hoặc object `{ daHuy, huy }` bất kỳ). */
  huy?: CoHuy
}

/**
 * Phần của một file dành cho bước trích tiếng; phần còn lại cho nghe hiểu.
 * Đo 19/09 (ngoài Premiere, bản chép video 55 phút / 700 MB nằm ổ C:, turbo):
 * trích xong ở giây 10,6 trên tổng 71,0 giây = 14,9%. MỘT file, MỘT máy —
 * file nằm ổ quay/ổ mạng thì trích chậm hơn nhiều (28/07: 45 giây cho 9,3 GB).
 * Sai số chỉ làm thanh % chạy không đều, không làm sai kết quả.
 */
const PHAN_TRICH = 0.15

/**
 * Kiểm đủ đồ nghề chưa. '' = đủ; ngược lại là câu tiếng Việt (đã qua `dich()`)
 * nói thiếu gì và phải nằm ở đâu — hiện nguyên câu cho người dùng.
 *
 * ⚠️ Chưa có chỗ TẢI bộ nghe hiểu cho khách (bộ cài chưa kèm, trang web chưa có
 * link — đo 19/09). Câu báo chỉ nói được thiếu gì + thư mục phải có.
 */
export function kiemBoMay(): string {
  if (!nodeAvailable()) return dich('Panel không dùng được Node.js — không gọi được bộ xử lý media.')
  if (!getFFmpegPath()) return dich('Thiếu thành phần xử lý media của panel — cài lại bản mới nhất.')
  if (!timBoMay('turbo')) {
    return dich('Chưa cài bộ nghe hiểu nên chưa đọc được nội dung.\n') + thieuGi()
  }
  return ''
}

/**
 * Lấy bản nghe cho từng file gốc.
 *
 * - Mỗi path KHÁC NHAU cho đúng một phần tử, theo thứ tự xuất hiện lần đầu.
 *   Path so sánh sau khi đổi `\` → `/`; `BanNghe.path` cũng trả dạng `/`.
 * - File không có luồng tiếng (ảnh tĩnh, video câm) → bản nghe RỖNG
 *   (`cau: []`), `nguon: 'vua-nghe'`, `moHinh: ''`. Không ném lỗi: một ảnh
 *   B-roll trong vùng không được chặn cả lượt.
 * - Thiếu đồ nghề → ném Error có `ma = 'THIEU_BO_MAY'` (câu = `kiemBoMay()`),
 *   CHỈ khi thật sự phải nghe mới — đủ đệm cho mọi file thì không cần đồ nghề.
 * - File gốc không còn trên đĩa → ném Error có `ma = 'MAT_FILE'`.
 * - Bấm Dừng → dừng NGAY (giết tiến trình đang chạy), dọn WAV tạm, ném Error
 *   có `ma = 'DA_HUY'`. File nghe XONG trước lúc dừng đã được ghi đệm → lần
 *   sau khỏi nghe lại phần đó.
 */
export async function layBanNghe(paths: string[], tuyChon: TuyChonNghe = {}): Promise<BanNghe[]> {
  const huy = tuyChon.huy
  const maXin: MaMoHinh = laMaMoHinh(tuyChon.moHinh) ? tuyChon.moHinh : 'turbo'
  const kiemHuy = () => {
    if (huy?.daHuy) throw loiDaHuy()
  }

  // ── Danh sách file khác nhau, giữ thứ tự ──
  const ds: { goc: string; chuan: string }[] = []
  const daCo = new Set<string>()
  for (const p of paths) {
    if (!p) continue
    const chuan = String(p).replace(/\\/g, '/')
    if (daCo.has(chuan)) continue
    daCo.add(chuan)
    ds.push({ goc: String(p), chuan })
  }
  if (!ds.length) return []

  // ── Trọng số tiến độ theo DUNG LƯỢNG file ──
  // Đoán thời lượng trước khi mở file thì không có; dung lượng là thứ đọc được
  // ngay và tỉ lệ thuận thô với độ dài. Chia đều theo số file thì cặp
  // "clip 1 phút + clip 40 phút" nhảy 50% trong một giây rồi đứng im.
  const fs = getFs()
  const trongSo = ds.map((f) => {
    try {
      const n = fs ? Number(fs.statSync(f.goc).size) : 0
      return n > 0 ? n : 1
    } catch {
      return 1
    }
  })
  const tongTrongSo = trongSo.reduce((a, b) => a + b, 0)
  let daXongTrongSo = 0
  let ptDaBao = -1
  let fileDaBao = 0
  const baoTienDo = (i: number, phanTrongFile: number) => {
    if (!tuyChon.bao) return
    const x = (daXongTrongSo + trongSo[i] * Math.max(0, Math.min(1, phanTrongFile))) / tongTrongSo
    const pt = Math.max(0, Math.min(100, Math.floor(x * 100)))
    // Chỉ báo khi SỐ tăng hoặc sang file mới — % không bao giờ lùi.
    if (pt > ptDaBao || i + 1 !== fileDaBao) {
      ptDaBao = Math.max(pt, ptDaBao)
      fileDaBao = i + 1
      try {
        tuyChon.bao({ phanTram: ptDaBao, fileThu: i + 1, tongFile: ds.length })
      } catch {
        /* bên vẽ hỏng không được làm chết lượt nghe */
      }
    }
  }

  // Đồ nghề chỉ dò khi thật sự phải nghe mới (đủ đệm thì không cần).
  let boMay: BoMayWhisper | null = null
  const layBoMay = (): BoMayWhisper => {
    if (boMay) return boMay
    const thieu = kiemBoMay()
    const bm = thieu ? null : timBoMay(maXin)
    if (!bm) {
      const e = new Error(thieu || thieuGi()) as Error & { ma: string }
      e.ma = 'THIEU_BO_MAY'
      throw e
    }
    boMay = bm
    return bm
  }

  const ketQua: BanNghe[] = []

  for (let i = 0; i < ds.length; i++) {
    const { goc, chuan } = ds[i]
    kiemHuy()
    baoTienDo(i, 0)

    // ── 1. Đệm ──
    if (!tuyChon.epNgheLai) {
      const dem = docDem(goc, maXin)
      if (dem) {
        ketQua.push({ path: chuan, ket: dem.ket, nguon: dem.nguon, moHinh: dem.moHinh })
        daXongTrongSo += trongSo[i]
        baoTienDo(i, 0)
        continue
      }
    }

    // ── 2. Nghe mới ──
    if (!fs || !fs.existsSync(goc)) {
      const e = new Error(
        dich('Không thấy file gốc trên đĩa (có thể đã bị dời, đổi tên hoặc ổ chưa cắm):\n') + chuan,
      ) as Error & { ma: string }
      e.ma = 'MAT_FILE'
      throw e
    }
    const bm = layBoMay()
    // Vân tay chụp TRƯỚC khi đọc file — xem `luuDem` về đệm nói dối.
    const vtTruoc = vanTay(goc)
    let wav = ''
    try {
      const tr = await trichTieng(goc, {
        huy,
        bao: (giay, tong) => {
          if (tong > 0) baoTienDo(i, PHAN_TRICH * (giay / tong))
        },
      })
      wav = tr.wav
      kiemHuy()
      if (!tr.coTieng) {
        // Không có luồng tiếng: không phải lỗi, không ghi đệm (đệm rỗng thì
        // Transcripts/Autocut đọc lên cũng coi là không có).
        ketQua.push({ path: chuan, ket: { cau: [], tu: [], ngonNgu: '' }, nguon: 'vua-nghe', moHinh: '' })
      } else {
        const ket = await nghe(wav, bm, {
          huy,
          // p = -1: đang nạp mô hình — giữ nguyên số, đồng hồ trên giao diện vẫn chạy.
          bao: (p) => {
            if (p >= 0) baoTienDo(i, PHAN_TRICH + (1 - PHAN_TRICH) * (p / 100))
          },
        })
        kiemHuy()
        // Ghi mã mô hình THẬT (bm.ma), không phải mã đã xin — xem BoMayWhisper.ma.
        luuDem(goc, bm.ma, ket, vtTruoc)
        ketQua.push({ path: chuan, ket, nguon: 'vua-nghe', moHinh: bm.ma })
      }
    } finally {
      // Dừng / lỗi / xong: WAV tạm (~115 MB cho 1 giờ) không được nằm lại temp.
      if (wav) donWav(wav)
    }
    daXongTrongSo += trongSo[i]
    baoTienDo(i, 0)
  }

  kiemHuy()
  return ketQua
}
