import { execFileAsync, getFFprobePath } from './ffmpeg'

export interface AssetProbeMeta {
  duration?: number
  width?: number
  height?: number
  codec?: string
  fps?: number
  bitrate?: number
}

/**
 * Đọc metadata chi tiết của file media qua ffprobe.
 *
 * @param kind Biết trước loại file thì chỉ đọc đúng stream đó
 *   (`-select_streams`) — ffprobe khỏi phân tích các stream không cần,
 *   nhanh hơn rõ rệt khi chạy hàng chục nghìn file.
 */
export async function probeMedia(
  filePath: string,
  kind?: 'video' | 'audio',
): Promise<AssetProbeMeta> {
  const ffprobePath = getFFprobePath()
  if (!ffprobePath) {
    return {}
  }

  try {
    const args = [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      // Chỉ chọn stream khi biết loại; không biết thì giữ nguyên như cũ.
      ...(kind === 'video' ? ['-select_streams', 'v:0'] : []),
      ...(kind === 'audio' ? ['-select_streams', 'a:0'] : []),
      filePath,
    ]
    const { stdout } = await execFileAsync(ffprobePath, args)
    const data = JSON.parse(stdout)

    let duration: number | undefined
    let width: number | undefined
    let height: number | undefined
    let codec: string | undefined
    let fps: number | undefined
    let bitrate: number | undefined

    if (data.format) {
      if (data.format.duration) {
        const d = parseFloat(data.format.duration)
        if (!isNaN(d) && d > 0) duration = d
      }
      if (data.format.bit_rate) {
        const b = parseInt(data.format.bit_rate, 10)
        if (!isNaN(b) && b > 0) bitrate = b
      }
    }

    if (Array.isArray(data.streams)) {
      // Ưu tiên video stream trước, sau đó tới audio stream
      const vStream = data.streams.find((s: any) => s.codec_type === 'video')
      const aStream = data.streams.find((s: any) => s.codec_type === 'audio')
      const targetStream = vStream || aStream

      if (targetStream) {
        codec = targetStream.codec_name
        if (targetStream.width) width = targetStream.width
        if (targetStream.height) height = targetStream.height

        if (targetStream.r_frame_rate) {
          const parts = targetStream.r_frame_rate.split('/')
          if (parts.length === 2) {
            const num = parseFloat(parts[0])
            const den = parseFloat(parts[1])
            if (den > 0) {
              const calcFps = num / den
              if (!isNaN(calcFps) && calcFps > 0) fps = Math.round(calcFps * 100) / 100
            }
          } else {
            const f = parseFloat(targetStream.r_frame_rate)
            if (!isNaN(f) && f > 0) fps = Math.round(f * 100) / 100
          }
        }
      }
    }

    return { duration, width, height, codec, fps, bitrate }
  } catch (err) {
    return {}
  }
}
