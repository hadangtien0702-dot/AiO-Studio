import { getFs, getPath } from '../lib/node'
import { execFileAsync, getFFmpegPath } from './ffmpeg'
import { cacheThumbsDir } from './cachePaths'

/**
 * [0.18.0] Đường dẫn do `cachePaths.ts` quyết định — người dùng đổi được chỗ
 * lưu cache sang ổ khác (ổ C hay đầy). Giữ nguyên tên hàm vì nhiều file gọi.
 * KHÔNG memo ở đây nữa: đổi chỗ lưu xong mà còn giữ bản nhớ cũ thì file mới
 * vẫn ghi vào ổ cũ.
 */
export function getThumbsDir(): string {
  return cacheThumbsDir()
}

/**
 * Sinh ảnh thumbnail cho video clip (lấy frame giữa clip hoặc 1s).
 */
export async function generateVideoThumbnail(
  id: string,
  filePath: string,
  duration?: number
): Promise<string> {
  const ffmpegPath = getFFmpegPath()
  const thumbsDir = getThumbsDir()
  const fs = getFs()
  const path = getPath()

  if (!ffmpegPath || !thumbsDir || !fs || !path) return ''

  // [1.2.0-dev.1] Ưu tiên WebP 320px nhẹ gấp 4 lần (~12KB so với ~60KB JPG).
  // Tương thích ngược: Nếu file .webp hoặc .jpg cũ đã tồn tại thì dùng lại ngay.
  const webpPath = path.join(thumbsDir, `${id}.webp`)
  const jpgPath = path.join(thumbsDir, `${id}.jpg`)

  if (fs.existsSync(webpPath)) return webpPath
  if (fs.existsSync(jpgPath)) return jpgPath

  // Chọn thời điểm trích xuất frame (ở giữa clip hoặc 1.0 giây)
  const seekTime = duration && duration > 2 ? Math.floor(duration / 2) : 1

  try {
    const args = [
      '-hwaccel',
      'auto',
      '-ss',
      seekTime.toString(),
      '-i',
      filePath,
      '-vframes',
      '1',
      '-c:v',
      'libwebp',
      '-quality',
      '75',
      '-vf',
      'scale=320:-1',
      webpPath,
      '-y',
    ]
    await execFileAsync(ffmpegPath, args)
    if (fs.existsSync(webpPath)) {
      return webpPath
    }
  } catch (err) {
    // Nếu trích xuất WebP ở giữa bị lỗi, thử lại ở 0 giây với WebP
    try {
      const fallbackArgs = [
        '-ss',
        '0',
        '-i',
        filePath,
        '-vframes',
        '1',
        '-c:v',
        'libwebp',
        '-quality',
        '75',
        '-vf',
        'scale=320:-1',
        webpPath,
        '-y',
      ]
      await execFileAsync(ffmpegPath, fallbackArgs)
      if (fs.existsSync(webpPath)) {
        return webpPath
      }
    } catch {
      // Nếu WebP không hỗ trợ trên hệ thống, fallback sinh JPG 320px
      try {
        const jpgArgs = [
          '-ss',
          '0',
          '-i',
          filePath,
          '-vframes',
          '1',
          '-q:v',
          '5',
          '-vf',
          'scale=320:-1',
          jpgPath,
          '-y',
        ]
        await execFileAsync(ffmpegPath, jpgArgs)
        if (fs.existsSync(jpgPath)) {
          return jpgPath
        }
      } catch {}
    }
  }

  return ''
}
