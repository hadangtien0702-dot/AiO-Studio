import { getFs, getPath } from '../lib/node'
import { execFileAsync, getFFmpegPath } from './ffmpeg'
import { getThumbsDir } from './thumbnailer'

/**
 * Sinh ảnh dạng sóng âm thanh (waveform) cho file audio.
 */
export async function generateAudioWaveform(
  id: string,
  filePath: string
): Promise<string> {
  const ffmpegPath = getFFmpegPath()
  const thumbsDir = getThumbsDir()
  const fs = getFs()
  const path = getPath()

  if (!ffmpegPath || !thumbsDir || !fs || !path) return ''

  /**
   * [1.2.0-dev.3] Xuất WebP thay cho PNG.
   *
   * Vì sao đổi: đo cache thật ngày 28/07 thấy sóng âm chiếm **96%** bộ nhớ đệm
   * (15.711 file PNG = 175,7 MB; thumbnail JPG chỉ 775 file = 7,1 MB). File
   * sóng âm to nhất lên tới 822 KB. `showwavespic` xuất PNG nén rất kém với
   * loại ảnh này. WebP q80 (có kênh trong suốt) nhỏ hơn khoảng 70%.
   *
   * Tương thích ngược: file `wf_*.png` cũ vẫn dùng bình thường, không ai phải
   * render lại. Muốn thu nhỏ cache cũ thì xoá bộ nhớ đệm rồi bấm "Render
   * preview" một lần.
   *
   * Nếu thấy sóng bị nhoè: đổi `-quality 80` thành `-lossless 1` (vẫn nhỏ hơn
   * PNG ~26% mà không mất nét chút nào).
   */
  const webpPath = path.join(thumbsDir, `wf_${id}.webp`)
  const pngPath = path.join(thumbsDir, `wf_${id}.png`)
  if (fs.existsSync(webpPath)) return webpPath
  if (fs.existsSync(pngPath)) return pngPath

  try {
    const args = [
      '-i',
      filePath,
      '-filter_complex',
      // 800x200 cho nét ở lưới lớn. Màu = --accent (#5b8dff) của design system.
      // Đổi màu/kích cỡ ở đây thì các file wf_* ĐÃ CACHE vẫn giữ bản cũ —
      // phải bấm "Xoá bộ nhớ đệm Cache" trong Cài đặt để sinh lại.
      'showwavespic=s=800x200:colors=0x5b8dff',
      '-update',
      '1',
      '-frames:v',
      '1',
      '-c:v',
      'libwebp',
      '-quality',
      '80',
      webpPath,
      '-y',
    ]
    await execFileAsync(ffmpegPath, args)
    if (fs.existsSync(webpPath)) {
      return webpPath
    }
  } catch (err) {
    // WebP không dựng được (bản FFmpeg thiếu libwebp) -> lùi về PNG như cũ.
    try {
      const pngArgs = [
        '-i',
        filePath,
        '-filter_complex',
        'showwavespic=s=800x200:colors=0x5b8dff',
        '-update',
        '1',
        '-frames:v',
        '1',
        pngPath,
        '-y',
      ]
      await execFileAsync(ffmpegPath, pngArgs)
      if (fs.existsSync(pngPath)) {
        return pngPath
      }
    } catch {
      // Tránh thử đi thử lại nếu file audio hỏng
    }
  }

  return ''
}
