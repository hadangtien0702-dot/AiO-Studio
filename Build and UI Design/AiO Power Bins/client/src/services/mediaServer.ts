/**
 * mediaServer.ts — máy chủ media nội bộ (chỉ 127.0.0.1) chạy bằng Node trong panel.
 *
 * Vì sao cần: Premiere nạp panel qua file://, Chromium chặn trang file:// đọc file
 * khác trên đĩa => <img>/<video> không tải được. Phục vụ qua HTTP localhost sẽ:
 *   - Bỏ qua hoàn toàn hạn chế file://
 *   - Hỗ trợ Range request => video tua/stream mượt, không phải nạp cả file
 *   - Cho phép CEF dùng tăng tốc phần cứng khi giải mã video
 *
 * Bảo mật: chỉ lắng nghe trên 127.0.0.1 và yêu cầu token ngẫu nhiên sinh lúc chạy,
 * nên tiến trình/trang web khác trên máy không dò được đường dẫn file.
 */
import { nodeRequire } from '../lib/node'
import { userDataPath } from '../lib/cep'

let baseUrl = ''
let token = ''

const MIME: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  aif: 'audio/aiff',
  aiff: 'audio/aiff',
}

/** Máy chủ đã sẵn sàng chưa. */
export function mediaServerReady(): boolean {
  return baseUrl !== ''
}

/**
 * Khởi động máy chủ media (idempotent). Trả về baseUrl, hoặc '' nếu không dùng được.
 */
export function startMediaServer(): Promise<string> {
  if (baseUrl) return Promise.resolve(baseUrl)

  const req = nodeRequire()
  if (!req) return Promise.resolve('')

  let http: any, fs: any, urlMod: any, pathMod: any
  try {
    http = req('http')
    fs = req('fs')
    urlMod = req('url')
    pathMod = req('path')
  } catch {
    return Promise.resolve('')
  }

  token =
    Math.random().toString(36).slice(2) + Date.now().toString(36)

  return new Promise((resolve) => {
    const server = http.createServer((request: any, response: any) => {
      try {
        const parsed = urlMod.parse(request.url, true)

        if (parsed.pathname !== '/media' || parsed.query.t !== token) {
          response.writeHead(403)
          response.end('forbidden')
          return
        }

        const filePath = String(parsed.query.p || '')
        if (!filePath) {
          response.writeHead(400)
          response.end('bad request')
          return
        }

        let stat: any
        try {
          stat = fs.statSync(filePath)
        } catch {
          response.writeHead(404)
          response.end('not found')
          return
        }

        const ext = String(pathMod.extname(filePath)).slice(1).toLowerCase()
        const mime = MIME[ext] || 'application/octet-stream'
        const range = request.headers.range

        // [0.10.0] File DẪN XUẤT (thumbs/proxies trong <userData>/AiOPowerBins):
        // tên chứa hash id => nội dung bất biến => cho Chromium cache hẳn.
        // Trước đây no-cache cho tất cả — cuộn xuống rồi lên là tải lại toàn
        // bộ thumbnail từ đầu. File GỐC của người dùng vẫn no-cache (họ có
        // thể thay file trên đĩa mà giữ nguyên tên).
        let cacheControl = 'no-cache'
        try {
          const dataRoot = pathMod
            .join(userDataPath() || '', 'AiOPowerBins')
            .toLowerCase()
          if (dataRoot.length > 'AiOPowerBins'.length && filePath.toLowerCase().startsWith(dataRoot)) {
            cacheControl = 'public, max-age=31536000, immutable'
          }
        } catch {
          /* giữ no-cache */
        }

        if (range) {
          // Phát một phần file -> cho phép tua nhanh, không nạp toàn bộ.
          const m = /bytes=(\d*)-(\d*)/.exec(range)
          const start = m && m[1] ? parseInt(m[1], 10) : 0
          const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1
          response.writeHead(206, {
            'Content-Type': mime,
            'Content-Length': end - start + 1,
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': cacheControl,
          })
          fs.createReadStream(filePath, { start, end }).pipe(response)
        } else {
          response.writeHead(200, {
            'Content-Type': mime,
            'Content-Length': stat.size,
            'Accept-Ranges': 'bytes',
            'Cache-Control': cacheControl,
          })
          fs.createReadStream(filePath).pipe(response)
        }
      } catch {
        try {
          response.writeHead(500)
          response.end()
        } catch {
          /* ignore */
        }
      }
    })

    server.on('error', () => resolve(''))
    // Cổng 0 = hệ điều hành tự cấp cổng trống.
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      baseUrl = `http://127.0.0.1:${addr.port}`
      resolve(baseUrl)
    })
  })
}

/** Sinh URL phát/hiển thị cho một file trên đĩa. */
export function mediaUrl(filePath: string): string {
  if (!filePath) return ''
  // Ảnh nhúng sẵn (data:) và URL tuyệt đối (http/blob) không cần đi qua máy
  // chủ — dùng thẳng. Nhờ vậy bản xem thử trên trình duyệt (không có Node)
  // hiển thị được sóng âm demo + video demo để ĐO hover→frame thật.
  if (/^(data:|blob:|https?:)/.test(filePath)) return filePath
  if (!baseUrl) return ''
  return `${baseUrl}/media?t=${token}&p=${encodeURIComponent(filePath)}`
}
