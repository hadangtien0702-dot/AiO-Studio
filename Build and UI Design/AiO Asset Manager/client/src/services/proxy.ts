import { getFs, getPath } from '../lib/node'
import { execFileAsync, getFFmpegPath } from './ffmpeg'
import { cacheProxiesDir } from './cachePaths'

/** [0.18.0] Chỗ lưu do `cachePaths.ts` quyết định (đổi được sang ổ khác). */
export function getProxiesDir(): string {
  return cacheProxiesDir()
}

/**
 * Kiểm tra video có thuộc loại cần sinh proxy nhẹ không.
 * Điều kiện: filesize > 200MB hoặc độ phân giải >= 4K hoặc codec ProRes.
 */
export function isHeavyVideo(
  fileSize: number,
  width?: number,
  height?: number,
  codec?: string
): boolean {
  if (fileSize > 200 * 1024 * 1024) return true
  if (width && width >= 3840) return true
  if (height && height >= 2160) return true
  if (codec && codec.toLowerCase().includes('prores')) return true
  return false
}

/**
 * Sinh proxy H.264 360p siêu nhẹ để preview mượt cho video nặng.
 */
export async function generateVideoProxy(
  id: string,
  filePath: string,
  fileSize: number,
  width?: number,
  height?: number,
  codec?: string,
  /**
   * [0.17.0 - OPTIMIZE D1] Bỏ qua kiểm tra "nặng hay không".
   * Dùng khi người dùng đã rê chuột vào clip này nhiều lần — lúc đó bản nhẹ
   * đáng làm dù file chưa vượt ngưỡng. Xem `services/hoverProxy.ts`.
   */
  force = false
): Promise<string> {
  if (!force && !isHeavyVideo(fileSize, width, height, codec)) return ''

  const ffmpegPath = getFFmpegPath()
  const proxiesDir = getProxiesDir()
  const fs = getFs()
  const path = getPath()

  if (!ffmpegPath || !proxiesDir || !fs || !path) return ''

  const outPath = path.join(proxiesDir, `${id}.mp4`)
  if (fs.existsSync(outPath)) {
    return outPath
  }

  try {
    // [0.10.0] Đã benchmark trên máy thật (5950X + RTX 4060 Ti, clip 4K 12s):
    //   - libx264 ultrafast: wall 2.0s, CPU-time 3.2s
    //   - cuda + nvenc:      wall 6.2s (khởi tạo CUDA ~1-2s mỗi tiến trình),
    //                        CPU-time 5.2s (CAO hơn!)
    // => không dùng GPU cho job ngắn; "không tranh CPU với Premiere" đã do
    //    execFileAsync hạ ưu tiên IDLE lo. GPU để dành cho Premiere.
    //
    // ☠️ [2.0.0] ĐÃ BỎ `libx264` — VÌ GIẤY PHÉP, VÀ HOÁ RA CÒN TỐT HƠN.
    //
    // `libx264` là GPL. Bundle nó vào sản phẩm BÁN thì GPL bắt mở toàn bộ mã
    // nguồn. Đây là chỗ DUY NHẤT trong cả bộ công cụ còn dính GPL — mọi thứ
    // khác (tách WAV, silencedetect, showwavespic, thumbnail) đều là phần lõi
    // LGPL của FFmpeg.
    //
    // Thay bằng `libopenh264` (Cisco, giấy phép BSD). Đo thật 29/07/2026 trên
    // clip 108 MB / 81,7 giây, cùng máy, cùng lệnh:
    //
    //   bộ mã hoá              thời gian   dung lượng   SSIM (giống bản gốc)
    //   libx264 crf28 ultrafast   5,9s      4,30 MB       0,9212
    //   h264_mf 300k              3,1s      3,83 MB       0,9664
    //   libopenh264 300k          2,8s      3,84 MB       0,9655   <- chọn
    //
    // Nhanh gấp đôi, nhẹ hơn 11%, NÉT HƠN HẲN. Lý do bản cũ tệ: `-preset
    // ultrafast` bóp chết chất lượng x264 để lấy tốc độ.
    //
    // Vì sao chọn `libopenh264` chứ không phải `h264_mf` (SSIM nhỉnh hơn tí):
    // openh264 nằm TRONG file ffmpeg.exe mình bundle, máy nào cũng chạy giống
    // nhau. `h264_mf` mượn bộ mã hoá của Windows — bản Windows N/KN (bán ở EU,
    // Hàn Quốc) KHÔNG có sẵn, khách mua về là proxy chết câm.
    const args = [
      '-hwaccel',
      'auto',
      '-i',
      filePath,
      '-vf',
      'scale=-2:360',
      '-c:v',
      'libopenh264',
      '-b:v',
      '300k',
      // GIỮ TIẾNG: bản cũ dùng -an nên video nặng hover câm lặng — trái hẳn
      // mục đích cụm âm lượng/pitch. AAC 96k chỉ thêm ~12 KB/giây.
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      // moov atom lên đầu file: <video> phát được ngay khi tải phần đầu,
      // không phải chờ đọc tới cuối file mới biết cấu trúc.
      '-movflags',
      '+faststart',
      outPath,
      '-y',
    ]
    await execFileAsync(ffmpegPath, args)
    if (fs.existsSync(outPath)) {
      return outPath
    }
  } catch (err) {
    // Bỏ qua nếu video bị lỗi
  }

  return ''
}
